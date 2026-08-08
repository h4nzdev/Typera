import React, { useState, useEffect, useCallback, useRef } from 'react';
import BattleHeader from '../components/battle/BattleHeader';
import PlayerPanel from '../components/battle/PlayerPanel';
import TypingText from '../components/battle/TypingText';
import StatsPanel from '../components/battle/StatsPanel';
import VirtualKeyboard from '../components/battle/VirtualKeyboard';
import OpponentActivity from '../components/battle/OpponentActivity';
import ComboDisplay from '../components/battle/ComboDisplay';
import ArcadeText from '../components/arcade/ArcadeText';
import ArcadeButton from '../components/arcade/ArcadeButton';
import { useNavigate } from 'react-router-dom';
import useMatchStore from '../store/useMatchStore';
import { playSound } from '../lib/sounds';

const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog and runs across the street under the bright moonlight.";
const MATCH_DURATION = 60; // 60 seconds match

const BattlePage = () => {
  const navigate = useNavigate();
  const { players, isHost, broadcastStats, opponentStats, matchCode, localReady, opponentReady, setLocalReady } = useMatchStore();
  
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [pressedKey, setPressedKey] = useState(null);
  const [combo, setCombo] = useState(0);
  
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [timeLeft, setTimeLeft] = useState(MATCH_DURATION);
  const [isMatchActive, setIsMatchActive] = useState(false);
  
  const [battlePhase, setBattlePhase] = useState('waiting'); // waiting, countdown, playing
  const [countdown, setCountdown] = useState(null);

  const statsRef = useRef({ totalKeystrokes: 0, errors: 0 });
  const maxComboRef = useRef(0);

  // Helper to transition to results
  const endGame = useCallback((isWinner) => {
    setIsMatchActive(false);
    setBattlePhase('finished');
    
    // If the player didn't type a single key, accuracy should be 0, not the default 100.
    const finalAccuracy = statsRef.current.totalKeystrokes === 0 ? 0 : accuracy;
    
    navigate('/result', {
      state: {
        isWinner,
        wpm,
        accuracy: finalAccuracy,
        maxCombo: maxComboRef.current
      }
    });
  }, [navigate, wpm, accuracy]);

  // Handle Ready Handshake
  useEffect(() => {
    if (localReady && opponentReady && battlePhase === 'waiting') {
      setBattlePhase('countdown');
    }
  }, [localReady, opponentReady, battlePhase]);

  // Block the back button during gameplay
  useEffect(() => {
    if (battlePhase === 'playing') {
      window.history.pushState(null, "", window.location.pathname);
      const handlePopState = () => {
        window.history.pushState(null, "", window.location.pathname);
      };
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [battlePhase]);

  // Run Countdown
  useEffect(() => {
    if (battlePhase === 'countdown') {
      setCountdown(3);
      playSound('start'); // generic blip to signify handshake done
      
      let count = 3;
      const countInterval = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
          playSound('hover'); // tick
        } else if (count === 0) {
          setCountdown('TYPE!');
          playSound('start'); // high pitch go
        } else {
          clearInterval(countInterval);
          setBattlePhase('playing');
          setStartTime(Date.now());
          setIsMatchActive(true);
        }
      }, 1000);
      return () => clearInterval(countInterval);
    }
  }, [battlePhase]);

  // Opponent Finish Observer
  useEffect(() => {
    if (battlePhase === 'playing' && opponentStats.progress >= 100) {
      // Opponent finished first, we lose!
      endGame(false);
    }
  }, [opponentStats.progress, battlePhase, endGame]);

  const handleKeyDown = useCallback((e) => {
    // Prevent spacebar from scrolling the page
    if (e.key === ' ') e.preventDefault();

    if (battlePhase !== 'playing') return;
    if (e.key.length > 1 && e.key !== 'Backspace') return;
    if (timeLeft <= 0) return;
    if (typed.length >= SAMPLE_TEXT.length && e.key !== 'Backspace') return;

    setPressedKey(e.key);
    setTimeout(() => setPressedKey(null), 150);

    const hasTypos = typed !== SAMPLE_TEXT.slice(0, typed.length);

    if (e.key === 'Backspace') {
      playSound('keyPress');
      setTyped(prev => {
        const next = prev.slice(0, -1);
        let correctCount = 0;
        for (let i = 0; i < next.length; i++) {
          if (next[i] === SAMPLE_TEXT[i]) correctCount++;
          else break;
        }
        const newProgress = Math.min(100, Math.round((correctCount / SAMPLE_TEXT.length) * 100)) || 0;
        broadcastStats({ progress: newProgress, wpm, accuracy, combo: 0 });
        return next;
      });
      setCombo(0); 
      return;
    }

    if (hasTypos) {
      playSound('error');
      return;
    }

    statsRef.current.totalKeystrokes += 1;
    
    setTyped(prev => {
      const nextIndex = prev.length;
      if (nextIndex >= SAMPLE_TEXT.length) return prev;

      const nextChar = e.key;
      const expectedChar = SAMPLE_TEXT[nextIndex];
      let next = prev + nextChar;
      
      let newWpm = wpm;
      let newAcc = accuracy;
      let newCombo = combo;

      if (nextChar !== expectedChar) {
        playSound('error');
        statsRef.current.errors += 1;
        newCombo = 0;
        setCombo(0);
      } else {
        playSound('keyPress');
        setCombo(c => {
          newCombo = c + 1;
          maxComboRef.current = Math.max(maxComboRef.current, newCombo);
          if (newCombo % 10 === 0) playSound('combo');
          return newCombo;
        });
      }
      
      const total = statsRef.current.totalKeystrokes;
      const errs = statsRef.current.errors;
      const correct = total - errs;
      newAcc = Math.max(0, Math.round((correct / total) * 100));
      setAccuracy(newAcc);

      const timeElapsedMinutes = (Date.now() - startTime) / 1000 / 60;
      if (timeElapsedMinutes > 0) {
          newWpm = Math.max(0, Math.round(((total / 5) - errs) / timeElapsedMinutes));
          setWpm(newWpm);
      }

      let correctCount = 0;
      for (let i = 0; i < next.length; i++) {
        if (next[i] === SAMPLE_TEXT[i]) correctCount++;
        else break;
      }
      const newProgress = Math.min(100, Math.round((correctCount / SAMPLE_TEXT.length) * 100)) || 0;
      
      broadcastStats({ progress: newProgress, wpm: newWpm, accuracy: newAcc, combo: newCombo });
      
      if (next === SAMPLE_TEXT) {
         setTimeout(() => endGame(true), 300);
      }
      
      return next;
    });
  }, [typed, startTime, timeLeft, wpm, accuracy, combo, broadcastStats, battlePhase, endGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Timer and WPM decay interval
  useEffect(() => {
    let interval;
    if (isMatchActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            // Time ran out! Compare progress to decide winner
            const finalProgress = Math.min(100, Math.round((typed.length / SAMPLE_TEXT.length) * 100)) || 0;
            const isWinner = finalProgress >= opponentStats.progress;
            endGame(isWinner);
            return 0;
          }
          return prev - 1;
        });
        
        if (startTime) {
          const timeElapsedMinutes = (Date.now() - startTime) / 1000 / 60;
          const total = statsRef.current.totalKeystrokes;
          const errs = statsRef.current.errors;
          if (timeElapsedMinutes > 0) {
            const currentWpm = Math.max(0, Math.round(((total / 5) - errs) / timeElapsedMinutes));
            setWpm(currentWpm);
            const progress = Math.min(100, Math.round((typed.length / SAMPLE_TEXT.length) * 100)) || 0;
            broadcastStats({ progress, wpm: currentWpm, accuracy, combo });
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMatchActive, timeLeft, startTime, broadcastStats, typed, accuracy, combo, opponentStats.progress, endGame]);

  const progress = Math.min(100, Math.round((typed.length / SAMPLE_TEXT.length) * 100)) || 0;
  
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-black/50 overflow-hidden p-4 md:p-8 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.03)_0%,transparent_80%)] pointer-events-none"></div>
      
      {/* Ready Overlay */}
      {battlePhase === 'waiting' && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
          {!localReady ? (
            <ArcadeButton color="cyan" className="text-4xl px-16 py-8 animate-pulse" onClick={setLocalReady}>
              READY
            </ArcadeButton>
          ) : (
            <ArcadeText color="pink" glow className="text-3xl animate-pulse">
              WAITING FOR OPPONENT...
            </ArcadeText>
          )}
        </div>
      )}

      {/* Countdown Overlay */}
      {battlePhase === 'countdown' && (
        <div className="absolute inset-0 z-50 bg-black/60 flex flex-col items-center justify-center pointer-events-none backdrop-blur-sm">
          <ArcadeText 
            key={countdown} 
            as="h1" 
            color={countdown === 'TYPE!' ? 'cyan' : 'pink'} 
            glow 
            className="text-[150px] animate-ping-once"
            style={{ animation: 'zoomFade 0.9s forwards' }}
          >
            {countdown}
          </ArcadeText>
          <style>{`
            @keyframes zoomFade {
              0% { transform: scale(0.5); opacity: 0; }
              50% { transform: scale(1.2); opacity: 1; }
              100% { transform: scale(1.5); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      <div className="w-full mx-auto flex flex-col z-10 h-full flex-grow justify-between max-w-[1800px]">
        {/* Top Section */}
        <div className="flex flex-col gap-6 w-full">
          <BattleHeader timeLeft={formatTime(timeLeft)} matchCode={matchCode} />
          
          {/* Player Panels Row */}
          <div className="flex justify-between items-center w-full mt-2">
            <PlayerPanel 
               player="PLAYER 1" 
               name={isHost ? "HOST" : "CHALLENGER"} 
               isYou={isHost} 
               progress={isHost ? progress : opponentStats.progress} 
               wpm={isHost ? wpm : opponentStats.wpm} 
               color="cyan" 
            />
            <div className="flex flex-col items-center mx-4">
              <ArcadeText as="div" color="cyan" glow className="text-7xl italic font-bold -skew-x-12">V<span className="text-[var(--color-neon-pink)]">S</span></ArcadeText>
            </div>
            <PlayerPanel 
               player="PLAYER 2" 
               name={!isHost ? "HOST" : "CHALLENGER"} 
               isYou={!isHost} 
               progress={!isHost ? progress : opponentStats.progress} 
               wpm={!isHost ? wpm : opponentStats.wpm} 
               color="pink" 
               reverse={true} 
            />
          </div>
        </div>
        
        {/* Main Battle Section */}
        <div className="flex gap-6 xl:gap-10 w-full items-stretch flex-grow my-8">
          <OpponentActivity 
             progress={opponentStats.progress} 
             wpm={opponentStats.wpm} 
             accuracy={opponentStats.accuracy} 
             combo={opponentStats.combo} 
          />
          <div className="flex-1 flex flex-col justify-center">
            <TypingText text={SAMPLE_TEXT} typed={typed} />
          </div>
          <ComboDisplay combo={combo} best={combo} />
        </div>
        
        {/* Bottom Section */}
        <div className="flex flex-col items-center w-full max-w-6xl mx-auto gap-8 mt-auto pb-4">
          <StatsPanel 
            wpm={wpm.toString()} 
            accuracy={`${accuracy}%`} 
            chars={`${typed.length}/${SAMPLE_TEXT.length}`} 
            combo={`×${combo}`} 
          />
          <VirtualKeyboard pressedKey={pressedKey} />
        </div>
      </div>
    </div>
  );
};

export default BattlePage;

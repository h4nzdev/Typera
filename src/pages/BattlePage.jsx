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

const MATCH_DURATION = 60; // 60 seconds match

const BattlePage = () => {
  const navigate = useNavigate();
  const { 
    matchCode, 
    isHost, 
    opponentStats, 
    localReady, 
    opponentReady, 
    setLocalReady, 
    broadcastStats,
    challengeText,
    isPaused,
    setPaused
  } = useMatchStore();
  
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [pressedKey, setPressedKey] = useState(null);
  const [combo, setCombo] = useState(0);
  const [shake, setShake] = useState(false);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  }, []);
  
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
        maxCombo: maxComboRef.current,
        mode: 'battle'
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

  // Block Ctrl+R and F5
  useEffect(() => {
    const handleKeyDownGlobal = (e) => {
      if ((e.ctrlKey && e.key.toLowerCase() === 'r') || e.key === 'F5') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDownGlobal);
    return () => window.removeEventListener('keydown', handleKeyDownGlobal);
  }, []);

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

  // Check for opponent finish
  useEffect(() => {
    if (opponentStats.progress === 100 && battlePhase === 'playing') {
      endGame(false);
    }
  }, [opponentStats.progress, battlePhase, endGame]);

  const handleKeyDown = useCallback((e) => {
    // Prevent spacebar from scrolling the page
    if (e.key === ' ') e.preventDefault();

    if (isPaused) return;
    if (battlePhase !== 'playing') return;
    if (e.key.length > 1 && e.key !== 'Backspace') return;
    if (timeLeft <= 0) return;
    if (typed.length >= challengeText.length && e.key !== 'Backspace') return;

    setPressedKey(e.key);
    setTimeout(() => setPressedKey(null), 150);

    const hasTypos = typed !== challengeText.slice(0, typed.length);

    if (e.key === 'Backspace') {
      playSound('keyPress');
      setTyped(prev => {
        const next = prev.slice(0, -1);
        let correctCount = 0;
        for (let i = 0; i < next.length; i++) {
          if (next[i] === challengeText[i]) correctCount++;
          else break;
        }
        const newProgress = Math.min(100, Math.round((correctCount / challengeText.length) * 100)) || 0;
        broadcastStats({ progress: newProgress, wpm, accuracy, combo: 0 });
        return next;
      });
      setCombo(0); 
      return;
    }

    if (hasTypos) {
      playSound('error');
      triggerShake();
      return;
    }

    statsRef.current.totalKeystrokes += 1;
    
    setTyped(prev => {
      const nextIndex = prev.length;
      if (nextIndex >= challengeText.length) return prev;

      const nextChar = e.key;
      const expectedChar = challengeText[nextIndex];
      let next = prev + nextChar;
      
      let newWpm = wpm;
      let newAcc = accuracy;
      let newCombo = combo;

      if (nextChar !== expectedChar) {
        playSound('error');
        triggerShake();
        statsRef.current.errors += 1;
        newCombo = 0;
      } else {
        playSound('keyPress');
        newCombo = combo + 1;
        maxComboRef.current = Math.max(maxComboRef.current, newCombo);
        if (newCombo > 0 && newCombo % 10 === 0) playSound('combo');
      }
      setCombo(newCombo);
      
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
        if (next[i] === challengeText[i]) correctCount++;
        else break;
      }
      const newProgress = Math.min(100, Math.round((correctCount / challengeText.length) * 100)) || 0;
      
      broadcastStats({ progress: newProgress, wpm: newWpm, accuracy: newAcc, combo: newCombo });
      
      if (next === challengeText) {
         setTimeout(() => endGame(true), 300);
      }
      
      return next;
    });
  }, [typed, startTime, timeLeft, wpm, accuracy, combo, broadcastStats, battlePhase, endGame, isPaused, triggerShake]);

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
            const finalProgress = Math.min(100, Math.round((typed.length / challengeText.length) * 100)) || 0;
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
            const progress = Math.min(100, Math.round((typed.length / challengeText.length) * 100)) || 0;
            broadcastStats({ progress, wpm: currentWpm, accuracy, combo });
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMatchActive, timeLeft, startTime, broadcastStats, typed, accuracy, combo, opponentStats.progress, endGame]);

  const handleRestart = () => {
    playSound('click');
    setTyped('');
    setStartTime(null);
    setPressedKey(null);
    setCombo(0);
    setWpm(0);
    setAccuracy(100);
    setTimeLeft(MATCH_DURATION);
    setIsMatchActive(false);
    setPaused(false);
    setBattlePhase('waiting');
    setLocalReady(false);
    statsRef.current = { totalKeystrokes: 0, errors: 0 };
    maxComboRef.current = 0;
    broadcastStats({ progress: 0, wpm: 0, accuracy: 100, combo: 0 });
  };

  const progress = Math.min(100, Math.round((typed.length / challengeText.length) * 100)) || 0;
  
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-black/50 overflow-hidden p-4 md:p-8 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.03)_0%,transparent_80%)] pointer-events-none"></div>
      
      {/* Pause Modal Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
          <ArcadeText color="cyan" glow className="text-6xl mb-8">PAUSED</ArcadeText>
          <div className="flex flex-col gap-4 w-64">
            <ArcadeButton color="cyan" onClick={() => { playSound('click'); setPaused(false); }}>
              RESUME
            </ArcadeButton>
            <ArcadeButton color="pink" onClick={handleRestart}>
              RESTART
            </ArcadeButton>
            <ArcadeButton color="white" onClick={() => { playSound('click'); useMatchStore.getState().leaveMatch(); navigate('/'); }}>
              MAIN MENU
            </ArcadeButton>
          </div>
        </div>
      )}

      {/* Ready Overlay */}
      {battlePhase === 'waiting' && !isPaused && (
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
      {battlePhase === 'countdown' && !isPaused && (
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
          <BattleHeader timeLeft={formatTime(timeLeft)} matchCode={matchCode} onPause={() => { playSound('click'); setPaused(true); }} />
          
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
        <div className={`flex flex-col lg:flex-row items-start justify-center gap-8 z-10 w-full max-w-6xl transition-transform ${shake ? 'animate-shake' : ''}`}>
          
          <div className="hidden lg:block">
            <OpponentActivity 
              progress={opponentStats.progress} 
              wpm={opponentStats.wpm} 
              accuracy={opponentStats.accuracy} 
              combo={opponentStats.combo} 
              color={isHost ? 'pink' : 'cyan'}
            />
          </div>

          {/* Main Typing Section */}
          <div className="flex-1 w-full max-w-4xl flex flex-col items-center">
            <TypingText text={challengeText} typed={typed} />
          </div>
          <ComboDisplay combo={combo} best={combo} />
        </div>
        
        {/* Bottom Section */}
        <div className="flex flex-col items-center w-full max-w-6xl mx-auto gap-4 mt-auto pb-4 relative z-30">
          <StatsPanel 
            wpm={wpm.toString()} 
            accuracy={`${accuracy}%`} 
            chars={`${typed.length}/${challengeText.length}`} 
            combo={`×${combo}`} 
          />
          <VirtualKeyboard pressedKey={pressedKey} />
        </div>
      </div>

      {/* Badges UI - Bottom Left */}
      <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 z-20 flex gap-4 pointer-events-none">
        {[1, 2, 3].map((badge) => (
          <div key={badge} className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 border-[var(--color-neon-cyan)] bg-black/50 flex items-center justify-center shadow-[0_0_10px_var(--color-neon-cyan-muted),inset_0_0_10px_var(--color-neon-cyan-muted)]">
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[var(--color-neon-cyan-muted)]"></div>
          </div>
        ))}
      </div>

      {/* Trophy UI - Bottom Right */}
      <div className="absolute bottom-4 md:bottom-8 right-4 md:right-8 z-20 flex items-center justify-center pointer-events-none">
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl border-2 border-[var(--color-neon-yellow)] bg-yellow-900/30 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(255,251,0,0.4),inset_0_0_10px_rgba(255,251,0,0.2)]">
          <span className="text-xl md:text-3xl filter drop-shadow-[0_0_5px_rgba(255,251,0,0.8)]">🏆</span>
        </div>
      </div>
    </div>
  );
};

export default BattlePage;

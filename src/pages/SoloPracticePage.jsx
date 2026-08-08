import React, { useState, useEffect, useCallback, useRef } from 'react';
import BattleHeader from '../components/battle/BattleHeader';
import PlayerPanel from '../components/battle/PlayerPanel';
import TypingText from '../components/battle/TypingText';
import StatsPanel from '../components/battle/StatsPanel';
import VirtualKeyboard from '../components/battle/VirtualKeyboard';
import ComboDisplay from '../components/battle/ComboDisplay';
import ArcadeButton from '../components/arcade/ArcadeButton';
import ArcadeText from '../components/arcade/ArcadeText';
import { useNavigate } from 'react-router-dom';
import { playSound } from '../lib/sounds';
import typingData from '../data/type_battle_word_data.json';

const generateChallenge = (count = 15) => {
  const words = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * typingData.all.length);
    words.push(typingData.all[randomIndex]);
  }
  return words.join(" ");
};

const MATCH_DURATION = 60; // 60 seconds match

const SoloPracticePage = () => {
  const navigate = useNavigate();
  const [challengeText, setChallengeText] = useState(() => generateChallenge(15));
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [pressedKey, setPressedKey] = useState(null);
  const [combo, setCombo] = useState(0);
  
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [timeLeft, setTimeLeft] = useState(MATCH_DURATION);
  const [isMatchActive, setIsMatchActive] = useState(false);

  const [isPaused, setIsPaused] = useState(false);

  const maxComboRef = useRef(0);
  const statsRef = useRef({ totalKeystrokes: 0, errors: 0 });

  const handleKeyDown = useCallback((e) => {
    // Prevent spacebar from scrolling the page
    if (e.key === ' ') e.preventDefault();

    if (isPaused) return;
    if (e.key.length > 1 && e.key !== 'Backspace') return;
    if (timeLeft <= 0) return;
    if (typed.length >= challengeText.length && e.key !== 'Backspace') return;

    if (!startTime) {
      setStartTime(Date.now());
      setIsMatchActive(true);
    }

    setPressedKey(e.key);
    setTimeout(() => setPressedKey(null), 150);

    const hasTypos = typed !== challengeText.slice(0, typed.length);

    if (e.key === 'Backspace') {
      playSound('keyPress');
      setTyped(prev => prev.slice(0, -1));
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
      if (nextIndex >= challengeText.length) return prev;

      const nextChar = e.key;
      const expectedChar = challengeText[nextIndex];
      let next = prev + nextChar;
      
      let newCombo = combo;

      if (nextChar !== expectedChar) {
        playSound('error');
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
      setAccuracy(Math.max(0, Math.round((correct / total) * 100)));

      const timeElapsedMinutes = (Date.now() - (startTime || Date.now())) / 1000 / 60;
      if (timeElapsedMinutes > 0) {
          setWpm(Math.max(0, Math.round(((total / 5) - errs) / timeElapsedMinutes)));
      }

      return next;
    });
  }, [typed, startTime, timeLeft, isPaused, combo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Timer and WPM decay interval
  useEffect(() => {
    let interval;
    if (isMatchActive && timeLeft > 0 && !isPaused) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsMatchActive(false);
            setTimeout(() => {
              navigate('/result', {
                state: {
                  isWinner: true,
                  wpm,
                  accuracy,
                  maxCombo: maxComboRef.current,
                  mode: 'solo'
                }
              });
            }, 1000);
            return 0;
          }
          return prev - 1;
        });
        
        // Decay WPM if time passes without typing
        if (startTime) {
          const timeElapsedMinutes = (Date.now() - startTime) / 1000 / 60;
          const total = statsRef.current.totalKeystrokes;
          const errs = statsRef.current.errors;
          if (timeElapsedMinutes > 0) {
            setWpm(Math.max(0, Math.round(((total / 5) - errs) / timeElapsedMinutes)));
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMatchActive, timeLeft, startTime, navigate, wpm, accuracy, isPaused]);

  // Finish condition
  useEffect(() => {
    if (typed.length > 0 && typed.length === challengeText.length) {
      setIsMatchActive(false);
      setTimeout(() => {
        navigate('/result', {
          state: {
            isWinner: true,
            wpm,
            accuracy,
            maxCombo: maxComboRef.current,
            mode: 'solo'
          }
        });
      }, 1000);
    }
  }, [typed, navigate, wpm, accuracy]);

  const handleRestart = () => {
    playSound('click');
    setChallengeText(generateChallenge(15));
    setTyped('');
    setStartTime(null);
    setPressedKey(null);
    setCombo(0);
    setWpm(0);
    setAccuracy(100);
    setTimeLeft(MATCH_DURATION);
    setIsMatchActive(false);
    setIsPaused(false);
    statsRef.current = { totalKeystrokes: 0, errors: 0 };
    maxComboRef.current = 0;
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
            <ArcadeButton color="cyan" onClick={() => { playSound('click'); setIsPaused(false); }}>
              RESUME
            </ArcadeButton>
            <ArcadeButton color="pink" onClick={handleRestart}>
              RESTART
            </ArcadeButton>
            <ArcadeButton color="white" onClick={() => { playSound('click'); navigate('/'); }}>
              MAIN MENU
            </ArcadeButton>
          </div>
        </div>
      )}

      <div className="w-full mx-auto flex flex-col z-10 h-full flex-grow justify-between max-w-[1800px]">
        {/* Top Section */}
        <div className="flex flex-col gap-6 w-full">
          <BattleHeader timeLeft={formatTime(timeLeft)} onPause={() => { playSound('click'); setIsPaused(true); }} />
          
          {/* Player Panels Row */}
          <div className="flex justify-between items-center w-full mt-2">
            <PlayerPanel player="PLAYER 1" name="SOLO" isYou={true} progress={progress} wpm={wpm} color="cyan" />
          </div>
        </div>
        
        {/* Main Battle Section */}
        <div className="flex gap-6 xl:gap-10 w-full items-stretch flex-grow my-8">
          <div className="w-64 xl:w-72 shrink-0 opacity-0 pointer-events-none hidden md:block"></div>
          <div className="flex-1 flex flex-col justify-center">
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
    </div>
  );
};

export default SoloPracticePage;

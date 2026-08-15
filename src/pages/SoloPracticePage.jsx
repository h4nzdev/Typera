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
import gsap from 'gsap';

const WORD_COUNTS = [10, 25, 50, 100];
const CATEGORIES = ['all', 'common', 'it', 'gaming', 'tech', 'fun'];

const generateChallengeWords = (count = 25, category = 'all') => {
  const words = [];
  const wordList = category === 'all' 
    ? typingData.all 
    : (typingData.categories[category] || typingData.all);
    
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    const word = wordList[randomIndex];
    words.push({ word, type: 'normal' });
  }
  return words;
};

const SoloPracticePage = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Setup States
  const [setupComplete, setSetupComplete] = useState(false);
  const [category, setCategory] = useState('all');
  const [wordCount, setWordCount] = useState(25);
  
  // Game States
  const [challengeWords, setChallengeWords] = useState([]);
  const challengeText = React.useMemo(() => challengeWords.map(w => w.word).join(" "), [challengeWords]);

  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [pressedKey, setPressedKey] = useState(null);
  const [combo, setCombo] = useState(0);
  
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMatchActive, setIsMatchActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);

  const maxComboRef = useRef(0);
  const statsRef = useRef({ totalKeystrokes: 0, errors: 0, wordErrors: 0 });

  useEffect(() => {
    if (!setupComplete) {
      const ctx = gsap.context(() => {
        gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 });
        gsap.fromTo('.sp-panel', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.5)', delay: 0.1 });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [setupComplete]);

  // Track CapsLock state dynamically
  useEffect(() => {
    const handleCapsLockCheck = (e) => {
      if (typeof e.getModifierState === 'function') {
        setIsCapsLock(e.getModifierState('CapsLock'));
      }
    };

    window.addEventListener('keydown', handleCapsLockCheck);
    window.addEventListener('keyup', handleCapsLockCheck);
    return () => {
      window.removeEventListener('keydown', handleCapsLockCheck);
      window.removeEventListener('keyup', handleCapsLockCheck);
    };
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === ' ') e.preventDefault();
    if (!setupComplete) return;
    if (isPaused) return;
    if (isCapsLock) return;

    if (e.key.length > 1 && e.key !== 'Backspace') return;
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
        statsRef.current.wordErrors += 1;
        newCombo = 0;
      } else {
        playSound('keyPress');
        newCombo = combo + 1;
        maxComboRef.current = Math.max(maxComboRef.current, newCombo);
        if (newCombo > 0 && newCombo % 10 === 0) playSound('combo');

        if (nextChar === ' ') {
          statsRef.current.wordErrors = 0;
        }
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
  }, [typed, startTime, isPaused, isCapsLock, combo, challengeText, setupComplete]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Stopwatch and WPM tracking
  useEffect(() => {
    let interval;
    if (isMatchActive && !isPaused) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
        
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
  }, [isMatchActive, startTime, isPaused]);

  // Finish condition
  useEffect(() => {
    if (setupComplete && typed.length > 0 && typed.length === challengeText.length) {
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
  }, [typed, navigate, wpm, accuracy, challengeText, setupComplete]);

  const handleStartPractice = () => {
    playSound('start');
    const newWords = generateChallengeWords(wordCount, category);
    setChallengeWords(newWords);
    setSetupComplete(true);
    setTyped('');
    setStartTime(null);
    setPressedKey(null);
    setCombo(0);
    setWpm(0);
    setAccuracy(100);
    setElapsedSeconds(0);
    setIsMatchActive(false);
    setIsPaused(false);
    statsRef.current = { totalKeystrokes: 0, errors: 0, wordErrors: 0 };
    maxComboRef.current = 0;
  };

  const handleRestart = () => {
    playSound('click');
    const newWords = generateChallengeWords(wordCount, category);
    setChallengeWords(newWords);
    setTyped('');
    setStartTime(null);
    setPressedKey(null);
    setCombo(0);
    setWpm(0);
    setAccuracy(100);
    setElapsedSeconds(0);
    setIsMatchActive(false);
    setIsPaused(false);
    statsRef.current = { totalKeystrokes: 0, errors: 0, wordErrors: 0 };
    maxComboRef.current = 0;
  };

  const progress = Math.min(100, Math.round((typed.length / (challengeText.length || 1)) * 100)) || 0;
  
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col bg-black/50 overflow-hidden relative" style={{ background: 'radial-gradient(ellipse at center, rgba(10,0,21,0.4) 0%, rgba(5,5,10,0.72) 100%)' }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.03)_0%,transparent_80%)] pointer-events-none"></div>

      {/* ── SETUP SCREEN ── */}
      {!setupComplete && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4">
          {/* Scanlines overlay for setup */}
          <div className="pointer-events-none absolute inset-0 z-0" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)',
          }} />
          
          <div className="sp-panel z-10 w-full max-w-md px-4 relative">
            <div className="relative border-4 p-1" style={{
              borderColor: '#39ff14',
              boxShadow: `0 0 0 2px #000, 0 0 20px rgba(57,255,20,0.6), 0 0 60px rgba(57,255,20,0.15), inset 0 0 20px rgba(0,0,0,0.8)`,
              imageRendering: 'pixelated',
            }}>
              <div className="absolute -top-2 -left-2 w-5 h-5 bg-[#39ff14] shadow-[0_0_8px_#39ff14]" />
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-[#39ff14] shadow-[0_0_8px_#39ff14]" />
              <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-[#39ff14] shadow-[0_0_8px_#39ff14]" />
              <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-[#39ff14] shadow-[0_0_8px_#39ff14]" />

              <div className="border-2 border-black/60 bg-black/80 p-6 flex flex-col items-center">
                <ArcadeText as="h1" color="green" glow className="text-4xl text-center mb-6 block">
                  SOLO PRACTICE
                </ArcadeText>

                <div className="flex flex-col gap-6 w-full">
                  
                  <div className="flex flex-col gap-2">
                    <span className="font-[family-name:var(--font-arcade)] text-xs tracking-widest text-[#39ff14]">WORD CATEGORY</span>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map(c => (
                        <button key={c} onClick={() => { playSound('click'); setCategory(c); }}
                          className={`font-[family-name:var(--font-arcade)] text-xs py-2 px-1 border-2 uppercase transition-all
                            ${category === c 
                              ? 'border-[#39ff14] bg-[#39ff14]/20 text-[#39ff14] shadow-[0_0_10px_rgba(57,255,20,0.4)]' 
                              : 'border-white/20 text-white/50 hover:border-white/40 hover:text-white'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="font-[family-name:var(--font-arcade)] text-xs tracking-widest text-[#39ff14]">WORD COUNT</span>
                    <div className="grid grid-cols-4 gap-2">
                      {WORD_COUNTS.map(count => (
                        <button key={count} onClick={() => { playSound('click'); setWordCount(count); }}
                          className={`font-[family-name:var(--font-arcade)] text-xs py-2 px-1 border-2 uppercase transition-all
                            ${wordCount === count 
                              ? 'border-[#39ff14] bg-[#39ff14]/20 text-[#39ff14] shadow-[0_0_10px_rgba(57,255,20,0.4)]' 
                              : 'border-white/20 text-white/50 hover:border-white/40 hover:text-white'}`}>
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t-2 border-[#39ff14]/30 pt-6 mt-2 flex flex-col gap-3">
                    <ArcadeButton color="green" className="w-full py-3" onClick={handleStartPractice}>
                      START PRACTICE ➔
                    </ArcadeButton>
                    <ArcadeButton color="white" className="w-full py-2 text-xs" onClick={() => { playSound('click'); navigate('/'); }}>
                      MAIN MENU
                    </ArcadeButton>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PRACTICE SCREEN ── */}
      {setupComplete && (
        <div className="flex flex-col h-full w-full p-4 md:p-8 relative z-10">
          
          {/* Caps Lock Warning Lock Screen Overlay */}
          {isCapsLock && !isPaused && (
            <div className="absolute inset-0 z-[80] bg-black/90 flex flex-col items-center justify-center backdrop-blur-md pointer-events-auto">
              <div className="relative border-4 border-yellow-400 p-1 shadow-[0_0_50px_rgba(255,215,0,0.5)]">
                <div className="border-2 border-black/50 bg-black/95 px-12 md:px-16 py-8 md:py-10 flex flex-col items-center gap-5 text-center">
                  <div className="text-6xl md:text-7xl animate-bounce">🔒</div>
                  <ArcadeText color="yellow" glow className="text-3xl md:text-5xl tracking-widest">
                    CAPS LOCK DETECTED!
                  </ArcadeText>
                  <p className="text-white/90 font-[family-name:var(--font-arcade)] text-sm md:text-base tracking-wider max-w-lg leading-relaxed">
                    PLEASE PRESS <span className="text-yellow-400 font-bold underline">[ CAPS LOCK ]</span> ON YOUR KEYBOARD TO UNLOCK AND CONTINUE TYPING!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pause Modal Overlay */}
          {isPaused && (
            <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
              <ArcadeText color="cyan" glow className="text-6xl mb-8">PAUSED</ArcadeText>
              <div className="flex flex-col gap-4 w-64">
                <ArcadeButton color="cyan" onClick={() => { playSound('click'); setIsPaused(false); }}>
                  RESUME
                </ArcadeButton>
                <ArcadeButton color="green" onClick={() => { playSound('click'); setSetupComplete(false); }}>
                  CHANGE SETUP
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
              <BattleHeader timeLeft={formatTime(elapsedSeconds)} onPause={() => { playSound('click'); setIsPaused(true); }} />
              
              <div className="flex justify-between items-center w-full mt-2">
                <PlayerPanel player="PLAYER 1" name="SOLO" isYou={true} progress={progress} wpm={wpm} color="green" stats={{ progress, wpm, combo }} />
              </div>
            </div>
            
            {/* Main Battle Section */}
            <div className="flex flex-col gap-4 w-full items-center flex-grow my-4">
              <div className="flex gap-6 xl:gap-10 w-full items-center justify-center flex-grow">
                <div className={`flex-1 flex flex-col justify-center max-w-4xl transition-all duration-300`}>
                  <TypingText text={challengeText} words={challengeWords} typed={typed} combo={combo} />
                </div>
                <ComboDisplay combo={combo} best={maxComboRef.current} />
              </div>
            </div>
            
            {/* Bottom Section */}
            <div className="flex flex-col items-center w-full max-w-6xl mx-auto gap-2 mt-auto pb-4 relative z-30">
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
      )}
    </div>
  );
};

export default SoloPracticePage;

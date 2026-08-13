import React, { useState, useEffect, useCallback, useRef } from 'react';
import BattleHeader from '../components/battle/BattleHeader';
import PlayerPanel from '../components/battle/PlayerPanel';
import TypingText from '../components/battle/TypingText';
import StatsPanel from '../components/battle/StatsPanel';
import VirtualKeyboard from '../components/battle/VirtualKeyboard';
import ComboDisplay from '../components/battle/ComboDisplay';
import ArcadeButton from '../components/arcade/ArcadeButton';
import ArcadeText from '../components/arcade/ArcadeText';
import DebuffBanner from '../components/battle/DebuffBanner';
import { useNavigate } from 'react-router-dom';
import { playSound, playVoice } from '../lib/sounds';
import typingData from '../data/type_battle_word_data.json';

const generateChallengeWords = (count = 15, category = 'all') => {
  const words = [];
  const wordList = category === 'all' 
    ? typingData.all 
    : (typingData.categories[category] || typingData.all);
    
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    const word = wordList[randomIndex];
    const isCursed = Math.random() < 0.22; // ~22% cursed words
    words.push({ word, type: isCursed ? 'cursed' : 'normal' });
  }
  return words;
};

const MATCH_DURATION = 60; // 60 seconds match

const SoloPracticePage = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [challengeWords, setChallengeWords] = useState(() => generateChallengeWords(15, 'all'));
  
  const challengeText = React.useMemo(() => challengeWords.map(w => w.word).join(" "), [challengeWords]);

  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [pressedKey, setPressedKey] = useState(null);
  const [combo, setCombo] = useState(0);
  
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [timeLeft, setTimeLeft] = useState(MATCH_DURATION);
  const [isMatchActive, setIsMatchActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);

  // 💜 Cursed Word State
  const [cursedTimeLeft, setCursedTimeLeft] = useState(null);
  const [activeDebuff, setActiveDebuff] = useState(null);
  const trackedCursedWordIndexRef = useRef(null);

  const maxComboRef = useRef(0);
  const statsRef = useRef({ totalKeystrokes: 0, errors: 0, wordErrors: 0 });

  // Helper to detonate cursed word and apply random debuff
  const detonateCurse = useCallback(() => {
    const debuffs = ['glitch', 'blind', 'steal', 'freeze'];
    const selected = debuffs[Math.floor(Math.random() * debuffs.length)];
    const duration = selected === 'blind' ? 3500 : 2500;
    
    setActiveDebuff({ type: selected, endsAt: Date.now() + duration });
    playVoice(selected);
    playSound('error');
    
    setCursedTimeLeft(null);
    trackedCursedWordIndexRef.current = null;

    setTimeout(() => {
      setActiveDebuff(null);
    }, duration);
  }, []);

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

  // Check cursor position for Cursed Words
  useEffect(() => {
    if (!isMatchActive || isPaused || typed.length >= challengeText.length) return;

    const wordIndex = (typed.match(/ /g) || []).length;
    const currentWordObj = challengeWords[wordIndex];

    if (currentWordObj?.type === 'cursed') {
      if (trackedCursedWordIndexRef.current !== wordIndex) {
        trackedCursedWordIndexRef.current = wordIndex;
        setCursedTimeLeft(4.0);
        playSound('hover');
      }
    } else {
      if (trackedCursedWordIndexRef.current !== null && trackedCursedWordIndexRef.current < wordIndex) {
        // Successfully passed cursed word cleanly!
        playVoice('powerup');
        setCursedTimeLeft(null);
        trackedCursedWordIndexRef.current = null;
      }
    }
  }, [typed, challengeWords, challengeText, isMatchActive, isPaused]);

  // Cursed Word Countdown Ticker (decrements by 0.1s every 100ms)
  useEffect(() => {
    if (cursedTimeLeft === null || isPaused || !isMatchActive) return;

    const timer = setInterval(() => {
      setCursedTimeLeft(prev => {
        if (prev === null) return null;
        if (prev <= 0.1) {
          clearInterval(timer);
          detonateCurse();
          return null;
        }
        return Math.max(0, +(prev - 0.1).toFixed(1));
      });
    }, 100);

    return () => clearInterval(timer);
  }, [cursedTimeLeft, isPaused, isMatchActive, detonateCurse]);

  // Handle Steal Debuff in Solo Mode (Target loses 15 characters)
  useEffect(() => {
    if (activeDebuff?.type === 'steal') {
      playSound('error');
      setTyped(prev => {
        let cutIndex = Math.max(0, prev.length - 15);
        return prev.slice(0, cutIndex);
      });
    }
  }, [activeDebuff]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === ' ') e.preventDefault();

    if (isPaused) return;
    if (isCapsLock) return;
    if (activeDebuff?.type === 'glitch' || activeDebuff?.type === 'freeze') {
      playSound('error');
      return;
    }

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
        statsRef.current.wordErrors += 1;
        newCombo = 0;

        // If typo happens on a cursed word, detonate immediately!
        const wordIndex = (prev.match(/ /g) || []).length;
        if (challengeWords[wordIndex]?.type === 'cursed') {
          detonateCurse();
        }
      } else {
        playSound('keyPress');
        newCombo = combo + 1;
        maxComboRef.current = Math.max(maxComboRef.current, newCombo);
        if (newCombo > 0 && newCombo % 10 === 0) playSound('combo');

        // Check if finished a word
        if (nextChar === ' ') {
          const wordIndex = (prev.match(/ /g) || []).length;
          if (challengeWords[wordIndex]?.type === 'cursed' && statsRef.current.wordErrors === 0) {
            playVoice('powerup');
            setCursedTimeLeft(null);
            trackedCursedWordIndexRef.current = null;
          }
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
  }, [typed, startTime, timeLeft, isPaused, isCapsLock, activeDebuff, combo, challengeText, challengeWords, detonateCurse]);

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
  }, [typed, navigate, wpm, accuracy, challengeText]);

  const handleRestart = () => {
    playSound('click');
    const newWords = generateChallengeWords(15, category);
    setChallengeWords(newWords);
    setTyped('');
    setStartTime(null);
    setPressedKey(null);
    setCombo(0);
    setWpm(0);
    setAccuracy(100);
    setTimeLeft(MATCH_DURATION);
    setIsMatchActive(false);
    setIsPaused(false);
    setCursedTimeLeft(null);
    setActiveDebuff(null);
    trackedCursedWordIndexRef.current = null;
    statsRef.current = { totalKeystrokes: 0, errors: 0, wordErrors: 0 };
    maxComboRef.current = 0;
  };

  const handleCategoryChange = (c) => {
    playSound('click');
    setCategory(c);
    const newWords = generateChallengeWords(15, c);
    setChallengeWords(newWords);
    setTyped('');
    setStartTime(null);
    setCombo(0);
    setWpm(0);
    setAccuracy(100);
    setTimeLeft(MATCH_DURATION);
    setIsMatchActive(false);
    setCursedTimeLeft(null);
    setActiveDebuff(null);
    trackedCursedWordIndexRef.current = null;
    statsRef.current = { totalKeystrokes: 0, errors: 0, wordErrors: 0 };
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
      
      <DebuffBanner activeDebuff={activeDebuff} />

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
            <PlayerPanel player="PLAYER 1" name="SOLO" isYou={true} progress={progress} wpm={wpm} color="cyan" stats={{ progress, wpm, combo }} />
          </div>
        </div>
        
        {/* Main Battle Section */}
        <div className="flex flex-col gap-4 w-full items-center flex-grow my-4">
          {/* 💜 CURSED WORD ALERT BANNER & COUNTDOWN 💜 */}
          {cursedTimeLeft !== null && (
            <div className="flex items-center gap-4 bg-purple-950/90 border-2 border-purple-500 px-6 py-2 rounded-full animate-pulse shadow-[0_0_25px_rgba(168,85,247,0.7)] font-[family-name:var(--font-arcade)]">
              <span className="text-xl animate-spin">💜</span>
              <span className="text-purple-300 text-xs md:text-sm tracking-widest font-bold">
                CURSED WORD DETECTED! TYPE CLEANLY IN {cursedTimeLeft.toFixed(1)}S OR DETONATE!
              </span>
              <div className="w-16 bg-black/60 h-2 rounded-full overflow-hidden border border-purple-400">
                <div 
                  className="bg-purple-400 h-full transition-all duration-100" 
                  style={{ width: `${(cursedTimeLeft / 4.0) * 100}%` }} 
                />
              </div>
            </div>
          )}

          <div className="flex gap-6 xl:gap-10 w-full items-center justify-center flex-grow">
            <div className={`flex-1 flex flex-col justify-center max-w-4xl transition-all duration-300 ${activeDebuff?.type === 'blind' ? 'blur-2xl opacity-5 pointer-events-none' : ''} ${activeDebuff?.type === 'glitch' ? 'animate-cyber-glitch' : ''} ${activeDebuff?.type === 'steal' ? 'animate-shake' : ''} ${activeDebuff?.type === 'freeze' ? 'blur-sm grayscale pointer-events-none' : ''}`}>
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
          <VirtualKeyboard pressedKey={pressedKey} isGlitched={activeDebuff?.type === 'glitch'} />

          {/* Category Selector */}
          <div className="flex flex-col items-center gap-2 mt-2 opacity-50 hover:opacity-100 transition-opacity">
            <span className="text-[var(--color-neon-pink)] font-[family-name:var(--font-arcade)] text-xs tracking-widest">CATEGORY</span>
            <div className="flex gap-2">
              {['all', 'common', 'it', 'gaming', 'tech', 'fun'].map(c => (
                <button 
                  key={c}
                  onClick={() => handleCategoryChange(c)}
                  className={`px-2 py-1 font-[family-name:var(--font-arcade)] text-[10px] border ${category === c ? 'border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)]' : 'border-gray-700 text-gray-500 hover:border-gray-400 hover:text-gray-400'} transition-all uppercase rounded-sm`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoloPracticePage;

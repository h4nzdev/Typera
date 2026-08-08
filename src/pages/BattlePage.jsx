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
import PowerUpSlot from '../components/battle/PowerUpSlot';
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
    challengeWords,
    gameMode,
    isPaused,
    setPaused,
    status,
    activeDebuff,
    opponentDebuff
  } = useMatchStore();
  
  const challengeText = React.useMemo(() => challengeWords.map(w => w.word).join(" "), [challengeWords]);
  
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [pressedKey, setPressedKey] = useState(null);
  const [combo, setCombo] = useState(0);
  const [heldPowerUp, setHeldPowerUp] = useState(null);
  const [shake, setShake] = useState(false);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  }, []);
  
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [timeLeft, setTimeLeft] = useState(gameMode === 'deathmatch' ? 300 : 120);
  const [localDamage, setLocalDamage] = useState(0);
  const [isMatchActive, setIsMatchActive] = useState(false);
  
  const [battlePhase, setBattlePhase] = useState('waiting'); // waiting, countdown, playing
  const [countdown, setCountdown] = useState(null);

  const statsRef = useRef({ totalKeystrokes: 0, errors: 0, wordErrors: 0 });
  const maxComboRef = useRef(0);

  const MAX_HP = 1000;
  const myHp = Math.max(0, MAX_HP - (opponentStats.damageDealt || 0));
  const opponentHp = Math.max(0, MAX_HP - localDamage);

  // Helper to transition to results
  const endGame = useCallback((isWinner, isSurrender = false, isDraw = false) => {
    setIsMatchActive(false);
    setBattlePhase('finished');
    
    // If the player didn't type a single key, accuracy should be 0, not the default 100.
    const finalAccuracy = statsRef.current.totalKeystrokes === 0 ? 0 : accuracy;
    
    navigate('/result', {
      state: {
        isWinner,
        surrendered: isSurrender,
        isDraw,
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

  // Block the back button during the entire battle sequence
  useEffect(() => {
    window.history.pushState(null, "", window.location.pathname);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
          useMatchStore.getState().updateMatchStatus('playing');
          setStartTime(Date.now());
          setIsMatchActive(true);
        }
      }, 1000);
      return () => clearInterval(countInterval);
    }
  }, [battlePhase]);

  // Check for opponent finish, surrender, or KO
  useEffect(() => {
    if (battlePhase !== 'playing') return;
    
    if (gameMode === 'race' && opponentStats.progress === 100) {
      endGame(false, false, false);
    }
    
    if (gameMode === 'deathmatch') {
      if (myHp <= 0) endGame(false, false, false);
      else if (opponentHp <= 0) endGame(true, false, false);
    }
  }, [opponentStats.progress, battlePhase, endGame, gameMode, myHp, opponentHp]);

  useEffect(() => {
    if (status === 'opponent_surrendered' && battlePhase === 'playing') {
      // Opponent left the match, you win!
      endGame(true, true, false);
    }
  }, [status, battlePhase, endGame]);

  // Handle Steal Debuff
  useEffect(() => {
    if (activeDebuff?.type === 'steal' && battlePhase === 'playing') {
      playSound('error');
      triggerShake();
      setTyped(prev => {
        const next = prev.slice(0, Math.max(0, prev.length - 3));
        let correctCount = 0;
        for (let i = 0; i < next.length; i++) {
          if (next[i] === challengeText[i]) correctCount++;
          else break;
        }
        const newProgress = Math.min(100, Math.round((correctCount / challengeText.length) * 100)) || 0;
        broadcastStats({ progress: newProgress, wpm, accuracy, combo });
        return next;
      });
      useMatchStore.getState().setActiveDebuff(null);
    }
  }, [activeDebuff, battlePhase, triggerShake, challengeText, wpm, accuracy, combo, broadcastStats]);

  const handleKeyDown = useCallback((e) => {
    // Prevent spacebar from scrolling the page
    if (e.key === ' ') e.preventDefault();

    if (e.key === 'Enter' && heldPowerUp) {
      playSound('click');
      useMatchStore.getState().sendPowerUp(heldPowerUp);
      if (heldPowerUp === 'steal') {
         setTyped(prev => {
           let next = prev;
           for (let i = 0; i < 3; i++) {
             if (next.length < challengeText.length) {
               next += challengeText[next.length];
             }
           }
           const newProgress = Math.min(100, Math.round((next.length / challengeText.length) * 100)) || 0;
           broadcastStats({ progress: newProgress, wpm, accuracy, combo });
           return next;
         });
      }
      setHeldPowerUp(null);
      return;
    }

    if (activeDebuff?.type === 'glitch') {
      playSound('error');
      triggerShake();
      return;
    }

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
        statsRef.current.wordErrors += 1;
        newCombo = 0;
      } else {
        playSound('keyPress');
        newCombo = combo + 1;
        maxComboRef.current = Math.max(maxComboRef.current, newCombo);
        if (newCombo > 0 && newCombo % 10 === 0) playSound('combo');
        
        // Power-Up Generation
        if (newCombo > 0 && newCombo % 20 === 0 && !heldPowerUp) {
          const types = ['glitch', 'blind', 'steal'];
          setHeldPowerUp(types[Math.floor(Math.random() * types.length)]);
          playSound('start'); // Notify player!
        }
      }
      setCombo(newCombo);
      
      let newDamage = localDamage;
      if (nextChar === expectedChar && gameMode === 'deathmatch') {
        newDamage += 1; // 1 damage per correct char
        
        // If we finished a word, check for bonus
        if (nextChar === ' ') {
           const wordIndex = (prev.match(/ /g) || []).length;
           const wordObj = challengeWords[wordIndex];
           if (wordObj && statsRef.current.wordErrors === 0) {
             if (wordObj.type === 'tnt') {
               newDamage += 50;
               playSound('start'); // explosion sound placeholder
             } else if (wordObj.type === 'sword') {
               newDamage += 25;
               playSound('start');
             }
           }
           statsRef.current.wordErrors = 0; // reset for next word
        }
      }
      setLocalDamage(newDamage);
      
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
      
      broadcastStats({ progress: newProgress, wpm: newWpm, accuracy: newAcc, combo: newCombo, damageDealt: newDamage });
      
      // Infinite append for deathmatch
      if (gameMode === 'deathmatch' && next.length > challengeText.length - 100) {
         useMatchStore.getState().appendWords(30);
      }
      
      if (gameMode === 'race' && next === challengeText) {
         setTimeout(() => endGame(true, false, false), 300);
      }
      
      return next;
    });
  }, [typed, startTime, timeLeft, wpm, accuracy, combo, broadcastStats, battlePhase, endGame, isPaused, triggerShake, localDamage, gameMode, challengeWords, challengeText]);

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
            let isWinner = false;
            let isDraw = false;
            if (gameMode === 'race') {
              const finalProgress = Math.min(100, Math.round((typed.length / challengeText.length) * 100)) || 0;
              isWinner = finalProgress > opponentStats.progress;
              isDraw = finalProgress === opponentStats.progress;
            } else {
              isWinner = myHp > opponentHp;
              isDraw = myHp === opponentHp;
            }
            endGame(isWinner, false, isDraw);
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
            broadcastStats({ progress, wpm: currentWpm, accuracy, combo, damageDealt: localDamage });
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMatchActive, timeLeft, startTime, broadcastStats, typed, accuracy, combo, opponentStats.progress, endGame, gameMode, myHp, opponentHp, localDamage]);

  const handleRestart = () => {
    playSound('click');
    setTyped('');
    setStartTime(null);
    setPressedKey(null);
    setCombo(0);
    setWpm(0);
    setAccuracy(100);
    setTimeLeft(gameMode === 'deathmatch' ? 300 : 120);
    setLocalDamage(0);
    setIsMatchActive(false);
    setPaused(false);
    setHeldPowerUp(null);
    useMatchStore.getState().setActiveDebuff(null);
    setBattlePhase('waiting');
    setLocalReady(false);
    statsRef.current = { totalKeystrokes: 0, errors: 0, wordErrors: 0 };
    maxComboRef.current = 0;
    broadcastStats({ progress: 0, wpm: 0, accuracy: 100, combo: 0, damageDealt: 0 });
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
              {battlePhase === 'playing' ? 'SURRENDER' : 'MAIN MENU'}
            </ArcadeButton>
          </div>
        </div>
      )}

      {/* Cancelled Modal Overlay */}
      {status === 'cancelled' && (
        <div className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm">
          <ArcadeText color="red" glow className="text-5xl md:text-7xl mb-4 text-center">MATCH CANCELLED</ArcadeText>
          <ArcadeText color="pink" className="text-xl mb-8 tracking-widest text-center">HOST DISCONNECTED</ArcadeText>
          <ArcadeButton color="cyan" onClick={() => { playSound('click'); useMatchStore.getState().leaveMatch(); navigate('/'); }}>
            MAIN MENU
          </ArcadeButton>
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
               hp={isHost ? myHp : opponentHp}
               maxHp={MAX_HP}
               showHp={gameMode === 'deathmatch'}
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
               hp={!isHost ? myHp : opponentHp}
               maxHp={MAX_HP}
               showHp={gameMode === 'deathmatch'}
            />
          </div>
        </div>
        
        {/* Main Battle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_250px] gap-8 z-10 w-full max-w-[1400px] mx-auto items-start">
          
          {/* Left Panel */}
          <div className="hidden lg:block w-full">
            <OpponentActivity 
              progress={opponentStats.progress} 
              wpm={opponentStats.wpm} 
              accuracy={opponentStats.accuracy} 
              combo={opponentStats.combo} 
              color={isHost ? 'pink' : 'cyan'}
              debuff={opponentDebuff}
              hp={opponentHp}
              maxHp={MAX_HP}
              showHp={gameMode === 'deathmatch'}
            />
          </div>

          {/* Main Typing Section */}
          <div className={`w-full flex flex-col items-center relative transition-transform ${shake ? 'animate-shake' : ''}`}>
            {activeDebuff?.type === 'glitch' && (
              <div className="absolute inset-0 z-50 pointer-events-none mix-blend-difference bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50 animate-pulse"></div>
            )}
            <div className={`w-full transition-all duration-300 ${activeDebuff?.type === 'blind' ? 'blur-md opacity-30' : ''} ${activeDebuff?.type === 'glitch' ? 'animate-pulse translate-x-1 -translate-y-1 skew-x-2' : ''}`}>
              <TypingText text={challengeText} words={challengeWords} typed={typed} />
            </div>
          </div>

          {/* Right Panel */}
          <div className="hidden lg:flex flex-col gap-4 items-center w-full">
            <ComboDisplay combo={combo} best={maxComboRef.current} />
            <PowerUpSlot heldPowerUp={heldPowerUp} />
          </div>

          {/* Mobile Only: Show Right Panel inline */}
          <div className="flex lg:hidden flex-col gap-4 items-center mt-8">
            <ComboDisplay combo={combo} best={maxComboRef.current} />
            <PowerUpSlot heldPowerUp={heldPowerUp} />
          </div>
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

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
import DebuffBanner from '../components/battle/DebuffBanner';
import ComboBanner from '../components/battle/ComboBanner';
import { useNavigate } from 'react-router-dom';
import useMatchStore from '../store/useMatchStore';
import { playSound, playVoice, playBgm } from '../lib/sounds';

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
    opponentDebuff,
    localPoints,
    opponentPoints,
    myId,
    players,
    channelState,
    roundNumber
  } = useMatchStore();
  
  const hostPlayer = players.find(p => p.isHost);
  const challengerPlayer = players.find(p => !p.isHost);
  
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
  const [triggerCombo50, setTriggerCombo50] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [hasShield, setHasShield] = useState(false);
  const [isSuddenDeath, setIsSuddenDeath] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);

  const statsRef = useRef({ totalKeystrokes: 0, errors: 0, wordErrors: 0 });
  const maxComboRef = useRef(0);

  const MAX_HP = 1000;
  const myHp = Math.max(0, MAX_HP - (opponentStats.damageDealt || 0));
  const opponentHp = Math.max(0, MAX_HP - localDamage);

  useEffect(() => {
    playBgm('battle');
  }, []);

  // Helper to transition to results
  const endGame = useCallback((isWinner, isSurrender = false, isDraw = false) => {
    setIsMatchActive(false);
    setBattlePhase('finished');

    // Immediately clear ready state in presence for this player
    useMatchStore.getState().clearPresenceReady();

    // Play win/lose voice line
    if (!isDraw) {
      playVoice(isWinner ? 'you-win' : 'you-lose');
    }
    
    // If the player didn't type a single key, accuracy should be 0, not the default 100.
    const finalAccuracy = statsRef.current.totalKeystrokes === 0 ? 0 : accuracy;
    
    const opponentPlayer = players.find(p => p.id !== myId);
    const oppName = opponentPlayer?.playerName || 'OPPONENT';

    navigate('/result', {
      state: {
        isWinner,
        surrendered: isSurrender,
        isDraw,
        wpm,
        accuracy: finalAccuracy,
        maxCombo: maxComboRef.current,
        mode: gameMode,
        myPoints: localPoints,
        opponentPoints,
        opponentName: oppName,
        matchCode: matchCode || 'BOOTH-VIP'
      }
    });
  }, [navigate, wpm, accuracy, gameMode, localPoints, opponentPoints]);

  // ─── READY HANDSHAKE ────────────────────────────────────────────────
  // Both players must manually press READY button (no auto-ready).
  // Heartbeat re-broadcasts our ready state every 300ms until opponent confirms.
  useEffect(() => {
    const interval = setInterval(() => {
      const { localReady, opponentReady } = useMatchStore.getState();
      if (localReady && !opponentReady) {
        useMatchStore.getState().pingReady();
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (localReady && opponentReady && battlePhase === 'waiting') {
      console.log('[BATTLE] BOTH READY → starting countdown!');
      setBattlePhase('countdown');
    }
  }, [localReady, opponentReady, battlePhase]);

  // Handle Classic Booth Points & Rounds
  const prevLocalPoints = useRef(localPoints);
  const prevOpponentPoints = useRef(opponentPoints);

  useEffect(() => {
    if (gameMode !== 'classic_booth') return;
    
    // When a point is scored (via broadcast), navigate to the result screen
    if (localPoints > prevLocalPoints.current || opponentPoints > prevOpponentPoints.current) {
       const isLocalWin = localPoints > prevLocalPoints.current;
       prevLocalPoints.current = localPoints;
       prevOpponentPoints.current = opponentPoints;
       
       // Both players go to the result screen to see the score
       endGame(isLocalWin, false, false);
    }
  }, [localPoints, opponentPoints, gameMode, endGame]);

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
          playSound('start');
          playVoice('type');
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
    
    if (gameMode === 'race' && opponentStats.progress >= 100) {
      const myProgress = Math.min(100, Math.round((typed.length / challengeText.length) * 100)) || 0;
      const isDraw = myProgress >= 100;
      setTimeout(() => endGame(!isDraw && myProgress >= 100, false, isDraw), 200);
    }
    
    if (gameMode === 'deathmatch') {
      if (myHp <= 0 && opponentHp <= 0) endGame(false, false, true);
      else if (myHp <= 0) endGame(false, false, false);
      else if (opponentHp <= 0) endGame(true, false, false);
    }
  }, [opponentStats.progress, battlePhase, endGame, gameMode, myHp, opponentHp]);

  useEffect(() => {
    if (status === 'opponent_surrendered' && battlePhase === 'playing') {
      // Opponent left the match, you win!
      endGame(true, true, false);
    }
  }, [status, battlePhase, endGame]);

  // Handle Shield Interceptor for Incoming Debuffs
  useEffect(() => {
    if (activeDebuff && hasShield) {
      setHasShield(false);
      useMatchStore.getState().setActiveDebuff(null);
      playVoice('shield');
    }
  }, [activeDebuff, hasShield]);

  // Handle Steal Debuff (Target loses 15 characters / 2-3 words of typed progress)
  useEffect(() => {
    if (activeDebuff?.type === 'steal' && battlePhase === 'playing') {
      playSound('error');
      triggerShake();
      setTyped(prev => {
        let cutIndex = Math.max(0, prev.length - 15);
        const lastSpace = prev.lastIndexOf(' ', cutIndex);
        if (lastSpace > 0 && lastSpace > prev.length - 25) {
          cutIndex = lastSpace;
        }
        const next = prev.slice(0, cutIndex);
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
      if (heldPowerUp === 'shield') {
        setHasShield(true);
        setHeldPowerUp(null);
        playVoice('shield');
        return;
      }
      useMatchStore.getState().sendPowerUp(heldPowerUp);
      if (heldPowerUp === 'steal') {
         setTyped(prev => {
           // Clean any existing typos first!
           let cleanIndex = 0;
           while (cleanIndex < prev.length && prev[cleanIndex] === challengeText[cleanIndex]) {
             cleanIndex++;
           }
           let next = prev.slice(0, cleanIndex);
           let added = 0;
           while (next.length < challengeText.length && added < 15) {
             next += challengeText[next.length];
             added++;
           }
           const newProgress = Math.min(100, Math.round((next.length / challengeText.length) * 100)) || 0;
           broadcastStats({ progress: newProgress, wpm, accuracy, combo });

           // Check if steal completed the text
           if (next === challengeText) {
             if (gameMode === 'race') {
               const isDraw = opponentStats.progress >= 100;
               setTimeout(() => endGame(!isDraw, false, isDraw), 200);
             } else if (gameMode === 'classic_booth') {
               setTimeout(() => useMatchStore.getState().recordRoundWinner(myId), 200);
             }
           }

           return next;
         });
      }
      setHeldPowerUp(null);
      return;
    }

    if (isCapsLock) return;

    if (activeDebuff?.type === 'glitch' || activeDebuff?.type === 'freeze') {
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
        newCombo = combo + (1 * comboMultiplier);
        maxComboRef.current = Math.max(maxComboRef.current, newCombo);
        if (newCombo > 0 && newCombo % 10 === 0) playSound('combo');
        
        // Broadcast real-time strike impulse to opponent
        useMatchStore.getState().broadcastKeystrokeStrike(nextChar, newCombo);

        // 50x Combo Banner & Voice Trigger!
        if (newCombo > 0 && newCombo % 50 === 0) {
          setTriggerCombo50(Date.now());
        }

        // Power-Up Generation (Unlock shield at 30 combo, or random debuffs at 20 combo)
        if (newCombo > 0 && (newCombo % 20 === 0 || newCombo % 30 === 0) && !heldPowerUp) {
          const types = newCombo % 30 === 0 
            ? ['shield', 'steal', 'freeze'] 
            : ['glitch', 'blind', 'steal', 'freeze', 'shield'];
          setHeldPowerUp(types[Math.floor(Math.random() * types.length)]);
          playVoice('powerup');
        }
      }
      setCombo(newCombo);
      
      let newDamage = localDamage;
      if (nextChar === expectedChar) {
        if (gameMode === 'deathmatch') {
          newDamage += 1;
        }
        
        // Check for completed word bonus
        if (nextChar === ' ') {
           const wordIndex = (prev.match(/ /g) || []).length;
           const wordObj = challengeWords[wordIndex];
           if (wordObj && statsRef.current.wordErrors === 0) {
             if (wordObj.type === 'tnt' && gameMode === 'deathmatch') {
               newDamage += 50;
               playSound('start');
             } else if (wordObj.type === 'sword' && gameMode === 'deathmatch') {
               newDamage += 25;
               playSound('start');
             } else if (wordObj.type === 'critical') {
               setComboMultiplier(2);
               playVoice('powerup');
               setTimeout(() => setComboMultiplier(1), 5000);
             }
           }
           statsRef.current.wordErrors = 0;
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
      
      broadcastStats({ 
        progress: newProgress, 
        wpm: newWpm, 
        accuracy: newAcc, 
        combo: newCombo, 
        damageDealt: newDamage,
        typed: next,
        lastKey: e.key,
        activeDebuff
      });
      
      // Infinite append for deathmatch
      if (gameMode === 'deathmatch' && next.length > challengeText.length - 100) {
         useMatchStore.getState().appendWords(30);
      }
      
      // Check completion: exact match OR all characters correctly typed (progress 100%)
      const isComplete = next === challengeText || (next.length >= challengeText.length && newProgress >= 100);
      
      if (gameMode === 'race' && isComplete) {
         const isDraw = opponentStats.progress >= 100;
         setTimeout(() => endGame(!isDraw, false, isDraw), 200);
      }
      
      if (gameMode === 'classic_booth' && isComplete) {
         // I am the winner of the round! Broadcast it. The useEffect will catch it and call endGame.
         useMatchStore.getState().recordRoundWinner(myId);
         setIsMatchActive(false);
      }
      
      return next;
    });
  }, [typed, startTime, timeLeft, wpm, accuracy, combo, broadcastStats, battlePhase, endGame, isPaused, triggerShake, localDamage, gameMode, challengeWords, challengeText]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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

  // Timer and WPM decay interval
  useEffect(() => {
    let interval;
    if (isMatchActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 31 && prev > 1 && gameMode === 'race' && !isSuddenDeath) {
            setIsSuddenDeath(true);
            playVoice('powerup');
          }
          if (prev <= 1) {
            clearInterval(interval);
            // Time ran out! Compare progress to decide winner
            let isWinner = false;
            let isDraw = false;
            if (gameMode === 'race' || gameMode === 'classic_booth') {
              const finalProgress = Math.min(100, Math.round((typed.length / challengeText.length) * 100)) || 0;
              isWinner = finalProgress > opponentStats.progress;
              isDraw = finalProgress === opponentStats.progress;
              
              if (gameMode === 'classic_booth') {
                if (isWinner && !isDraw) {
                  useMatchStore.getState().recordRoundWinner(myId);
                } else if (isDraw) {
                  // No points for draw, go to result screen anyway
                  endGame(false, false, true);
                }
                return 0;
              }
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
    <div className="min-h-screen flex flex-col overflow-hidden p-4 md:p-8 relative" style={{ background: 'radial-gradient(ellipse at center, rgba(10,0,21,0.4) 0%, rgba(5,5,10,0.72) 100%)' }}>
      {/* Scanlines */}
      <div className="pointer-events-none absolute inset-0 z-50" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)' }} />
      {/* Neon pixel grid */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(0,243,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.025) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 85%)'
      }} />
      
      {/* Debuff Banner — appears on YOUR screen when opponent hits you */}
      <DebuffBanner activeDebuff={activeDebuff} />

      {/* Pause Modal Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center backdrop-blur-md">
          <div className="relative border-4 border-[var(--color-neon-cyan)] p-1" style={{ boxShadow: '0 0 0 2px #000, 0 0 40px rgba(0,243,255,0.4)' }}>
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-[var(--color-neon-cyan)]" />
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-[var(--color-neon-cyan)]" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-[var(--color-neon-cyan)]" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-[var(--color-neon-cyan)]" />
            <div className="border-2 border-black/50 bg-black/90 px-16 py-10 flex flex-col items-center gap-6">
              <ArcadeText color="cyan" glow className="text-6xl">PAUSED</ArcadeText>
              <div className="flex flex-col gap-4 w-64">
                <ArcadeButton color="cyan" onClick={() => { playSound('click'); setPaused(false); }}>RESUME</ArcadeButton>
                <ArcadeButton color="pink" onClick={handleRestart}>RESTART</ArcadeButton>
                <ArcadeButton color="white" onClick={() => { playSound('click'); useMatchStore.getState().leaveMatch(); navigate('/'); }}>
                  {battlePhase === 'playing' ? 'SURRENDER' : 'MAIN MENU'}
                </ArcadeButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Code Not Found Modal Overlay */}
      {status === 'not_found' && (
        <div className="absolute inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center backdrop-blur-md">
          <div className="relative border-4 border-yellow-400 p-1" style={{ boxShadow: '0 0 0 2px #000, 0 0 40px rgba(255,215,0,0.5)' }}>
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400" />
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-yellow-400" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-yellow-400" />
            <div className="border-2 border-black/50 bg-black/90 px-12 py-8 flex flex-col items-center gap-6 text-center">
              <ArcadeText color="yellow" glow className="text-4xl md:text-6xl text-center">MATCH DOES NOT EXIST</ArcadeText>
              <p className="text-white/80 font-mono text-sm max-w-md">THE MATCH CODE YOU ENTERED WAS NOT FOUND OR HAS EXPIRED.</p>
              <div className="flex gap-4">
                <ArcadeButton color="pink" onClick={() => { playSound('click'); useMatchStore.getState().leaveMatch(); navigate('/join'); }}>ENTER CODE AGAIN</ArcadeButton>
                <ArcadeButton color="cyan" onClick={() => { playSound('click'); useMatchStore.getState().leaveMatch(); navigate('/'); }}>MAIN MENU</ArcadeButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancelled Modal Overlay */}
      {status === 'cancelled' && (
        <div className="absolute inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center backdrop-blur-md">
          <div className="relative border-4 border-[var(--color-neon-red)] p-1" style={{ boxShadow: '0 0 0 2px #000, 0 0 40px rgba(255,0,60,0.4)' }}>
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-[var(--color-neon-red)]" />
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-[var(--color-neon-red)]" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-[var(--color-neon-red)]" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-[var(--color-neon-red)]" />
            <div className="border-2 border-black/50 bg-black/90 px-16 py-10 flex flex-col items-center gap-6">
              <ArcadeText color="red" glow className="text-5xl md:text-7xl text-center">MATCH CANCELLED</ArcadeText>
              <ArcadeText color="pink" className="text-xl tracking-widest text-center">HOST DISCONNECTED</ArcadeText>
              <ArcadeButton color="cyan" onClick={() => { playSound('click'); useMatchStore.getState().leaveMatch(); navigate('/'); }}>MAIN MENU</ArcadeButton>
            </div>
          </div>
        </div>
      )}

      {/* Caps Lock Warning Lock Screen Overlay */}
      {isCapsLock && battlePhase === 'playing' && !isPaused && (
        <div className="absolute inset-0 z-[80] bg-black/90 flex flex-col items-center justify-center backdrop-blur-md pointer-events-auto">
          <div className="relative border-4 border-yellow-400 p-1 shadow-[0_0_50px_rgba(255,215,0,0.5)]">
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400" />
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-yellow-400" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-yellow-400" />
            <div className="border-2 border-black/50 bg-black/95 px-12 md:px-16 py-8 md:py-10 flex flex-col items-center gap-5 text-center">
              <div className="text-6xl md:text-7xl animate-bounce">🔒</div>
              <ArcadeText color="yellow" glow className="text-3xl md:text-5xl tracking-widest">
                CAPS LOCK DETECTED!
              </ArcadeText>
              <p className="text-white/90 font-[family-name:var(--font-arcade)] text-sm md:text-base tracking-wider max-w-lg leading-relaxed">
                PLEASE PRESS <span className="text-yellow-400 font-bold underline">[ CAPS LOCK ]</span> ON YOUR KEYBOARD TO UNLOCK AND CONTINUE TYPING!
              </p>
              <div className="px-6 py-2 bg-yellow-400/10 border border-yellow-400/50 rounded-full text-xs text-yellow-300 font-[family-name:var(--font-arcade)] tracking-widest animate-pulse">
                TYPING IS PAUSED WHILE CAPS LOCK IS ACTIVE
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ready Overlay with Game Mode Rules & Match Info */}
      {battlePhase === 'waiting' && !isPaused && (
        <div className="absolute inset-0 z-50 bg-black/92 flex flex-col items-center justify-center backdrop-blur-md px-4 select-none">
          <div className="relative border-4 border-cyan-400 p-1 w-full max-w-2xl shadow-[0_0_50px_rgba(0,243,255,0.4)]">
            {/* Pixel corners */}
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-cyan-400" />
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-cyan-400" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-cyan-400" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-cyan-400" />

            <div className="border-2 border-black/80 bg-black/95 p-6 md:p-8 flex flex-col items-center gap-6">
              {/* Header Badge */}
              <div className="flex items-center justify-between w-full border-b-2 border-cyan-500/30 pb-3">
                <span className="font-[family-name:var(--font-arcade)] text-xs text-cyan-400 tracking-[0.3em]">
                  ● MATCH BRIEFING & GAME RULES
                </span>
                <span className="font-[family-name:var(--font-arcade)] text-xs text-white/50 tracking-wider">
                  CODE: <span className="text-yellow-400">{matchCode}</span>
                </span>
              </div>

              {/* Mode Title Banner */}
              <div className="flex flex-col items-center gap-1">
                <ArcadeText 
                  as="h1" 
                  color={gameMode === 'deathmatch' ? 'red' : gameMode === 'classic_booth' ? 'yellow' : 'cyan'} 
                  glow 
                  className="text-3xl md:text-4xl text-center tracking-widest"
                >
                  {gameMode === 'deathmatch' ? '⚔️ 1V1 DEATHMATCH' : gameMode === 'classic_booth' ? '🎪 BOOTH CHAMPIONSHIP' : '🏁 CLASSIC SPEED RACE'}
                </ArcadeText>
                <p className="font-[family-name:var(--font-arcade)] text-xs text-white/70 tracking-wider text-center max-w-md">
                  {gameMode === 'deathmatch'
                    ? 'Type accurately to deal damage! Deplete your opponent\'s 1000 HP to 0 HP to dominate the arena!'
                    : gameMode === 'classic_booth'
                    ? 'First to 3 round wins claims the official Booth Champion Pass & VIP Ticket!'
                    : 'Type fastest to reach 100% progress before your opponent or before time expires!'}
                </p>
              </div>

              {/* Game Rules & Mechanics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full bg-black/80 border border-white/10 p-4 rounded-xl font-mono text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-amber-300 text-sm">⚡</span>
                  <div>
                    <span className="text-amber-300 font-bold font-[family-name:var(--font-arcade)] text-[11px] block">CRITICAL WORDS</span>
                    <span className="text-white/70 text-[10px]">Type glowing words to gain 2x combo boost!</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 text-sm">🛡️</span>
                  <div>
                    <span className="text-cyan-400 font-bold font-[family-name:var(--font-arcade)] text-[11px] block">SHIELD POWER-UP</span>
                    <span className="text-white/70 text-[10px]">Reach 30 combo to gain shield against debuffs!</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-red-400 text-sm">💣</span>
                  <div>
                    <span className="text-red-400 font-bold font-[family-name:var(--font-arcade)] text-[11px] block">ATTACK DEBUFFS</span>
                    <span className="text-white/70 text-[10px]">Inflict Freeze ❄, Glitch ⚠, Steal ⚡ or Blind 👁!</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-purple-400 text-sm">💜</span>
                  <div>
                    <span className="text-purple-400 font-bold font-[family-name:var(--font-arcade)] text-[11px] block">CURSED TRAPS</span>
                    <span className="text-white/70 text-[10px]">Type clean to cleanse cursed words before detonation!</span>
                  </div>
                </div>
              </div>

              {/* Player Connection Status */}
              <div className="flex items-center justify-around w-full bg-black/60 border border-white/10 py-2 px-4 rounded-lg font-[family-name:var(--font-arcade)] text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">HOST:</span>
                  <span className="text-white font-bold">{hostPlayer?.playerName || 'PLAYER 1'}</span>
                </div>
                <div className="text-white/30">VS</div>
                <div className="flex items-center gap-2">
                  <span className="text-pink-400">CHALLENGER:</span>
                  <span className="text-white font-bold">{challengerPlayer?.playerName || 'PLAYER 2'}</span>
                </div>
              </div>

              {/* Ready Button / Waiting Status */}
              {!localReady ? (
                <div className="flex flex-col items-center gap-2 w-full pt-2">
                  <ArcadeButton 
                    color="cyan" 
                    className="w-full text-2xl md:text-3xl py-4 animate-pulse" 
                    onClick={() => { playSound('click'); setLocalReady(); }}
                  >
                    ⚔️ READY TO BATTLE ⚔️
                  </ArcadeButton>
                  <span className="font-[family-name:var(--font-arcade)] text-[10px] text-yellow-400 tracking-widest animate-pulse">
                    CLICK WHEN YOU ARE READY TO START THE COUNTDOWN
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-2">
                  <ArcadeText color="pink" glow className="text-xl md:text-2xl animate-pulse text-center">
                    ● YOU ARE READY! WAITING FOR OPPONENT...
                  </ArcadeText>
                  <div className="w-64 h-2 bg-black border border-pink-500 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500 animate-[scan_1s_linear_infinite]" style={{ width: '40%' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
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

      <DebuffBanner activeDebuff={activeDebuff} />
      <ComboBanner triggerCombo={triggerCombo50} />

      {/* Sudden Death Vignette & Overlay */}
      {isSuddenDeath && (
        <div className="pointer-events-none fixed inset-0 z-40 animate-sudden-death flex items-start justify-center pt-20">
          <div className="bg-red-950/90 border-2 border-red-500 px-6 py-2 rounded-full text-red-400 font-black tracking-widest text-lg md:text-xl animate-pulse shadow-[0_0_30px_rgba(255,0,0,0.8)] font-[family-name:var(--font-arcade)]">
            💀 SUDDEN DEATH OVERTIME 💀
          </div>
        </div>
      )}

      <div className="w-full mx-auto flex flex-col z-10 h-full flex-grow justify-start gap-3 md:gap-4 max-w-[1800px] py-2">
        {/* Top Section */}
        <div className="flex flex-col gap-4 w-full">
          <BattleHeader timeLeft={formatTime(timeLeft)} matchCode={matchCode} onPause={() => { playSound('click'); setPaused(true); }} />
          
          {/* Player Panels Row */}
          <div className="flex justify-between items-center w-full mt-1">
            <PlayerPanel 
               player={hostPlayer?.playerName || "PLAYER 1"} 
               name="HOST" 
               isYou={isHost} 
               progress={isHost ? progress : opponentStats.progress} 
               wpm={isHost ? wpm : opponentStats.wpm} 
               color="cyan" 
               hp={isHost ? myHp : opponentHp}
               maxHp={MAX_HP}
               showHp={gameMode === 'deathmatch'}
               points={gameMode === 'classic_booth' ? (isHost ? localPoints : opponentPoints) : null}
               stats={isHost ? { progress, wpm, combo, damageDealt: localDamage } : opponentStats}
            />
            <div className="flex flex-col items-center mx-4">
              <ArcadeText as="div" color="cyan" glow className="text-7xl italic font-bold -skew-x-12">V<span className="text-[var(--color-neon-pink)]">S</span></ArcadeText>
            </div>
            <PlayerPanel 
               player={challengerPlayer?.playerName || "PLAYER 2"} 
               name="CHALLENGER" 
               isYou={!isHost} 
               progress={!isHost ? progress : opponentStats.progress} 
               wpm={!isHost ? wpm : opponentStats.wpm} 
               color="pink" 
               reverse={true} 
               hp={!isHost ? myHp : opponentHp}
               maxHp={MAX_HP}
               showHp={gameMode === 'deathmatch'}
               points={gameMode === 'classic_booth' ? (!isHost ? localPoints : opponentPoints) : null}
               stats={!isHost ? { progress, wpm, combo, damageDealt: localDamage } : opponentStats}
            />
          </div>
        </div>
        
        {/* Main Battle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_250px] gap-6 z-10 w-full max-w-[1400px] mx-auto items-start">
          
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
            {/* ── LITERAL ARCADE GLITCH OVERLAY ── */}
            {activeDebuff?.type === 'glitch' && (
              <>
                <div className="absolute -inset-4 z-50 pointer-events-none mix-blend-difference bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-80 animate-glitch-flicker" />
                <div className="absolute inset-x-0 top-1/4 h-12 bg-cyan-500/20 z-50 pointer-events-none mix-blend-color-dodge animate-glitch-slice border-y border-[var(--color-neon-cyan)] flex items-center justify-center">
                  <span className="font-[family-name:var(--font-arcade)] text-xs text-[var(--color-neon-yellow)] tracking-[0.4em] bg-black/80 px-4 py-0.5 border border-yellow-400 animate-pulse">
                    ⚠ SYSTEM ERROR // KEYBOARD CORRUPTED ⚠
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-1/3 h-8 bg-pink-500/20 z-50 pointer-events-none mix-blend-hard-light animate-glitch-slice border-y border-[var(--color-neon-pink)]" />
              </>
            )}

            {/* ── LITERAL BLIND OVERLAY (FULL SCREEN WHITEOUT + EYE ICON) ── */}
            {activeDebuff?.type === 'blind' && (
              <div className="fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-center pointer-events-none select-none animate-pulse p-6">
                <div className="flex flex-col items-center gap-6 animate-bounce">
                  <span className="text-[120px] filter drop-shadow-[0_0_50px_rgba(0,0,0,0.9)]">👁</span>
                  <span className="font-[family-name:var(--font-arcade)] text-5xl md:text-7xl text-black font-black tracking-[0.5em] text-center uppercase">
                    BLINDED!
                  </span>
                  <span className="font-[family-name:var(--font-arcade)] text-sm md:text-base text-black tracking-widest uppercase bg-yellow-400 border-4 border-black px-6 py-2 font-bold shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    ⚠ VISUAL SENSORS OFFLINE // FULL WHITEOUT ⚠
                  </span>
                </div>
              </div>
            )}

            {/* ── HIGH-VOLTAGE CYBER-SIPHON STEAL OVERLAY ── */}
            {activeDebuff?.type === 'steal' && (
              <div className="absolute -inset-4 z-50 pointer-events-none rounded-2xl border-4 border-[var(--color-neon-red)] flex flex-col items-center justify-center gap-3 animate-electric-siphon p-6 bg-red-950/60 backdrop-blur-md overflow-hidden">
                {/* 1. Sweeping Energy Laser Scanline */}
                <div className="absolute inset-y-0 w-[200%] bg-gradient-to-r from-transparent via-red-500/40 to-yellow-400/50 pointer-events-none animate-steal-laser" />
                
                {/* 2. Rotating Siphon Vortex */}
                <div className="w-24 h-24 rounded-full border-4 border-dashed border-red-500 flex items-center justify-center animate-siphon-vortex bg-black/50">
                  <span className="text-5xl filter drop-shadow-[0_0_25px_#ff003c]">⚡</span>
                </div>

                <span className="font-[family-name:var(--font-arcade)] text-3xl md:text-4xl text-[var(--color-neon-red)] tracking-[0.4em] text-center text-glow-red animate-pulse z-10">
                  CYBER-SIPHON DETECTED!
                </span>
                <span className="font-[family-name:var(--font-arcade)] text-xs md:text-sm text-yellow-300 tracking-widest uppercase bg-black/90 px-6 py-1.5 border-2 border-red-500 z-10 shadow-[0_0_15px_rgba(255,0,60,0.8)]">
                  ⚡ OPPONENT SIPHONED 15 CHARACTERS FROM YOUR TYPING PROGRESS ⚡
                </span>
              </div>
            )}

            {/* ── SUB-ZERO ICE LOCK FREEZE OVERLAY ── */}
            {activeDebuff?.type === 'freeze' && (
              <div className="absolute -inset-4 z-50 pointer-events-none rounded-2xl border-4 border-cyan-400 flex flex-col items-center justify-center gap-3 animate-ice-freeze p-6 bg-cyan-950/80 backdrop-blur-xl overflow-hidden shadow-[0_0_60px_rgba(0,243,255,0.8)]">
                {/* Ice Cracks Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.2)_0%,transparent_70%)] pointer-events-none" />
                <span className="text-7xl animate-pulse filter drop-shadow-[0_0_30px_#00f3ff]">❄</span>
                <span className="font-[family-name:var(--font-arcade)] text-3xl md:text-5xl text-[var(--color-neon-cyan)] tracking-[0.4em] text-center text-glow-cyan animate-pulse">
                  SYSTEM FROZEN!
                </span>
                <span className="font-[family-name:var(--font-arcade)] text-xs md:text-sm text-white tracking-widest uppercase bg-black/90 px-6 py-1.5 border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,243,255,0.5)]">
                  ❄ SUB-ZERO ICE LOCK // KEYBOARD IS FROZEN FOR 2.5S ❄
                </span>
              </div>
            )}

            {/* ── SHIELD ACTIVE BADGE & 2X COMBO BOOST BADGES ── */}
            <div className="flex items-center justify-between w-full mb-1 z-20">
              {hasShield ? (
                <div className="flex items-center gap-1 bg-cyan-950/90 border border-cyan-400 px-3 py-1 rounded-full text-xs text-cyan-300 animate-shield shadow-[0_0_12px_rgba(0,243,255,0.4)] font-[family-name:var(--font-arcade)]">
                  <span>🛡️</span>
                  <span className="font-bold tracking-wider">SHIELD ACTIVE (BLOCKS NEXT DEBUFF)</span>
                </div>
              ) : <div />}

              {comboMultiplier > 1 && (
                <div className="flex items-center gap-1 bg-yellow-950/90 border border-yellow-400 px-3 py-1 rounded-full text-xs text-yellow-300 animate-bounce tracking-widest font-[family-name:var(--font-arcade)] shadow-[0_0_12px_rgba(255,255,0,0.5)]">
                  <span>⚡</span>
                  <span className="font-bold">2X COMBO BOOST (5S)</span>
                </div>
              )}
            </div>

            <div className={`w-full transition-all duration-300 ${activeDebuff?.type === 'blind' ? 'blur-2xl opacity-5 scale-95 pointer-events-none select-none' : ''} ${activeDebuff?.type === 'glitch' ? 'animate-cyber-glitch scale-[1.02]' : ''} ${activeDebuff?.type === 'steal' ? 'animate-shake border-red-500' : ''} ${activeDebuff?.type === 'freeze' ? 'blur-sm scale-[0.98] grayscale pointer-events-none' : ''}`}>
              <TypingText text={challengeText} words={challengeWords} typed={typed} combo={combo} />
            </div>
          </div>

          {/* Right Panel */}
          <div className="hidden lg:flex flex-col gap-4 items-center w-full">
            <ComboDisplay combo={combo} best={maxComboRef.current} />
            <PowerUpSlot heldPowerUp={heldPowerUp} />
          </div>

          {/* Mobile Only: Show Right Panel inline */}
          <div className="flex lg:hidden flex-col gap-4 items-center mt-4">
            <ComboDisplay combo={combo} best={maxComboRef.current} />
            <PowerUpSlot heldPowerUp={heldPowerUp} />
          </div>
        </div>
        
        {/* Bottom Section (Stats + Virtual Keyboard - Tight Gap) */}
        <div className="flex flex-col items-center w-full max-w-6xl mx-auto gap-1 mt-1 pb-2 relative z-30">
          <StatsPanel 
            wpm={wpm.toString()} 
            accuracy={`${accuracy}%`} 
            chars={`${typed.length}/${challengeText.length}`} 
            combo={`×${combo}`} 
          />
          <VirtualKeyboard pressedKey={pressedKey} isGlitched={activeDebuff?.type === 'glitch'} />
        </div>
      </div>

      {/* Badges UI - Bottom Left */}
      <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 z-20 flex items-center gap-3 md:gap-4 pointer-events-none">
        {[
          { id: 1, label: gameMode === 'classic_booth' ? 'PT 1' : 'WIN', icon: '👑', active: localPoints >= 1, color: '#fffb00' },
          { id: 2, label: gameMode === 'classic_booth' ? 'PT 2' : 'SPEED', icon: '⚡', active: gameMode === 'classic_booth' ? localPoints >= 2 : wpm >= 50, color: '#00f3ff' },
          { id: 3, label: gameMode === 'classic_booth' ? 'PT 3' : 'ACC', icon: '🎯', active: gameMode === 'classic_booth' ? localPoints >= 3 : (accuracy >= 95 && statsRef.current?.totalKeystrokes >= 20), color: '#39ff14' },
        ].map((b) => (
          <div key={b.id} className="flex flex-col items-center gap-1">
            <div 
              className={`w-10 h-10 md:w-14 md:h-14 border-2 bg-black flex items-center justify-center transition-all duration-300 ${
                b.active 
                  ? 'border-white scale-105' 
                  : 'border-[var(--color-neon-cyan)]/40 opacity-40'
              }`}
              style={{
                borderColor: b.active ? b.color : 'rgba(0,243,255,0.3)',
                boxShadow: b.active ? `0 0 15px ${b.color}, inset 0 0 10px ${b.color}40` : '0 0 8px rgba(0,243,255,0.1)',
              }}
            >
              <span className={`text-lg md:text-2xl transition-all ${b.active ? 'scale-110 animate-pulse' : 'grayscale opacity-50'}`}
                style={{ filter: b.active ? `drop-shadow(0 0 8px ${b.color})` : 'none' }}>
                {b.icon}
              </span>
            </div>
            <span className="font-[family-name:var(--font-arcade)] text-[9px] md:text-[11px] tracking-widest uppercase"
              style={{ color: b.active ? b.color : 'rgba(255,255,255,0.3)' }}>
              {b.label}
            </span>
          </div>
        ))}
      </div>

      {/* Trophy UI - Bottom Right */}
      <div className="absolute bottom-4 md:bottom-8 right-4 md:right-8 z-20 flex items-center justify-center pointer-events-none">
        <div className="w-12 h-12 md:w-16 md:h-16 border-2 border-[var(--color-neon-yellow)] bg-black flex flex-col items-center justify-center"
          style={{ boxShadow: '0 0 15px rgba(255,251,0,0.3), inset 0 0 10px rgba(255,251,0,0.1)' }}>
          <span className="text-xl md:text-3xl filter drop-shadow-[0_0_5px_rgba(255,251,0,0.8)]">🏆</span>
        </div>
      </div>

      {/* Integrated Arcade Ready Status HUD (Game Component Debugger) */}
      <div className="fixed top-4 right-4 z-[90] pointer-events-none flex flex-col items-end gap-1 font-[family-name:var(--font-arcade)] select-none">
        <div className="border-2 border-[var(--color-neon-cyan)] bg-black/90 px-4 py-2 flex flex-col gap-1.5 min-w-[200px]"
          style={{ boxShadow: '0 0 15px rgba(0,243,255,0.3), inset 0 0 15px rgba(0,243,255,0.05)' }}>
          
          <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1 text-[11px] tracking-widest text-[var(--color-neon-cyan)]">
            <span>SYNC MONITOR</span>
            <span className="text-yellow-400">R#{roundNumber || 1}</span>
          </div>

          <div className="flex items-center justify-between text-xs tracking-wider">
            <span className="text-white/70">YOU:</span>
            <span className={localReady ? "text-[var(--color-neon-green)] font-bold drop-shadow-[0_0_5px_rgba(57,255,20,0.8)]" : "text-[var(--color-neon-pink)] font-bold animate-pulse"}>
              {localReady ? "[ READY ]" : "[ NOT READY ]"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs tracking-wider">
            <span className="text-white/70">OPPONENT:</span>
            <span className={opponentReady ? "text-[var(--color-neon-green)] font-bold drop-shadow-[0_0_5px_rgba(57,255,20,0.8)]" : "text-[var(--color-neon-pink)] font-bold animate-pulse"}>
              {opponentReady ? "[ READY ]" : "[ NOT READY ]"}
            </span>
          </div>
        </div>
      </div>


      <style>{`
        @keyframes scan { 0% { transform: translateX(-100%) } 100% { transform: translateX(350%) } }
      `}</style>
    </div>
  );
};

export default BattlePage;

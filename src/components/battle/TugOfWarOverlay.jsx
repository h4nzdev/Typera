import React, { useEffect, useState } from 'react';
import ArcadeText from '../arcade/ArcadeText';
import useMatchStore from '../../store/useMatchStore';
import { playSound } from '../../lib/sounds';

const TugOfWarOverlay = () => {
  const { bossWordState, isHost, myId, players } = useMatchStore();
  const [typed, setTyped] = useState('');

  const word = bossWordState?.word || '';
  const p1Prog = bossWordState?.p1Progress || 0;
  const p2Prog = bossWordState?.p2Progress || 0;
  const myProg = isHost ? p1Prog : p2Prog;
  const oppProg = isHost ? p2Prog : p1Prog;

  const [countdown, setCountdown] = useState(3);

  // Countdown timer
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);
    }
  }, [countdown]);

  // Keydown handler
  useEffect(() => {
    if (countdown !== null) return; // Block input during countdown
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key.length > 1) {
         if (e.key === 'Backspace') {
           setTyped(prev => prev.slice(0, -1));
           playSound('hover');
         }
         return;
      }
      
      setTyped(prev => {
        const next = prev + e.key;
        let correctCount = 0;
        for (let i = 0; i < next.length; i++) {
          if (next[i] === word[i]) correctCount++;
          else break;
        }
        
        const newProgress = Math.min(100, Math.round((correctCount / word.length) * 100)) || 0;
        useMatchStore.getState().updateBossWordProgress(newProgress);
        playSound('hover');

        if (newProgress === 100) {
          // Send win event directly.
          useMatchStore.getState().winBossWord();
        }

        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [word, countdown]);

  // Center percentage (50% is tied)
  const totalProg = myProg + oppProg;
  const myPercent = totalProg === 0 ? 50 : (myProg / totalProg) * 100;

  return (
    <div className="absolute inset-0 z-[500] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto">
      {countdown !== null ? (
         <div className="flex flex-col items-center justify-center">
            <ArcadeText color="red" glow className="text-8xl md:text-9xl animate-ping-once tracking-[0.2em]">
               {countdown}
            </ArcadeText>
            <div className="mt-8 text-white font-[family-name:var(--font-arcade)] uppercase tracking-widest text-xl">
               PREPARE FOR BREACH
            </div>
         </div>
      ) : (
        <>
          <div className="animate-pulse mb-12">
            <ArcadeText color="red" glow className="text-4xl md:text-5xl tracking-[0.3em]">
              FIREWALL BREACH DETECTED
            </ArcadeText>
          </div>
          
          <div className="w-full max-w-4xl px-8 flex flex-col items-center gap-12">
            {/* Progress Bar (Tug of War) */}
            <div className="w-full h-10 bg-gray-950 border-2 border-red-500/50 rounded-full relative overflow-hidden flex shadow-[0_0_30px_rgba(255,0,0,0.4)]">
              <div 
                 className="h-full bg-cyan-500 transition-all duration-100 shadow-[0_0_15px_cyan]"
                 style={{ width: `${myPercent}%` }}
              />
              <div 
                 className="h-full bg-pink-500 transition-all duration-100 shadow-[0_0_15px_pink]"
                 style={{ width: `${100 - myPercent}%` }}
              />
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white z-10 -translate-x-1/2 shadow-[0_0_10px_white]" />
            </div>

            {/* Word Input */}
            <div className="text-4xl md:text-6xl font-[family-name:var(--font-mono)] tracking-[0.2em] relative">
              <div className="text-white/20 absolute inset-0 text-center">{word}</div>
              <div className="relative z-10 flex text-center">
                {word.split('').map((char, i) => {
                  const isTyped = i < typed.length;
                  const isCorrect = isTyped && typed[i] === char;
                  const isWrong = isTyped && typed[i] !== char;
                  
                  let color = 'text-transparent';
                  if (isCorrect) color = 'text-red-500 [text-shadow:0_0_15px_red] animate-pop-fade';
                  else if (isWrong) color = 'text-white bg-red-950 border-b-4 border-red-500';
                  
                  return (
                    <span key={i} className={color}>
                      {isWrong ? typed[i] : char}
                    </span>
                  );
                })}
              </div>
            </div>
            
            <div className="text-red-400 text-sm md:text-lg font-[family-name:var(--font-arcade)] uppercase tracking-widest mt-4 animate-ping-once text-center">
              First to crack the code steals 15% progress!
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TugOfWarOverlay;

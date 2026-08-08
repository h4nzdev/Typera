import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ArcadeText from '../arcade/ArcadeText';

const ComboDisplay = ({ combo = 0, best = 0 }) => {
  const comboRef = useRef(null);

  useEffect(() => {
    if (combo > 0 && comboRef.current) {
      // Pop effect on every hit
      gsap.fromTo(comboRef.current, 
        { scale: 1.4, rotation: gsap.utils.random(-8, 8) },
        { scale: 1, rotation: 0, duration: 0.3, ease: "back.out(3)" }
      );
      
      // Intense shake on milestones (10, 20, 30...)
      if (combo % 10 === 0) {
        gsap.to(comboRef.current, {
           x: 8,
           duration: 0.05,
           repeat: 5,
           yoyo: true,
           onComplete: () => gsap.set(comboRef.current, { x: 0 })
        });
      }
    }
  }, [combo]);

  let statusText = "KEEP GOING!";
  if (combo >= 50) statusText = "GODLIKE!";
  else if (combo >= 30) statusText = "UNSTOPPABLE!";
  else if (combo >= 10) statusText = "GREAT COMBO!";
  else if (combo === 0) statusText = "";

  return (
    <div className="w-56 border border-[var(--color-neon-pink-muted)] rounded-xl p-6 bg-black/40 flex flex-col items-center justify-center gap-2 shrink-0 relative overflow-hidden">
      <ArcadeText color="pink" className="text-sm tracking-widest">COMBO</ArcadeText>
      
      <div ref={comboRef} className="origin-center inline-block z-10">
        <ArcadeText color="yellow" glow className="text-6xl my-2">
          x{combo}
        </ArcadeText>
      </div>
      
      <div className="h-4 flex items-center justify-center z-10">
        <ArcadeText color="yellow" className="text-xs tracking-widest text-center">
          {statusText}
        </ArcadeText>
      </div>

      {/* Power-up Progress Bar */}
      <div className="w-full h-2 bg-black/60 border border-[var(--color-neon-purple-muted)] rounded-full mt-2 overflow-hidden z-10">
        <div 
          className="h-full bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-neon-pink)] transition-all duration-300"
          style={{ width: `${(combo % 20) * 5}%` }}
        ></div>
      </div>
      <div className="text-[10px] text-[var(--color-neon-purple)] font-[family-name:var(--font-arcade)] z-10 mb-2">
        POWER PROGRESS
      </div>

      <div className="w-full h-[1px] bg-white/10 my-2 z-10"></div>

      <ArcadeText color="white" className="text-[10px] text-gray-400 z-10">BEST</ArcadeText>
      <ArcadeText color="purple" glow className="text-xl z-10">x{best}</ArcadeText>
      
      {/* Background Glow if full */}
      {combo > 0 && combo % 20 === 0 && (
        <div className="absolute inset-0 bg-[var(--color-neon-pink)] opacity-10 animate-pulse pointer-events-none"></div>
      )}
    </div>
  );
};

export default ComboDisplay;

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
    <div className="w-56 border border-[var(--color-neon-pink-muted)] rounded-xl p-6 bg-black/40 flex flex-col items-center justify-center gap-2 shrink-0">
      <ArcadeText color="pink" className="text-sm tracking-widest">COMBO</ArcadeText>
      
      <div ref={comboRef} className="origin-center inline-block">
        <ArcadeText color="yellow" glow className="text-6xl my-2">
          x{combo}
        </ArcadeText>
      </div>
      
      <div className="h-4 flex items-center justify-center">
        <ArcadeText color="yellow" className="text-xs tracking-widest text-center">
          {statusText}
        </ArcadeText>
      </div>

      <div className="w-full h-[1px] bg-white/10 my-4"></div>

      <ArcadeText color="white" className="text-[10px] text-gray-400">BEST</ArcadeText>
      <ArcadeText color="purple" glow className="text-xl">x{best}</ArcadeText>
    </div>
  );
};

export default ComboDisplay;

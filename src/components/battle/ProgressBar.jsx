import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ArcadeText from '../arcade/ArcadeText';

const ProgressBar = ({ player, progress, color, className = '' }) => {
  const barRef = useRef(null);

  useEffect(() => {
    gsap.to(barRef.current, {
      width: `${progress}%`,
      duration: 0.5,
      ease: "power2.out"
    });
  }, [progress]);

  const colorClass = color === 'cyan' ? 'bg-[var(--color-neon-cyan)] shadow-[0_0_10px_var(--color-neon-cyan)]' 
                   : 'bg-[var(--color-neon-pink)] shadow-[0_0_10px_var(--color-neon-pink)]';
  
  const borderColor = color === 'cyan' ? 'border-[var(--color-neon-cyan)]' : 'border-[var(--color-neon-pink)]';

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <ArcadeText color={color} className="text-xl">{player}</ArcadeText>
      <div className="flex items-center gap-4">
        <div className={`flex-grow h-6 border-2 ${borderColor} bg-black/50 p-[2px]`}>
          <div ref={barRef} className={`h-full w-0 ${colorClass}`}></div>
        </div>
        <ArcadeText color={color} className="text-xl w-16 text-right">{progress}%</ArcadeText>
      </div>
    </div>
  );
};

export default ProgressBar;

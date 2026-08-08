import React, { useMemo } from 'react';
import ArcadeText from '../arcade/ArcadeText';

const RankBadge = ({ wpm = 0 }) => {
  const rank = useMemo(() => {
    if (wpm >= 100) return { letter: 'S', color: 'yellow', hex: 'var(--color-neon-yellow)' };
    if (wpm >= 80) return { letter: 'A', color: 'cyan', hex: 'var(--color-neon-cyan)' };
    if (wpm >= 60) return { letter: 'B', color: 'purple', hex: 'var(--color-neon-purple)' };
    if (wpm >= 40) return { letter: 'C', color: 'pink', hex: 'var(--color-neon-pink)' };
    return { letter: 'D', color: 'white', hex: '#666666' };
  }, [wpm]);

  return (
    <div className="w-56 border border-[var(--color-neon-cyan-muted)] rounded-xl p-4 bg-black/40 flex flex-col items-center justify-center gap-2 shrink-0 overflow-hidden relative">
      <ArcadeText color="cyan" className="text-sm tracking-widest z-10">RANK</ArcadeText>
      
      <div 
        className="w-24 h-24 flex items-center justify-center my-2 z-10"
        style={{
          background: `radial-gradient(circle, ${rank.hex}40 0%, transparent 70%)`,
          border: `2px solid ${rank.hex}`,
          boxShadow: `0 0 15px ${rank.hex}80, inset 0 0 10px ${rank.hex}40`,
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
        }}
      >
        <ArcadeText color={rank.color} glow className="text-6xl font-bold mt-2">
          {rank.letter}
        </ArcadeText>
      </div>
      
      {rank.letter === 'S' && (
        <div className="absolute inset-0 bg-[var(--color-neon-yellow)] opacity-10 animate-pulse pointer-events-none"></div>
      )}
    </div>
  );
};

export default RankBadge;

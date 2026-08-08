import React from 'react';
import ArcadeText from '../arcade/ArcadeText';
import { Activity } from 'lucide-react';

const OpponentActivity = ({ progress = 0, wpm = 0, accuracy = 100, combo = 0, color = 'pink', debuff = null }) => {
  const colorClass = color === 'cyan' ? 'text-[var(--color-neon-cyan)]' : 'text-[var(--color-neon-pink)]';
  const bgClass = color === 'cyan' ? 'bg-[var(--color-neon-cyan)]' : 'bg-[var(--color-neon-pink)]';
  const borderClass = color === 'cyan' ? 'border-[var(--color-neon-cyan-muted)]' : 'border-[var(--color-neon-pink-muted)]';
  const shadowClass = color === 'cyan' ? 'shadow-[0_0_10px_var(--color-neon-cyan-muted)]' : 'shadow-[0_0_10px_var(--color-neon-pink-muted)]';

  const isSteal = debuff?.type === 'steal';
  const isBlind = debuff?.type === 'blind';
  const isGlitch = debuff?.type === 'glitch';

  return (
    <div className={`w-48 xl:w-56 border-2 ${borderClass} rounded-xl p-4 bg-black/60 flex flex-col gap-4 shrink-0 relative overflow-hidden transition-all duration-300 ${shadowClass} ${isGlitch ? 'animate-pulse translate-x-1 -translate-y-1 skew-x-2 border-red-500' : ''} ${isBlind ? 'blur-sm opacity-50' : ''}`}>
      
      {isGlitch && (
        <div className="absolute inset-0 z-50 pointer-events-none mix-blend-difference bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50"></div>
      )}

      {isSteal && (
        <div className="absolute inset-0 bg-black/90 z-40 flex items-center justify-center backdrop-blur-md">
          <ArcadeText color="red" glow className="text-3xl animate-ping-once tracking-widest">STOLEN</ArcadeText>
        </div>
      )}

      <div className={`flex flex-col gap-4 ${isSteal ? 'opacity-10' : ''}`}>
        <div className="flex items-center gap-2 mb-2">
          <Activity size={16} className={colorClass} />
          <span className={`${colorClass} text-xs font-[family-name:var(--font-arcade)] tracking-widest`}>OPPONENT</span>
        </div>

        <div className="flex justify-between items-center text-xs font-[family-name:var(--font-arcade)] uppercase text-gray-400">
          <span>Typing...</span>
          <span className={colorClass}>{progress}%</span>
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full ${bgClass}`} style={{ width: `${progress}%`, transition: 'width 0.3s ease' }} />
        </div>

        <div className="flex justify-between items-center text-xs font-[family-name:var(--font-arcade)] uppercase text-gray-400 mt-2">
          <span>WPM</span>
          <span className="text-white">{wpm}</span>
        </div>

        <div className="flex justify-between items-center text-xs font-[family-name:var(--font-arcade)] uppercase text-gray-400">
          <span>ACCURACY</span>
          <span className="text-white">{accuracy}%</span>
        </div>

        <div className="flex justify-between items-center text-xs font-[family-name:var(--font-arcade)] uppercase text-gray-400">
          <span>COMBO</span>
          <span className="text-white">x{combo}</span>
        </div>
      </div>
    </div>
  );
};

export default OpponentActivity;

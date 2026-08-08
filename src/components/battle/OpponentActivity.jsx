import React from 'react';
import ArcadeText from '../arcade/ArcadeText';
import { Activity } from 'lucide-react';

const OpponentActivity = ({ progress = 0, wpm = 0, accuracy = 100, combo = 0, color = 'pink' }) => {
  const colorClass = color === 'cyan' ? 'text-[var(--color-neon-cyan)]' : 'text-[var(--color-neon-pink)]';
  const bgClass = color === 'cyan' ? 'bg-[var(--color-neon-cyan)]' : 'bg-[var(--color-neon-pink)]';
  const borderClass = color === 'cyan' ? 'border-[var(--color-neon-cyan-muted)]' : 'border-[var(--color-neon-pink-muted)]';
  const shadowClass = color === 'cyan' ? 'shadow-[0_0_10px_var(--color-neon-cyan-muted)]' : 'shadow-[0_0_10px_var(--color-neon-pink-muted)]';

  return (
    <div className={`w-48 xl:w-56 border-2 ${borderClass} rounded-xl p-4 bg-black/60 flex flex-col gap-4 shrink-0 ${shadowClass}`}>
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
  );
};

export default OpponentActivity;

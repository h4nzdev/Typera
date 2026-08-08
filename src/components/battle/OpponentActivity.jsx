import React from 'react';
import ArcadeText from '../arcade/ArcadeText';
import { Activity } from 'lucide-react';

const OpponentActivity = ({ progress = 61, wpm = 71, accuracy = 96.2, combo = 18 }) => {
  return (
    <div className="w-56 border border-purple-500/30 rounded-xl p-4 bg-black/40 flex flex-col gap-4 shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <Activity size={16} className="text-[var(--color-neon-purple)]" />
        <span className="text-[var(--color-neon-purple)] text-xs font-[family-name:var(--font-arcade)] tracking-widest">OPPONENT ACTIVITY</span>
      </div>

      <div className="flex justify-between items-center text-xs font-[family-name:var(--font-arcade)] uppercase text-gray-400">
        <span>Typing...</span>
        <span className="text-[var(--color-neon-purple)]">{progress}%</span>
      </div>
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-[var(--color-neon-purple)]" style={{ width: `${progress}%` }} />
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

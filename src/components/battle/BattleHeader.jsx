import React from 'react';
import ArcadeText from '../arcade/ArcadeText';
import { Pause } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BattleHeader = ({ timeLeft = "01:24", matchCode = "8F2K91", onPause }) => {
  const navigate = useNavigate();
  return (
    <div className="flex justify-between items-center w-full">
      {/* Match Code */}
      <div className="flex-1">
        <div className="inline-flex flex-col border border-[var(--color-neon-purple-muted)] rounded-lg px-4 py-2 bg-black/40">
          <ArcadeText className="text-gray-400 text-[10px] tracking-widest mb-1">MATCH CODE</ArcadeText>
          <ArcadeText color="purple" glow className="text-xl tracking-wider">{matchCode || '------'}</ArcadeText>
        </div>
      </div>

      {/* Center */}
      <div className="flex flex-col items-center">
        <ArcadeText as="h2" color="cyan" glow className="text-5xl italic tracking-widest -skew-x-12 font-bold">TYPE//BATTLE</ArcadeText>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-12 h-[1px] bg-white/30"></div>
          <span className="text-[var(--color-neon-pink)] text-xs tracking-widest font-[family-name:var(--font-arcade)] uppercase">1V1 TYPING ARENA</span>
          <div className="w-12 h-[1px] bg-white/30"></div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
           <span className="text-[var(--color-neon-pink)] text-[10px] tracking-widest font-[family-name:var(--font-arcade)] uppercase">TIME LEFT</span>
           <ArcadeText color="white" glow className="text-2xl">{timeLeft}</ArcadeText>
        </div>
        <button 
          onClick={onPause}
          className="border-2 border-white/20 rounded-xl p-3 bg-black/40 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Pause size={20} className="text-white" fill="white" />
        </button>
      </div>
    </div>
  );
};

export default BattleHeader;

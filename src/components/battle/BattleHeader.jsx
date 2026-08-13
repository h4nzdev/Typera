import React from 'react';
import ArcadeText from '../arcade/ArcadeText';
import { Pause } from 'lucide-react';
import PingBadge from '../arcade/PingBadge';
import useMatchStore from '../../store/useMatchStore';

const BattleHeader = ({ timeLeft = "01:24", matchCode = "8F2K91", onPause }) => {
  const { gameMode, localPoints, opponentPoints } = useMatchStore();
  const isBoothMode = gameMode === 'classic_booth';

  return (
    <div className="flex justify-between items-center w-full gap-4">
      {/* Left: Match Code & Ping */}
      <div className="flex-1 flex items-center gap-3">
        <div className="relative border-2 border-[var(--color-neon-purple)] px-3 py-1.5 bg-black"
          style={{ boxShadow: '0 0 10px rgba(176,38,255,0.25), inset 0 0 10px rgba(176,38,255,0.05)' }}>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-[var(--color-neon-purple)]" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--color-neon-purple)]" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[var(--color-neon-purple)]" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[var(--color-neon-purple)]" />
          <span className="font-[family-name:var(--font-arcade)] text-[9px] tracking-widest text-white/30 block">MATCH CODE</span>
          <ArcadeText color="purple" glow className="text-lg tracking-wider">{matchCode || '------'}</ArcadeText>
        </div>
        <PingBadge />
      </div>

      {/* Center: Logo + Mode */}
      <div className="flex flex-col items-center shrink-0">
        <ArcadeText as="h2" color="cyan" glow className="text-3xl md:text-5xl italic tracking-widest -skew-x-12 font-bold">
          TYPE<span className="text-[var(--color-neon-pink)]">//</span>BATTLE
        </ArcadeText>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-10 h-[1px] bg-white/20" />
          {isBoothMode ? (
            <span className="font-[family-name:var(--font-arcade)] text-[10px] tracking-widest text-[var(--color-neon-yellow)]">
              ● CLASSIC 1V1 BOOTH
            </span>
          ) : (
            <span className="font-[family-name:var(--font-arcade)] text-[10px] tracking-widest text-[var(--color-neon-pink)]">
              1V1 TYPING ARENA
            </span>
          )}
          <div className="w-10 h-[1px] bg-white/20" />
        </div>
      </div>

      {/* Right: Timer + Pause */}
      <div className="flex-1 flex items-center justify-end gap-3">
        {/* Timer */}
        <div className="relative border-2 border-[var(--color-neon-pink)] px-3 py-1.5 bg-black text-right"
          style={{ boxShadow: '0 0 10px rgba(255,0,127,0.25), inset 0 0 10px rgba(255,0,127,0.05)' }}>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-[var(--color-neon-pink)]" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--color-neon-pink)]" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[var(--color-neon-pink)]" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[var(--color-neon-pink)]" />
          <span className="font-[family-name:var(--font-arcade)] text-[9px] tracking-widest text-white/30 block">TIME LEFT</span>
          <ArcadeText color="white" glow className="text-2xl">{timeLeft}</ArcadeText>
        </div>
        {/* Pause button */}
        <button onClick={onPause}
          className="border-2 border-white/20 bg-black p-3 hover:border-[var(--color-neon-cyan)] hover:bg-[var(--color-neon-cyan-muted)] transition-colors cursor-pointer"
          style={{ boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5)' }}>
          <Pause size={18} className="text-white" fill="white" />
        </button>
      </div>
    </div>
  );
};

export default BattleHeader;

import React from 'react';
import ArcadeText from '../arcade/ArcadeText';

const PowerUpSlot = ({ heldPowerUp }) => {
  return (
    <div className={`w-56 border rounded-xl p-4 flex flex-col items-center justify-center gap-3 shrink-0 overflow-hidden relative transition-all duration-300 ${
      heldPowerUp 
        ? 'border-[var(--color-neon-yellow)] bg-yellow-900/20 shadow-[0_0_15px_rgba(255,251,0,0.2)]' 
        : 'border-white/10 bg-black/40 opacity-70'
    }`}>
      <ArcadeText color={heldPowerUp ? "yellow" : "white"} className="text-sm tracking-widest z-10">
        POWER-UP
      </ArcadeText>
      
      <div className={`w-32 h-24 border-2 rounded-lg flex flex-col items-center justify-center z-10 transition-all ${
        heldPowerUp 
          ? 'border-[var(--color-neon-yellow)] bg-black/80' 
          : 'border-white/10 border-dashed bg-black/20'
      }`}>
        {heldPowerUp ? (
          <>
            <div className="text-3xl mb-1 uppercase animate-pulse flex items-center gap-1 font-bold">
              {heldPowerUp === 'shield' && '🛡️'}
              {heldPowerUp === 'freeze' && '❄️'}
              {heldPowerUp === 'steal' && '⚡'}
              {heldPowerUp === 'blind' && '👁️'}
              {heldPowerUp === 'glitch' && '👾'}
              <ArcadeText color={heldPowerUp === 'shield' ? "cyan" : "yellow"} glow className="text-xl">
                {heldPowerUp}
              </ArcadeText>
            </div>
            <div className="text-[var(--color-neon-yellow)] text-[10px] font-[family-name:var(--font-arcade)] animate-ping-once tracking-widest">
              [ ENTER ]
            </div>
          </>
        ) : (
          <div className="text-white/20 text-xs font-[family-name:var(--font-arcade)] tracking-widest text-center">
            EMPTY<br/>SLOT
          </div>
        )}
      </div>

      {heldPowerUp && (
        <div className="absolute inset-0 bg-[var(--color-neon-yellow)] opacity-5 animate-pulse pointer-events-none"></div>
      )}
    </div>
  );
};

export default PowerUpSlot;

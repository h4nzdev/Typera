import React, { useEffect, useState } from 'react';

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

const SpectatorKeyboard = ({ activeKey = null, color = 'cyan' }) => {
  const [pressedKey, setPressedKey] = useState(null);

  useEffect(() => {
    if (!activeKey) return;
    const keyUpper = activeKey === ' ' ? 'SPACE' : activeKey.toUpperCase();
    setPressedKey(keyUpper);

    const timer = setTimeout(() => {
      setPressedKey(null);
    }, 150);

    return () => clearTimeout(timer);
  }, [activeKey]);

  const activeBg = color === 'cyan' 
    ? 'bg-[var(--color-neon-cyan)] text-black shadow-[0_0_15px_#00f3ff]' 
    : 'bg-[var(--color-neon-pink)] text-black shadow-[0_0_15px_#ff007f]';

  return (
    <div className="flex flex-col items-center gap-1 bg-black/90 border border-white/10 p-2.5 rounded-xl w-full select-none shadow-inner">
      {KEYBOARD_ROWS.map((row, rIdx) => (
        <div key={rIdx} className="flex justify-center gap-1 w-full">
          {row.map((key) => {
            const isPressed = pressedKey === key;
            return (
              <div
                key={key}
                className={`flex-1 h-7 flex items-center justify-center font-mono font-bold text-[10px] rounded transition-all duration-75 border ${
                  isPressed
                    ? `${activeBg} border-white scale-110 z-10`
                    : 'bg-white/5 border-white/10 text-white/40'
                }`}
              >
                {key}
              </div>
            );
          })}
        </div>
      ))}
      <div className="flex justify-center w-full mt-0.5">
        <div
          className={`w-36 h-5 rounded flex items-center justify-center font-mono text-[9px] border transition-all duration-75 ${
            pressedKey === 'SPACE'
              ? `${activeBg} border-white scale-105`
              : 'bg-white/5 border-white/10 text-white/30'
          }`}
        >
          SPACE
        </div>
      </div>
    </div>
  );
};

export default SpectatorKeyboard;

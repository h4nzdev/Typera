import React from 'react';
import { Delete } from 'lucide-react';

const VirtualKey = ({ char, state = 'normal', className = '' }) => {
  const baseClasses = `border rounded-md flex items-center justify-center font-[family-name:var(--font-arcade)] text-lg transition-all duration-100 ${className}`;
  
  let stateClasses = "border-purple-500/30 text-purple-200 bg-black/40"; // normal
  
  if (state === 'pressed') {
    stateClasses = "border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan-muted)] shadow-[0_0_10px_var(--color-neon-cyan)] scale-95";
  } else if (state === 'correct') {
    stateClasses = "border-[var(--color-neon-green)] text-[var(--color-neon-green)] bg-green-900/40 shadow-[0_0_10px_var(--color-neon-green-muted)]";
  } else if (state === 'incorrect') {
    stateClasses = "border-[var(--color-neon-red)] text-[var(--color-neon-red)] bg-red-900/40";
  }

  return (
    <div className={`${baseClasses} ${stateClasses}`}>
      {char}
    </div>
  );
};

const VirtualKeyboard = ({ pressedKey = null }) => {
  const row1 = "QWERTYUIOP".split('');
  const row2 = "ASDFGHJKL".split('');
  const row3 = "ZXCVBNM".split('');

  const getKeyState = (char) => {
    if (pressedKey && pressedKey.toUpperCase() === char) return 'pressed';
    return 'normal';
  };

  return (
    <div className="flex flex-col gap-3 md:gap-4 items-center mt-2 w-full max-w-5xl">
      <div className="flex gap-2 md:gap-3">
        {row1.map(char => <VirtualKey key={char} char={char} state={getKeyState(char)} className="w-12 h-12 md:w-16 md:h-16" />)}
      </div>
      <div className="flex gap-2 md:gap-3">
        {row2.map(char => <VirtualKey key={char} char={char} state={getKeyState(char)} className="w-12 h-12 md:w-16 md:h-16" />)}
      </div>
      <div className="flex gap-2 md:gap-3 w-full justify-center">
        <VirtualKey char="SHIFT" state={getKeyState('SHIFT')} className="w-20 h-12 md:w-28 md:h-16 text-sm md:text-base" />
        {row3.map(char => <VirtualKey key={char} char={char} state={getKeyState(char)} className="w-12 h-12 md:w-16 md:h-16" />)}
        <VirtualKey char={<Delete size={24} />} state={getKeyState('BACKSPACE')} className="w-20 h-12 md:w-28 md:h-16 text-sm md:text-base" />
      </div>
      <div className="flex gap-2 md:gap-3">
        <VirtualKey char="SPACE" state={getKeyState(' ')} className="w-72 md:w-[600px] h-10 md:h-14 text-sm md:text-base" />
      </div>
    </div>
  );
};

export default VirtualKeyboard;

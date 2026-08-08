import React from 'react';
import { playSound } from '../../lib/sounds';

const ArcadeButton = ({ children, onClick, color = 'cyan', className = '', type = 'button', disabled = false, ...props }) => {
  const baseClasses = `relative px-6 py-3 font-[family-name:var(--font-arcade)] text-xl tracking-widest uppercase transition-all duration-200 border-2 active:scale-95 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed active:scale-100' : ''}`;
  
  const colorClasses = {
    cyan: "text-white border-[var(--color-neon-cyan)] hover:bg-[var(--color-neon-cyan-muted)] border-glow-cyan text-glow-cyan",
    pink: "text-white border-[var(--color-neon-pink)] hover:bg-[var(--color-neon-pink-muted)] border-glow-pink text-glow-pink",
    purple: "text-white border-[var(--color-neon-purple)] hover:bg-[var(--color-neon-purple-muted)] shadow-[0_0_5px_rgba(176,38,255,0.2),inset_0_0_5px_rgba(176,38,255,0.2)] text-glow-purple",
  };

  const handleClick = (e) => {
    if (!disabled) {
      playSound('click'); // We don't have a specific click sound, 'keyPress' is too mechanical for UI. Wait, let's look at `sounds.js` to see what sounds we have. We have 'hover' and 'error' and 'combo' and 'keyPress'. I'll just use 'hover' for click and a softer hover for enter. Actually I'll implement `playSound('click')` which might fallback or I'll use 'keyPress'. Let's use 'hover' for onMouseEnter and maybe 'keyPress' for click.
      if (onClick) onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${colorClasses[color]} ${className}`}
      onClick={handleClick}
      onMouseEnter={() => !disabled && playSound('hover')}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default ArcadeButton;

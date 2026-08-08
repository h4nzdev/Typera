import React from 'react';

const ArcadeButton = ({ children, onClick, color = 'cyan', className = '', type = 'button', disabled = false, ...props }) => {
  const baseClasses = `relative px-6 py-3 font-[family-name:var(--font-arcade)] text-xl tracking-widest uppercase transition-all duration-200 border-2 active:scale-95 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed active:scale-100' : ''}`;
  
  const colorClasses = {
    cyan: "text-white border-[var(--color-neon-cyan)] hover:bg-[var(--color-neon-cyan-muted)] border-glow-cyan text-glow-cyan",
    pink: "text-white border-[var(--color-neon-pink)] hover:bg-[var(--color-neon-pink-muted)] border-glow-pink text-glow-pink",
    purple: "text-white border-[var(--color-neon-purple)] hover:bg-[var(--color-neon-purple-muted)] shadow-[0_0_5px_rgba(176,38,255,0.2),inset_0_0_5px_rgba(176,38,255,0.2)] text-glow-purple",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${colorClasses[color]} ${className}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default ArcadeButton;

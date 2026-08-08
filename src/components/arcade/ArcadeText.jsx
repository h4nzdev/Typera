import React from 'react';

const ArcadeText = ({ children, as: Component = 'span', color = 'white', glow = false, className = '' }) => {
  const baseClasses = "font-[family-name:var(--font-arcade)] uppercase tracking-widest";
  
  const colors = {
    white: "text-white",
    cyan: "text-[var(--color-neon-cyan)]",
    pink: "text-[var(--color-neon-pink)]",
    purple: "text-[var(--color-neon-purple)]",
    green: "text-[var(--color-neon-green)]",
    yellow: "text-[var(--color-neon-yellow)]",
    red: "text-[var(--color-neon-red)]",
  };

  const glows = {
    white: "",
    cyan: "text-glow-cyan",
    pink: "text-glow-pink",
    purple: "text-glow-purple",
    green: "text-glow-green",
    red: "text-glow-red",
    yellow: "", 
  };

  const colorClass = colors[color] || colors.white;
  const glowClass = glow ? (glows[color] || '') : '';

  return (
    <Component className={`${baseClasses} ${colorClass} ${glowClass} ${className}`}>
      {children}
    </Component>
  );
};

export default ArcadeText;

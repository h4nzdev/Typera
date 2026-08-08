import React from 'react';

const NeonBorder = ({ children, color = 'cyan', className = '' }) => {
  const colorClasses = {
    cyan: "border-[var(--color-neon-cyan)] border-glow-cyan",
    pink: "border-[var(--color-neon-pink)] border-glow-pink",
    purple: "border-[var(--color-neon-purple)] shadow-[0_0_5px_rgba(176,38,255,0.2),inset_0_0_5px_rgba(176,38,255,0.2)]",
  };

  return (
    <div className={`border-2 ${colorClasses[color]} ${className}`}>
      {children}
    </div>
  );
};

export default NeonBorder;

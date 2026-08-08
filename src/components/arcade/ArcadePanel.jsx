import React from 'react';

const ArcadePanel = ({ children, color = 'cyan', className = '' }) => {
  const baseClasses = "relative p-6 border-2 bg-black/40 backdrop-blur-sm";
  
  const colorClasses = {
    cyan: "border-[var(--color-neon-cyan)] border-glow-cyan",
    pink: "border-[var(--color-neon-pink)] border-glow-pink",
    purple: "border-[var(--color-neon-purple)] shadow-[0_0_5px_rgba(176,38,255,0.2),inset_0_0_5px_rgba(176,38,255,0.2)]",
  };

  return (
    <div className={`${baseClasses} ${colorClasses[color]} ${className}`}>
      {/* Decorative arcade corners */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white -translate-x-[2px] -translate-y-[2px]`}></div>
      <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white translate-x-[2px] -translate-y-[2px]`}></div>
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white -translate-x-[2px] translate-y-[2px]`}></div>
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white translate-x-[2px] translate-y-[2px]`}></div>
      
      {children}
    </div>
  );
};

export default ArcadePanel;

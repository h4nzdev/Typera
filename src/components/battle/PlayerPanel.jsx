import React from 'react';
import ArcadeText from '../arcade/ArcadeText';

const PlayerPanel = ({ player, name, isYou, progress, wpm, color = 'cyan', reverse = false }) => {
  const borderColor = color === 'cyan' ? 'border-[var(--color-neon-cyan)] shadow-[0_0_15px_var(--color-neon-cyan-muted)]' : 'border-[var(--color-neon-pink)] shadow-[0_0_15px_var(--color-neon-pink-muted)]';
  const textColor = color === 'cyan' ? 'text-[var(--color-neon-cyan)]' : 'text-[var(--color-neon-pink)]';
  const barColor = color === 'cyan' ? 'bg-[var(--color-neon-cyan)]' : 'bg-[var(--color-neon-pink)]';
  const glowShadow = color === 'cyan' ? 'drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]' : 'drop-shadow-[0_0_8px_rgba(255,0,127,0.8)]';

  const segments = 12;
  const activeSegments = Math.round((progress / 100) * segments);

  // Chevron shape for the progress bar segments
  const clipPathRight = 'polygon(0 0, 80% 0, 100% 50%, 80% 100%, 0 100%, 20% 50%)';
  const clipPathLeft = 'polygon(20% 0, 100% 0, 80% 50%, 100% 100%, 20% 100%, 0 50%)';

  return (
    <div className={`flex items-start gap-4 md:gap-6 ${reverse ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar Box */}
      <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 ${borderColor} bg-black/80 flex items-center justify-center overflow-hidden shrink-0 relative`}>
        {/* Simple geometric face as placeholder */}
        <div className={`flex flex-col items-center gap-1 ${glowShadow}`}>
           <div className={`w-10 h-6 md:w-12 md:h-8 ${barColor} rounded-t-full relative`}>
             <div className="absolute top-2 left-2 w-2 h-2 bg-black rounded-full"></div>
             <div className="absolute top-2 right-2 w-2 h-2 bg-black rounded-full"></div>
           </div>
           <div className={`w-8 h-4 md:w-10 md:h-5 ${barColor} rounded-b-xl`}></div>
        </div>
      </div>
      
      <div className={`flex flex-col flex-grow pt-1 ${reverse ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2">
           <span className={`text-[10px] md:text-xs tracking-widest font-[family-name:var(--font-arcade)] uppercase ${textColor}`}>{player}</span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <ArcadeText color="white" glow className="text-xl md:text-3xl">{name}</ArcadeText>
          {isYou && <span className={`bg-[var(--color-neon-cyan)] text-black text-[9px] md:text-[10px] px-2 py-0.5 rounded-sm font-bold font-sans`}>YOU</span>}
        </div>
        
        {/* Progress Bar Container */}
        <div className={`flex gap-[2px] md:gap-[4px] mt-2 md:mt-3 w-full max-w-[150px] md:max-w-[240px] h-4 md:h-5 ${reverse ? 'flex-row-reverse' : 'flex-row'} border border-gray-800 p-0.5 rounded-sm bg-black/50`}>
          {Array.from({ length: segments }).map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 ${i < activeSegments ? barColor : 'bg-gray-900'} transition-colors duration-300`}
              style={{ clipPath: reverse ? clipPathLeft : clipPathRight }}
            />
          ))}
        </div>
        
        <div className="mt-2 text-xs md:text-sm font-[family-name:var(--font-arcade)] uppercase tracking-wider">
          <span className="text-gray-500">WPM </span>
          <span className={textColor}>{wpm}</span>
        </div>
      </div>
      
      <div className={`flex flex-col justify-center ${reverse ? 'items-start mr-2 md:mr-6' : 'items-end ml-2 md:ml-6'} mt-6 md:mt-8`}>
        <ArcadeText color={color} className="text-3xl md:text-5xl shrink-0">{progress}%</ArcadeText>
      </div>
    </div>
  );
};

export default PlayerPanel;

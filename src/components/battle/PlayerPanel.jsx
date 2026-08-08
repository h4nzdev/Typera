import React from 'react';
import ArcadeText from '../arcade/ArcadeText';

const PlayerPanel = ({ player, name, isYou, progress, wpm, color = 'cyan', reverse = false }) => {
  const borderColor = color === 'cyan' ? 'border-[var(--color-neon-cyan)] shadow-[0_0_15px_var(--color-neon-cyan-muted)]' : 'border-[var(--color-neon-pink)] shadow-[0_0_15px_var(--color-neon-pink-muted)]';
  const textColor = color === 'cyan' ? 'text-[var(--color-neon-cyan)]' : 'text-[var(--color-neon-pink)]';
  const barColor = color === 'cyan' ? 'bg-[var(--color-neon-cyan)]' : 'bg-[var(--color-neon-pink)]';

  const segments = 15;
  const activeSegments = Math.round((progress / 100) * segments);

  return (
    <div className={`flex items-start gap-6 ${reverse ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-24 h-24 rounded-2xl border-2 ${borderColor} bg-black/60 flex items-center justify-center overflow-hidden shrink-0`}>
         <div className={`w-14 h-14 ${barColor} opacity-50 rounded-full`} />
      </div>
      
      <div className={`flex flex-col flex-grow pt-1 ${reverse ? 'items-end' : 'items-start'}`}>
        <span className={`text-xs tracking-widest font-[family-name:var(--font-arcade)] uppercase ${textColor}`}>{player}</span>
        <div className="flex items-center gap-3">
          <ArcadeText color="white" glow className="text-3xl">{name}</ArcadeText>
          {isYou && <span className={`bg-[var(--color-neon-cyan)] text-black text-[10px] px-2 py-0.5 rounded-full font-bold font-sans`}>YOU</span>}
        </div>
        
        <div className={`flex gap-[2px] mt-3 w-full max-w-[240px] h-5 ${reverse ? 'flex-row-reverse' : 'flex-row'}`}>
          {Array.from({ length: segments }).map((_, i) => (
            <div key={i} className={`flex-1 ${reverse ? 'skew-x-[20deg]' : '-skew-x-[20deg]'} border border-white/20 ${i < activeSegments ? barColor : 'bg-transparent'}`} />
          ))}
        </div>
        
        <div className="mt-3 text-sm font-[family-name:var(--font-arcade)] uppercase tracking-wider">
          <span className="text-gray-400">WPM </span>
          <span className={textColor}>{wpm}</span>
        </div>
      </div>
      
      <ArcadeText color={color} className={`text-4xl shrink-0 mt-8 ${reverse ? 'mr-4' : 'ml-4'}`}>{progress}%</ArcadeText>
    </div>
  );
};

export default PlayerPanel;

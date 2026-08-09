import React from 'react';
import ArcadeText from '../arcade/ArcadeText';
import { User } from 'lucide-react';

const PlayerPanel = ({ player, name, isYou, progress, wpm, color = 'cyan', reverse = false, hp, maxHp, showHp = false, points = null }) => {
  const borderColor = color === 'cyan' ? 'border-[var(--color-neon-cyan)] shadow-[0_0_15px_var(--color-neon-cyan-muted)]' : 'border-[var(--color-neon-pink)] shadow-[0_0_15px_var(--color-neon-pink-muted)]';
  const textColor = color === 'cyan' ? 'text-[var(--color-neon-cyan)]' : 'text-[var(--color-neon-pink)]';
  const barColor = color === 'cyan' ? 'bg-[var(--color-neon-cyan)]' : 'bg-[var(--color-neon-pink)]';
  const glowShadow = color === 'cyan' ? 'drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]' : 'drop-shadow-[0_0_8px_rgba(255,0,127,0.8)]';

  const segments = 12;
  const activeSegments = Math.round((progress / 100) * segments);
  
  const [isHit, setIsHit] = React.useState(false);
  const prevHp = React.useRef(hp);

  React.useEffect(() => {
    if (showHp && hp < prevHp.current) {
      setIsHit(true);
      const timer = setTimeout(() => setIsHit(false), 200);
      prevHp.current = hp;
      return () => clearTimeout(timer);
    }
    prevHp.current = hp;
  }, [hp, showHp]);

  // Chevron shape for the progress bar segments
  const clipPathRight = 'polygon(0 0, 80% 0, 100% 50%, 80% 100%, 0 100%, 20% 50%)';
  const clipPathLeft = 'polygon(20% 0, 100% 0, 80% 50%, 100% 100%, 20% 100%, 0 50%)';

  return (
    <div className={`flex items-start gap-4 md:gap-6 ${reverse ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar Box — pixel art style */}
      <div className={`w-20 h-20 md:w-24 md:h-24 border-2 ${borderColor} bg-black flex items-center justify-center overflow-hidden shrink-0 relative`}
        style={{ imageRendering: 'pixelated', boxShadow: color === 'cyan' ? '0 0 12px rgba(0,243,255,0.3), inset 0 0 12px rgba(0,243,255,0.05)' : '0 0 12px rgba(255,0,127,0.3), inset 0 0 12px rgba(255,0,127,0.05)' }}>
        {/* Pixel corner accents */}
        <div className={`absolute top-0 left-0 w-2 h-2 ${barColor}`} />
        <div className={`absolute top-0 right-0 w-2 h-2 ${barColor}`} />
        <div className={`absolute bottom-0 left-0 w-2 h-2 ${barColor}`} />
        <div className={`absolute bottom-0 right-0 w-2 h-2 ${barColor}`} />
        {/* Simple geometric face */}
        <div className={`flex flex-col items-center gap-1 ${glowShadow}`}>
           <div className={`w-10 h-6 md:w-12 md:h-8 ${barColor} rounded-t-full relative`}>
             <div className="absolute top-2 left-2 w-2 h-2 bg-black rounded-full"></div>
             <div className="absolute top-2 right-2 w-2 h-2 bg-black rounded-full"></div>
           </div>
           <div className={`w-8 h-4 md:w-10 md:h-5 ${barColor} rounded-b-xl`}></div>
        </div>
      </div>
      
      <div className={`flex flex-col gap-2 flex-grow ${reverse ? 'items-end' : 'items-start'}`}>
        <div className="flex items-end gap-3 mb-1">
          <ArcadeText color="white" className="text-xl md:text-2xl">{player}</ArcadeText>
          <ArcadeText color={color} className="text-xs md:text-sm tracking-widest opacity-80">{name}</ArcadeText>
        </div>
        
        {showHp && (
          <div className="w-full max-w-[150px] md:max-w-[240px] flex flex-col gap-1 mb-2">
             <div className="flex justify-between items-center text-[10px] md:text-xs font-[family-name:var(--font-arcade)]">
                <span className="text-red-400">HP</span>
                <span className="text-white">{hp}/{maxHp}</span>
             </div>
             <div className={`w-full h-2 md:h-3 rounded-sm border overflow-hidden relative transition-colors ${isHit ? 'bg-white border-white animate-shake' : 'bg-red-900/40 border-red-900/50'}`}>
                <div className={`h-full shadow-[0_0_10px_red] ${isHit ? 'bg-white' : 'bg-red-500'}`} style={{ width: `${Math.max(0, (hp / maxHp) * 100)}%`, transition: 'width 0.3s ease-out' }}></div>
             </div>
          </div>
        )}
        
        {/* Progress Bar Container */}
        <div className={`flex gap-[2px] md:gap-[4px] w-full max-w-[150px] md:max-w-[240px] h-4 md:h-5 ${reverse ? 'flex-row-reverse' : 'flex-row'} border border-gray-800 p-0.5 rounded-sm bg-black/50`}>
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

        {points !== null && (
          <div className="flex gap-2 mt-1">
            {[1, 2, 3].map((star) => (
              <div 
                key={star} 
                className={`w-4 h-4 rounded-full border border-[var(--color-neon-yellow)] ${points >= star ? 'bg-[var(--color-neon-yellow)] shadow-[0_0_10px_var(--color-neon-yellow)]' : 'bg-black/50'}`}
              ></div>
            ))}
          </div>
        )}
      </div>
      
      <div className={`flex flex-col justify-center ${reverse ? 'items-start mr-2 md:mr-6' : 'items-end ml-2 md:ml-6'} mt-6 md:mt-8`}>
        <ArcadeText color={color} className="text-3xl md:text-5xl shrink-0">{progress}%</ArcadeText>
      </div>
    </div>
  );
};

export default PlayerPanel;

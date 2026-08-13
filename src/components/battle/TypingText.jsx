import React from 'react';

const TypingText = ({ text = "The quick brown fox jumps over the lazy dog", words = null, typed = null }) => {
  const activeCharRef = React.useRef(null);
  const containerRef = React.useRef(null);
  
  React.useEffect(() => {
    if (activeCharRef.current && containerRef.current) {
      const container = containerRef.current;
      const el = activeCharRef.current;
      container.scrollTo({
        top: el.offsetTop - container.clientHeight / 2 + 15,
        behavior: 'smooth'
      });
    }
  }, [typed]);
  
  const getCharState = (index) => {
    if (typed === null) {
      if (index < 10) return 'correct';
      if (index >= 10 && index < 25) return 'incorrect';
      if (index === 25) return 'current';
      return 'pending';
    }

    if (index < typed.length) {
      return typed[index] === text[index] ? 'correct' : 'incorrect';
    }
    if (index === typed.length) return 'current';
    return 'pending';
  };

  const currentTypedText = typed !== null ? typed : "The quick brown fox jumps";
  const typedLength = typed !== null ? typed.length : 0;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="text-[var(--color-neon-purple)] font-[family-name:var(--font-arcade)] text-xs tracking-[0.2em] uppercase flex items-center gap-2">
        <span className="text-[var(--color-neon-cyan)] animate-pulse">⚡</span>
        <span>TYPE THE FOLLOWING</span>
        <span className="text-[var(--color-neon-cyan)] animate-pulse">⚡</span>
      </div>
      
      {/* ── TARGET TEXT CONTAINER WITH ELECTRIC LIGHTNING EFFECTS ── */}
      <div 
        ref={containerRef}
        className="w-full bg-black/80 border-2 border-[var(--color-neon-purple)] rounded-xl p-6 shadow-[0_0_20px_var(--color-neon-purple-muted)] h-[160px] overflow-hidden relative"
      >
        {/* Lightning Scanline Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-neon-cyan)]/15 to-transparent w-full h-full animate-lightning-scan z-0" />

        <div className="flex flex-wrap gap-x-0.5 gap-y-3 font-[family-name:var(--font-mono)] text-xl md:text-2xl leading-relaxed tracking-wider relative z-10">
          {(() => {
            const wordsWithIndices = [];
            let currentIndex = 0;
            
            const sourceWords = words || text.split(' ').map(word => ({ word, type: 'normal' }));
            
            sourceWords.forEach((item, i, arr) => {
              wordsWithIndices.push({
                word: item.word,
                type: item.type,
                startIndex: currentIndex,
                isLast: i === arr.length - 1
              });
              currentIndex += item.word.length + 1; // +1 for space
            });

            return wordsWithIndices.map((item, wordIdx) => {
              const wordChars = item.word.split('');
              
              return (
                <div key={wordIdx} className="flex">
                  {wordChars.map((char, charIdx) => {
                    const absIndex = item.startIndex + charIdx;
                    const state = getCharState(absIndex);
                    let className = "";
                    const isJustTyped = absIndex === typedLength - 1;
                    
                    if (state === 'correct') {
                      className = `text-[var(--color-neon-green)] drop-shadow-[0_0_8px_#39ff14] ${isJustTyped ? 'animate-lightning-spark inline-block' : 'animate-pop-fade'}`;
                    } else if (state === 'incorrect') {
                      className = "text-[var(--color-neon-red)] bg-red-950/80 font-black border border-red-500/80 rounded px-[1px] shadow-[0_0_12px_#ff003c]";
                    } else if (state === 'current') {
                      className = "text-black font-extrabold rounded px-1 animate-electric-cursor border border-cyan-300 z-10 scale-110 inline-block";
                    } else {
                      if (item.type === 'tnt') className = "text-red-500 animate-pulse font-bold drop-shadow-[0_0_8px_red]";
                      else if (item.type === 'sword') className = "text-yellow-500 font-bold drop-shadow-[0_0_8px_yellow]";
                      else className = "text-gray-500";
                    }
                    
                    return (
                      <span 
                        key={absIndex} 
                        ref={state === 'current' ? activeCharRef : null}
                        className={`px-[1px] relative transition-transform duration-75 ${className}`}
                      >
                        {char}
                      </span>
                    );
                  })}
                  
                  {/* Space character after the word */}
                  {!item.isLast && (() => {
                    const absIndex = item.startIndex + wordChars.length;
                    const state = getCharState(absIndex);
                    let className = "";
                    const isJustTyped = absIndex === typedLength - 1;
                    
                    if (state === 'correct') {
                      className = `text-[var(--color-neon-green)] ${isJustTyped ? 'animate-lightning-spark inline-block' : ''}`;
                    } else if (state === 'incorrect') {
                      className = "text-[var(--color-neon-red)] bg-red-950/80 font-black border border-red-500/80 rounded shadow-[0_0_12px_#ff003c]";
                    } else if (state === 'current') {
                      className = "text-black font-extrabold rounded px-1 animate-electric-cursor border border-cyan-300 z-10 scale-110 inline-block";
                    } else {
                      className = "text-transparent";
                    }

                    return (
                      <span 
                        key={absIndex} 
                        ref={state === 'current' ? activeCharRef : null}
                        className={`px-[2px] ${className}`}
                      >
                        {state === 'incorrect' ? '_' : '\u00A0'}
                      </span>
                    );
                  })()}
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* ── LIVE INPUT DISPLAY BOX WITH ELECTRIC AURA ── */}
      <div className="w-full bg-black/90 border-2 border-[var(--color-neon-cyan)]/60 rounded-xl p-4 shadow-[0_0_20px_rgba(0,243,255,0.3)]">
        <div className="font-[family-name:var(--font-mono)] text-xl md:text-2xl text-white tracking-wider flex items-center min-h-[32px] overflow-hidden">
          <span className="text-[var(--color-neon-cyan)] text-glow-cyan drop-shadow-[0_0_8px_#00f3ff]">
            {currentTypedText}
          </span>
          <span className="w-3.5 h-7 bg-[var(--color-neon-cyan)] shadow-[0_0_15px_#00f3ff] animate-pulse ml-1 inline-block shrink-0"></span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-1 w-full px-4 font-[family-name:var(--font-arcade)] text-[10px] tracking-widest uppercase">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[var(--color-neon-green)] shadow-[0_0_6px_#39ff14]"></div>
          <span className="text-[var(--color-neon-green)]">CORRECT (SPARK)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[var(--color-neon-red)] shadow-[0_0_6px_#ff003c]"></div>
          <span className="text-[var(--color-neon-red)]">ERROR (SHOCK)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[var(--color-neon-cyan)] shadow-[0_0_6px_#00f3ff]"></div>
          <span className="text-[var(--color-neon-cyan)]">CURRENT (PLASMA)</span>
        </div>
      </div>
    </div>
  );
};

export default TypingText;

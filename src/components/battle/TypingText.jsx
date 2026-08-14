import React from 'react';

const TypingText = ({ text = "The quick brown fox jumps over the lazy dog", words = null, typed = null, combo = 0 }) => {
  const activeCharRef = React.useRef(null);
  const containerRef = React.useRef(null);
  
  React.useEffect(() => {
    if (activeCharRef.current && containerRef.current) {
      const container = containerRef.current;
      const el = activeCharRef.current;
      // Keep active line centered inside the 3-line box
      container.scrollTop = el.offsetTop - 36;
    }
  }, [typed]);

  const fireTrailClass = 
    combo >= 50 ? 'animate-fire-4 text-orange-400 font-black' :
    combo >= 30 ? 'animate-fire-3 text-amber-300 font-extrabold' :
    combo >= 20 ? 'animate-fire-2 text-yellow-300 font-bold' :
    combo >= 10 ? 'animate-fire-1 text-[#39ff14]' :
    'text-[#39ff14] [text-shadow:0_0_6px_rgba(57,255,20,0.6)]';
  
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
  const displayTypedText = currentTypedText.length > 100 
    ? "..." + currentTypedText.slice(-100) 
    : currentTypedText;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="text-[var(--color-neon-purple)] font-[family-name:var(--font-arcade)] text-xs tracking-[0.2em] uppercase">
        TYPE THE FOLLOWING
      </div>
      
      {/* ── TARGET TEXT CONTAINER (STRICTLY CAPPED AT 3 LINES OF SENTENCES) ── */}
      <div 
        ref={containerRef}
        className="w-full bg-black/80 border-2 border-cyan-500/40 rounded-xl p-4 shadow-[0_0_20px_rgba(0,243,255,0.15)] h-[115px] max-h-[115px] min-h-[115px] overflow-hidden relative"
      >
        <div className="flex flex-wrap gap-x-0.5 gap-y-2 font-[family-name:var(--font-mono)] text-xl md:text-2xl leading-snug tracking-wider">
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
              currentIndex += item.word.length + 1;
            });

            return wordsWithIndices.map((item, wordIdx) => {
              const wordChars = item.word.split('');
              
              return (
                <div key={wordIdx} className="flex">
                  {wordChars.map((char, charIdx) => {
                    const absIndex = item.startIndex + charIdx;
                    const state = getCharState(absIndex);
                    let className = "";
                    
                    if (state === 'correct') {
                      className = `${fireTrailClass} animate-pop-fade`;
                    } else if (state === 'incorrect') {
                      className = "text-red-400 bg-red-950/60 border-b-2 border-red-500/80 rounded-sm px-[1px]";
                    } else if (state === 'current') {
                      className = "text-cyan-100 rounded-sm px-1 border-b-2 animate-simple-cursor font-bold";
                    } else {
                      if (item.type === 'tnt') className = "text-red-400 font-bold animate-pulse";
                      else if (item.type === 'sword') className = "text-yellow-300 font-bold";
                      else if (item.type === 'critical') className = "text-amber-300 font-bold animate-critical-word";
                      else if (item.type === 'cursed') className = "text-purple-400 font-bold animate-pulse [text-shadow:0_0_14px_rgba(168,85,247,0.9)]";
                      else className = "text-white/35";
                    }
                    
                    return (
                      <span 
                        key={absIndex} 
                        ref={state === 'current' ? activeCharRef : null}
                        className={`px-[1px] relative transition-colors duration-100 ${className}`}
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
                    
                    if (state === 'correct') {
                      className = `${fireTrailClass} animate-pop-fade`;
                    } else if (state === 'incorrect') {
                      className = "text-red-400 bg-red-950/60 border-b-2 border-red-500/80 rounded-sm px-[1px]";
                    } else if (state === 'current') {
                      className = "text-cyan-100 rounded-sm px-1 border-b-2 animate-simple-cursor font-bold";
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

      {/* ── LIVE INPUT DISPLAY BOX (STRICTLY CAPPED AT 3 LINES OF SENTENCES) ── */}
      <div className="w-full bg-black/80 border border-cyan-500/40 rounded-xl p-3 shadow-[0_0_15px_rgba(0,243,255,0.12)] h-[90px] max-h-[90px] overflow-hidden relative flex items-end">
        <div className="font-[family-name:var(--font-mono)] text-lg md:text-xl text-white tracking-wider flex flex-wrap items-center leading-snug w-full overflow-hidden">
          <span className="text-cyan-300 [text-shadow:0_0_8px_rgba(0,243,255,0.5)] font-bold">
            {displayTypedText}
          </span>
          <span className="w-2.5 h-5 bg-cyan-400/90 shadow-[0_0_8px_#00f3ff] animate-pulse ml-1 inline-block shrink-0"></span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-0.5 w-full px-4 font-[family-name:var(--font-arcade)] text-[10px] tracking-widest uppercase text-white/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#39ff14] shadow-[0_0_5px_rgba(57,255,20,0.6)]"></div>
          <span className="text-[#39ff14]">CORRECT</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.6)]"></div>
          <span className="text-red-400">ERROR</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-400 shadow-[0_0_5px_rgba(0,243,255,0.6)]"></div>
          <span className="text-cyan-300">CURRENT</span>
        </div>
      </div>
    </div>
  );
};

export default TypingText;

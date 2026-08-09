import React from 'react';

const TypingText = ({ text = "The quick brown fox jumps over the lazy dog", words = null, typed = null }) => {
  const textArray = text.split('');
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

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="text-[var(--color-neon-purple)] font-[family-name:var(--font-arcade)] text-xs tracking-[0.2em] uppercase">
        TYPE THE FOLLOWING
      </div>
      
      {/* Target Text Box */}
      <div 
        ref={containerRef}
        className="w-full bg-black/60 border border-[var(--color-neon-purple)] rounded-xl p-6 shadow-[0_0_15px_var(--color-neon-purple-muted)] h-[160px] overflow-hidden relative"
      >
        <div className="flex flex-wrap gap-x-0.5 gap-y-3 font-[family-name:var(--font-mono)] text-xl md:text-2xl leading-relaxed tracking-wider">
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
              currentIndex += item.word.length + 1; // +1 for the space
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
                      className = "text-[var(--color-neon-green)] animate-pop-fade";
                    } else if (state === 'incorrect') {
                      className = "text-[var(--color-neon-red)] bg-red-900/40";
                    } else if (state === 'current') {
                      className = "text-white bg-white/20";
                    } else {
                      if (item.type === 'tnt') className = "text-red-500 animate-pulse font-bold drop-shadow-[0_0_5px_red]";
                      else if (item.type === 'sword') className = "text-yellow-500 font-bold drop-shadow-[0_0_5px_yellow]";
                      else className = "text-gray-500";
                    }
                    
                    return (
                      <span 
                        key={absIndex} 
                        ref={state === 'current' ? activeCharRef : null}
                        className={`px-[1px] relative ${className}`}
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
                      className = "text-[var(--color-neon-green)] animate-pop-fade";
                    } else if (state === 'incorrect') {
                      className = "text-[var(--color-neon-red)] bg-red-900/40";
                    } else if (state === 'current') {
                      className = "text-white bg-white/20";
                    } else {
                      className = "text-transparent"; // Make default space transparent so it doesn't look weird
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

      {/* Input Box */}
      <div className="w-full bg-black/80 border border-gray-600 rounded-xl p-4">
        <div className="font-[family-name:var(--font-mono)] text-xl md:text-2xl text-white tracking-wider flex items-center min-h-[32px]">
          {currentTypedText}
          <span className="w-3 h-6 bg-white animate-pulse ml-1 inline-block"></span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-1 w-full px-4 font-[family-name:var(--font-arcade)] text-[10px] tracking-widest uppercase">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[var(--color-neon-green)]"></div>
          <span className="text-[var(--color-neon-green)]">CORRECT</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[var(--color-neon-red)]"></div>
          <span className="text-[var(--color-neon-red)]">INCORRECT</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-400"></div>
          <span className="text-blue-400">CURRENT</span>
        </div>
      </div>
    </div>
  );
};

export default TypingText;

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import ArcadeText from '../components/arcade/ArcadeText';
import ArcadeButton from '../components/arcade/ArcadeButton';
import useMatchStore from '../store/useMatchStore';

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const PixelPanel = ({ children, color = '#00f3ff', className = '' }) => (
  <div className={`relative border-4 p-1 ${className}`} style={{
    borderColor: color,
    boxShadow: `0 0 0 2px #000, 0 0 24px ${color}60, 0 0 60px ${color}18, inset 0 0 20px rgba(0,0,0,0.8)`,
    imageRendering: 'pixelated',
  }}>
    <div className="absolute -top-2 -left-2 w-4 h-4" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
    <div className="absolute -top-2 -right-2 w-4 h-4" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
    <div className="absolute -bottom-2 -left-2 w-4 h-4" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
    <div className="absolute -bottom-2 -right-2 w-4 h-4" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
    <div className="border-2 border-black/60 bg-black/85 p-6">
      {children}
    </div>
  </div>
);

const CreateMatchPage = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [dotCount, setDotCount] = useState(0);
  const { matchCode, initMatch, leaveMatch, status, category, setCategory, gameMode, setGameMode } = useMatchStore();

  useEffect(() => {
    const newCode = generateCode();
    initMatch(newCode, true);

    gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    gsap.fromTo('.cp-panel', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.5)', delay: 0.1 });

    const dotTimer = setInterval(() => setDotCount(d => (d + 1) % 4), 500);
    return () => { clearInterval(dotTimer); };
  }, [initMatch]);

  useEffect(() => {
    if (status === 'starting') navigate('/lobby');
  }, [status, navigate]);

  const handleCancel = () => { leaveMatch(); navigate('/'); };

  const modeColor = gameMode === 'classic_booth' ? '#fffb00' : '#00f3ff';

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, rgba(10,0,21,0.4) 0%, rgba(5,5,10,0.72) 100%)' }}>
      {/* Scanlines */}
      <div className="pointer-events-none absolute inset-0 z-50" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
      }} />
      {/* Grid */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(0,243,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.04) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)'
      }} />

      <div className="cp-panel z-10 w-full max-w-md px-4">
        <PixelPanel color={modeColor}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b-2 pb-3" style={{ borderColor: `${modeColor}40` }}>
            <span className="font-[family-name:var(--font-arcade)] text-xs tracking-widest" style={{ color: modeColor }}>
              {gameMode === 'classic_booth' ? '● BOOTH MODE' : '● ONLINE MATCH'}
            </span>
            <button onClick={handleCancel}
              className="font-[family-name:var(--font-arcade)] text-xs tracking-widest text-white/30 hover:text-red-400 transition-colors">
              ✕ CANCEL
            </button>
          </div>

          <ArcadeText as="h1" color={gameMode === 'classic_booth' ? 'yellow' : 'cyan'} glow className="text-4xl text-center mb-6 block">
            CREATE MATCH
          </ArcadeText>

          {/* Match Code display */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <span className="font-[family-name:var(--font-arcade)] text-xs tracking-[0.3em] text-white/40">SHARE THIS CODE</span>
            <div className="relative border-2 px-8 py-4 bg-black text-center" style={{
              borderColor: modeColor,
              boxShadow: `0 0 20px ${modeColor}40, inset 0 0 20px rgba(0,0,0,0.5)`
            }}>
              <div className="absolute -top-1 -left-1 w-3 h-3" style={{ background: modeColor }} />
              <div className="absolute -top-1 -right-1 w-3 h-3" style={{ background: modeColor }} />
              <div className="absolute -bottom-1 -left-1 w-3 h-3" style={{ background: modeColor }} />
              <div className="absolute -bottom-1 -right-1 w-3 h-3" style={{ background: modeColor }} />
              <span className="font-[family-name:var(--font-arcade)] text-5xl tracking-[0.5em] pl-[0.25em]"
                style={{ color: modeColor, textShadow: `0 0 10px ${modeColor}, 0 0 30px ${modeColor}60` }}>
                {matchCode || '------'}
              </span>
            </div>
          </div>

          {/* Game Mode & Category — hidden for booth */}
          {gameMode !== 'classic_booth' && (
            <>
              <div className="mb-4">
                <div className="font-[family-name:var(--font-arcade)] text-xs tracking-widest text-white/40 mb-2 text-center">GAME MODE</div>
                <div className="flex gap-2">
                  {['race', 'deathmatch'].map(m => (
                    <button key={m} onClick={() => setGameMode(m)}
                      className="flex-1 py-2 font-[family-name:var(--font-arcade)] text-sm tracking-widest transition-all border-2"
                      style={{
                        borderColor: gameMode === m ? '#00f3ff' : '#333',
                        color: gameMode === m ? '#00f3ff' : '#555',
                        background: gameMode === m ? 'rgba(0,243,255,0.08)' : 'transparent',
                        boxShadow: gameMode === m ? '0 0 10px rgba(0,243,255,0.3)' : 'none',
                      }}>
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="font-[family-name:var(--font-arcade)] text-xs tracking-widest text-white/40 mb-2 text-center">WORD CATEGORY</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {['all', 'common', 'it', 'gaming', 'tech', 'fun'].map(c => (
                    <button key={c} onClick={() => setCategory(c)}
                      className="px-3 py-1 font-[family-name:var(--font-arcade)] text-xs tracking-widest transition-all border"
                      style={{
                        borderColor: category === c ? '#00f3ff' : '#333',
                        color: category === c ? '#00f3ff' : '#555',
                        background: category === c ? 'rgba(0,243,255,0.08)' : 'transparent',
                      }}>
                      {c.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Waiting indicator */}
          <div className="border-t-2 pt-4 mt-2 flex flex-col items-center gap-4" style={{ borderColor: `${modeColor}30` }}>
            <div className="font-[family-name:var(--font-arcade)] text-lg tracking-widest"
              style={{ color: '#ff007f', textShadow: '0 0 8px rgba(255,0,127,0.6)' }}>
              WAITING FOR PLAYER{'.'?.repeat(dotCount) + ' '.repeat(3 - dotCount)}
            </div>
            {/* Pixel loading bar */}
            <div className="w-full h-2 bg-black border border-white/10 overflow-hidden">
              <div className="h-full animate-[scan_1.5s_linear_infinite]"
                style={{ background: `linear-gradient(90deg, transparent, ${modeColor}, transparent)`, width: '40%' }} />
            </div>
          </div>
        </PixelPanel>
      </div>

      <style>{`
        @keyframes scan { 0% { transform: translateX(-100%) } 100% { transform: translateX(350%) } }
      `}</style>
    </div>
  );
};

export default CreateMatchPage;

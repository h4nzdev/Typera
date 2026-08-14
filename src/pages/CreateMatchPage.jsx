import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import ArcadeText from '../components/arcade/ArcadeText';
import ArcadeButton from '../components/arcade/ArcadeButton';
import useMatchStore from '../store/useMatchStore';
import useUserStore from '../store/useUserStore';
import { playSound } from '../lib/sounds';

const generateCode = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const PixelPanel = ({ children, color = '#00f3ff', className = '' }) => (
  <div className={`relative border-4 p-1 ${className}`} style={{
    borderColor: color,
    boxShadow: `0 0 0 2px #000, 0 0 24px ${color}60, 0 0 60px ${color}18, inset 0 0 20px rgba(0,0,0,0.8)`,
    imageRendering: 'pixelated',
  }}>
    <div className="absolute -top-2 -left-2 w-4 h-4" style={{ background: color }} />
    <div className="absolute -top-2 -right-2 w-4 h-4" style={{ background: color }} />
    <div className="absolute -bottom-2 -left-2 w-4 h-4" style={{ background: color }} />
    <div className="absolute -bottom-2 -right-2 w-4 h-4" style={{ background: color }} />
    <div className="border-2 border-black/60 bg-black/85 p-6">
      {children}
    </div>
  </div>
);

const CreateMatchPage = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  const [step, setStep] = useState(1); // 1 = Setup & Code, 2 = Host Name
  const [dotCount, setDotCount] = useState(0);
  const [createdCode] = useState(() => generateCode());
  const { setPlayerName, playerName } = useUserStore();
  const [hostName, setHostName] = useState(() => playerName || '');
  const [isMatchCreated, setIsMatchCreated] = useState(false);
  const [nameError, setNameError] = useState('');

  const { matchCode, initMatch, leaveMatch, status, category, setCategory, gameMode, setGameMode } = useMatchStore();

  useEffect(() => {
    gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    gsap.fromTo('.cp-panel', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.5)', delay: 0.1 });

    const dotTimer = setInterval(() => setDotCount(d => (d + 1) % 4), 500);
    return () => { clearInterval(dotTimer); };
  }, []);

  useEffect(() => {
    if (status === 'starting') navigate('/lobby');
  }, [status, navigate]);

  const handleNextToName = (e) => {
    e?.preventDefault();
    playSound('click');
    setStep(2);
  };

  const handleStartCreate = (e) => {
    e?.preventDefault();
    if (!hostName.trim()) {
      setNameError('ENTER YOUR NAME');
      return;
    }
    setNameError('');
    playSound('click');
    const cleanName = hostName.trim().toUpperCase();
    setPlayerName(cleanName);
    initMatch(createdCode, true);
    setIsMatchCreated(true);
  };

  const handleCancel = () => { leaveMatch(); navigate('/'); };

  const modeColor = gameMode === 'classic_booth' ? '#fffb00' : '#00f3ff';

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden select-none"
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
              ● STEP {step} OF 2: {step === 1 ? 'SETUP & CODE' : 'HOST NAME'}
            </span>
            <button onClick={handleCancel}
              className="font-[family-name:var(--font-arcade)] text-xs tracking-widest text-white/30 hover:text-red-400 transition-colors">
              ✕ CANCEL
            </button>
          </div>

          <ArcadeText as="h1" color={gameMode === 'classic_booth' ? 'yellow' : 'cyan'} glow className="text-4xl text-center mb-6 block">
            CREATE MATCH
          </ArcadeText>

          {/* STEP 1: MATCH SETUP & CODE GENERATION */}
          {!isMatchCreated && step === 1 && (
            <div className="flex flex-col items-center gap-6">
              {/* Match Code display */}
              <div className="flex flex-col items-center gap-3 w-full">
                <span className="font-[family-name:var(--font-arcade)] text-xs tracking-[0.3em] text-white/40">YOUR MATCH CODE</span>
                <div className="relative border-2 px-8 py-3 bg-black text-center w-full" style={{
                  borderColor: modeColor,
                  boxShadow: `0 0 20px ${modeColor}40, inset 0 0 20px rgba(0,0,0,0.5)`
                }}>
                  <div className="absolute -top-1 -left-1 w-3 h-3" style={{ background: modeColor }} />
                  <div className="absolute -top-1 -right-1 w-3 h-3" style={{ background: modeColor }} />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3" style={{ background: modeColor }} />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3" style={{ background: modeColor }} />
                  <span className="font-[family-name:var(--font-arcade)] text-4xl tracking-[0.5em] pl-[0.25em]"
                    style={{ color: modeColor, textShadow: `0 0 10px ${modeColor}, 0 0 30px ${modeColor}60` }}>
                    {createdCode}
                  </span>
                </div>
              </div>

              {/* Game Mode & Category — hidden for booth */}
              {gameMode !== 'classic_booth' && (
                <div className="w-full flex flex-col gap-4 border-t-2 pt-4" style={{ borderColor: `${modeColor}30` }}>
                  <div>
                    <div className="font-[family-name:var(--font-arcade)] text-xs tracking-widest text-white/40 mb-2 text-center">GAME MODE</div>
                    <div className="flex gap-2">
                      {['race', 'deathmatch'].map(m => (
                        <button key={m} type="button" onClick={() => setGameMode(m)}
                          className="flex-1 py-2 font-[family-name:var(--font-arcade)] text-xs tracking-widest transition-all border-2"
                          style={{
                            borderColor: gameMode === m ? '#00f3ff' : '#333',
                            color: gameMode === m ? '#00f3ff' : '#555',
                            background: gameMode === m ? 'rgba(0,243,255,0.08)' : 'transparent',
                          }}>
                          {m.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="font-[family-name:var(--font-arcade)] text-xs tracking-widest text-white/40 mb-2 text-center">WORD CATEGORY</div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['all', 'common', 'it', 'gaming', 'tech', 'fun'].map(c => (
                        <button key={c} type="button" onClick={() => setCategory(c)}
                          className="px-2 py-1 font-[family-name:var(--font-arcade)] text-[10px] tracking-widest transition-all border"
                          style={{
                            borderColor: category === c ? '#00f3ff' : '#333',
                            color: category === c ? '#00f3ff' : '#555',
                          }}>
                          {c.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 w-full border-t-2 pt-4" style={{ borderColor: `${modeColor}30` }}>
                <ArcadeButton color={gameMode === 'classic_booth' ? 'yellow' : 'cyan'} className="w-full py-3" onClick={handleNextToName}>
                  NEXT: ENTER HOST NAME ➔
                </ArcadeButton>
              </div>
            </div>
          )}

          {/* STEP 2: HOST NAME ENTRY */}
          {!isMatchCreated && step === 2 && (
            <form onSubmit={handleStartCreate} className="flex flex-col items-center gap-6">
              {/* Confirmed Match Code Header Badge */}
              <div className="flex items-center justify-between w-full bg-black/60 border border-yellow-400/40 px-4 py-2 rounded-xl">
                <span className="font-[family-name:var(--font-arcade)] text-xs text-white/60">MATCH CODE:</span>
                <span className="font-[family-name:var(--font-arcade)] text-base font-bold tracking-widest" style={{ color: modeColor }}>{createdCode}</span>
                <button type="button" onClick={() => { playSound('click'); setStep(1); }} className="text-[10px] font-[family-name:var(--font-arcade)] text-cyan-400 hover:underline">
                  [ ⚙ EDIT SETUP ]
                </button>
              </div>

              <div className="w-full flex flex-col items-center gap-3">
                <span className="font-[family-name:var(--font-arcade)] text-xs tracking-widest text-yellow-300">ENTER HOST NAME</span>
                <input
                  type="text"
                  maxLength={5}
                  value={hostName}
                  onChange={(e) => { setHostName(e.target.value.toUpperCase()); setNameError(''); }}
                  placeholder="HOST"
                  autoFocus
                  className="w-full bg-black border-2 border-cyan-400 px-4 py-3 text-center font-[family-name:var(--font-arcade)] text-3xl tracking-widest text-cyan-300 outline-none uppercase"
                  style={{ boxShadow: '0 0 20px rgba(0,243,255,0.3)' }}
                />
                {nameError && (
                  <span className="font-[family-name:var(--font-arcade)] text-xs text-red-400 tracking-widest animate-pulse mt-1">{nameError}</span>
                )}
              </div>

              <div className="flex flex-col gap-3 w-full border-t-2 pt-4" style={{ borderColor: `${modeColor}30` }}>
                <ArcadeButton type="submit" color={gameMode === 'classic_booth' ? 'yellow' : 'cyan'} className="w-full py-3">
                  OPEN MATCH LOBBY ➔
                </ArcadeButton>
                <ArcadeButton type="button" color="white" onClick={() => { playSound('click'); setStep(1); }} className="w-full text-xs py-2">
                  ← BACK TO SETUP
                </ArcadeButton>
              </div>
            </form>
          )}

          {/* Waiting indicator once created */}
          {isMatchCreated && (
            <div className="border-t-2 pt-4 mt-2 flex flex-col items-center gap-4" style={{ borderColor: `${modeColor}30` }}>
              <div className="font-[family-name:var(--font-arcade)] text-lg tracking-widest text-center"
                style={{ color: '#ff007f', textShadow: '0 0 8px rgba(255,0,127,0.6)' }}>
                WAITING FOR PLAYER{'.'?.repeat(dotCount) + ' '.repeat(3 - dotCount)}
              </div>
              <div className="w-full h-2 bg-black border border-white/10 overflow-hidden">
                <div className="h-full animate-[scan_1.5s_linear_infinite]"
                  style={{ background: `linear-gradient(90deg, transparent, ${modeColor}, transparent)`, width: '40%' }} />
              </div>
            </div>
          )}
        </PixelPanel>
      </div>

      <style>{`
        @keyframes scan { 0% { transform: translateX(-100%) } 100% { transform: translateX(350%) } }
      `}</style>
    </div>
  );
};

export default CreateMatchPage;

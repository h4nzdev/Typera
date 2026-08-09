import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import logoPng from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import ArcadeText from '../components/arcade/ArcadeText';
import ArcadeButton from '../components/arcade/ArcadeButton';
import useUserStore from '../store/useUserStore';
import useMatchStore from '../store/useMatchStore';
import { Settings } from 'lucide-react';
import { playSound, playBgm } from '../lib/sounds';

// Pixel corner piece SVG for arcade border
const PixelCorner = ({ className = '' }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" className={className} style={{ imageRendering: 'pixelated' }}>
    <rect x="0" y="0" width="8" height="8" fill="currentColor" />
    <rect x="8" y="0" width="8" height="8" fill="currentColor" />
    <rect x="16" y="0" width="8" height="8" fill="currentColor" />
    <rect x="0" y="8" width="8" height="8" fill="currentColor" />
    <rect x="0" y="16" width="8" height="8" fill="currentColor" />
  </svg>
);

const MENU_ITEMS = [
  { id: 'booth',    label: 'CLASSIC 1V1',   sub: 'BOOTH MODE',       color: '#fffb00',  glow: 'rgba(255,251,0,0.6)',   key: 'yellow' },
  { id: 'create',   label: 'CREATE MATCH',  sub: 'ONLINE BATTLE',    color: '#00f3ff',  glow: 'rgba(0,243,255,0.6)',   key: 'cyan'   },
  { id: 'join',     label: 'JOIN MATCH',    sub: 'ENTER CODE',       color: '#ff007f',  glow: 'rgba(255,0,127,0.6)',   key: 'pink'   },
  { id: 'practice', label: 'SOLO PRACTICE', sub: 'TRAIN YOUR SPEED', color: '#39ff14',  glow: 'rgba(57,255,20,0.6)',   key: 'green'  },
  { id: 'board',    label: 'LEADERBOARD',   sub: 'HALL OF FAME',     color: '#b026ff',  glow: 'rgba(176,38,255,0.6)',  key: 'purple' },
];

const MainMenu = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const selRef = useRef(null);

  const { playerName, setPlayerName } = useUserStore();
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [boothModeFlow, setBoothModeFlow] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    if (!playerName) setShowNameModal(true);
  }, [playerName]);

  // Blinking cursor
  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 530);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    playBgm('menu');
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (showNameModal || boothModeFlow) return;
    const handler = (e) => {
      if (e.key === 'ArrowUp') {
        playSound('hover');
        setSelectedIdx(i => (i - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
      } else if (e.key === 'ArrowDown') {
        playSound('hover');
        setSelectedIdx(i => (i + 1) % MENU_ITEMS.length);
      } else if (e.key === 'Enter') {
        handleMenuAction(MENU_ITEMS[selectedIdx].id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showNameModal, boothModeFlow, selectedIdx]);

  useLayoutEffect(() => {
    if (showNameModal || boothModeFlow) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.mm-logo', { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
      gsap.fromTo('.mm-panel', { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)', delay: 0.3 });
      gsap.fromTo('.mm-item', { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out', delay: 0.4 });
      gsap.fromTo('.mm-coin', { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 1, ease: 'bounce.out' });
    }, containerRef);
    return () => ctx.revert();
  }, [showNameModal, boothModeFlow]);

  const handleSaveName = () => {
    if (tempName.trim().length > 0) {
      setPlayerName(tempName.toUpperCase());
      setShowNameModal(false);
    }
  };

  const handleBoothNameSubmit = () => {
    if (tempName.trim().length > 0) {
      setPlayerName(tempName.toUpperCase());
      setBoothModeFlow('action');
    }
  };

  const handleBoothAction = (action) => {
    useMatchStore.getState().setGameMode('classic_booth');
    setBoothModeFlow(null);
    navigate(action === 'create' ? '/create' : '/join');
  };

  const handleMenuAction = (id) => {
    playSound('click');
    if (id === 'booth') { setTempName(''); setBoothModeFlow('name'); }
    else if (id === 'create') {
      useMatchStore.getState().setGameMode('race');
      if (!playerName) setShowNameModal(true);
      else navigate('/create');
    }
    else if (id === 'join') navigate('/join');
    else if (id === 'practice') navigate('/practice');
    else if (id === 'board') navigate('/leaderboard');
  };

  const active = MENU_ITEMS[selectedIdx];

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative select-none" style={{ background: 'radial-gradient(ellipse at center, rgba(10,0,21,0.4) 0%, rgba(5,5,10,0.72) 100%)' }}>

      {/* Scanlines overlay */}
      <div className="pointer-events-none absolute inset-0 z-50" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)',
      }} />

      {/* Animated grid floor */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(0,243,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.04) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)'
      }} />

      {/* Player ID badge — top left */}
      {!showNameModal && !boothModeFlow && (
        <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
          <div className="border border-[var(--color-neon-cyan)] px-3 py-1 text-xs font-[family-name:var(--font-arcade)] tracking-widest"
            style={{ boxShadow: '0 0 8px rgba(0,243,255,0.3), inset 0 0 8px rgba(0,243,255,0.05)' }}>
            <span className="text-white/40">PLAYER </span>
            <span className="text-[var(--color-neon-cyan)]">{playerName || '???'}</span>
          </div>
          <button onClick={() => { setTempName(playerName); setShowNameModal(true); }}
            className="text-white/20 hover:text-[var(--color-neon-cyan)] transition-colors" title="Change Name">
            <Settings size={14} />
          </button>
        </div>
      )}

      {/* INSERT COIN marquee — top right */}
      {!showNameModal && !boothModeFlow && (
        <div className="mm-coin absolute top-6 right-6 z-20 font-[family-name:var(--font-arcade)] text-xs tracking-widest"
          style={{ color: blink ? '#fffb00' : 'transparent', textShadow: blink ? '0 0 12px rgba(255,251,0,0.8)' : 'none', transition: 'color 0.05s, text-shadow 0.05s' }}>
          ► INSERT COIN ◄
        </div>
      )}

      {/* ── Name Entry Modal (Normal) ── */}
      {showNameModal && !boothModeFlow && (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center backdrop-blur-md p-4">
          <div className="relative border-2 border-[var(--color-neon-cyan)] p-10 flex flex-col items-center gap-6 max-w-sm w-full"
            style={{ boxShadow: '0 0 30px rgba(0,243,255,0.3), inset 0 0 30px rgba(0,243,255,0.05)' }}>
            {/* Pixel corners */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-[var(--color-neon-cyan)]" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-[var(--color-neon-cyan)]" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-[var(--color-neon-cyan)]" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-[var(--color-neon-cyan)]" />
            <ArcadeText color="cyan" glow className="text-3xl text-center">ENTER YOUR NAME</ArcadeText>
            <ArcadeText color="pink" className="text-xs tracking-widest text-center">UP TO 5 CHARACTERS</ArcadeText>
            <input type="text" maxLength={5} value={tempName}
              onChange={(e) => setTempName(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
              className="bg-black border-b-2 border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] px-4 py-2 text-4xl font-[family-name:var(--font-arcade)] uppercase text-center outline-none w-48"
              placeholder="AAAAA" autoFocus />
            <ArcadeButton color="cyan" className="w-full" onClick={handleSaveName} disabled={!tempName.trim()}>CONFIRM</ArcadeButton>
            {playerName && <ArcadeButton color="white" className="text-xs py-1 w-full" onClick={() => setShowNameModal(false)}>CANCEL</ArcadeButton>}
          </div>
        </div>
      )}

      {/* ── Booth Name Modal ── */}
      {boothModeFlow === 'name' && (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center backdrop-blur-md p-4">
          <div className="relative border-2 border-[var(--color-neon-yellow)] p-10 flex flex-col items-center gap-6 max-w-sm w-full"
            style={{ boxShadow: '0 0 30px rgba(255,251,0,0.3), inset 0 0 30px rgba(255,251,0,0.05)' }}>
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-[var(--color-neon-yellow)]" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-[var(--color-neon-yellow)]" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-[var(--color-neon-yellow)]" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-[var(--color-neon-yellow)]" />
            <ArcadeText color="yellow" glow className="text-3xl text-center">BOOTH MODE</ArcadeText>
            <ArcadeText color="white" className="text-xs tracking-widest text-center">ENTER YOUR NAME FOR THIS MATCH</ArcadeText>
            <input type="text" maxLength={5} value={tempName}
              onChange={(e) => setTempName(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') handleBoothNameSubmit(); }}
              className="bg-black border-b-2 border-[var(--color-neon-yellow)] text-[var(--color-neon-yellow)] px-4 py-2 text-4xl font-[family-name:var(--font-arcade)] uppercase text-center outline-none w-48"
              placeholder="AAAAA" autoFocus />
            <ArcadeButton color="yellow" className="w-full" onClick={handleBoothNameSubmit} disabled={!tempName.trim()}>NEXT</ArcadeButton>
            <ArcadeButton color="white" className="text-xs py-1 w-full" onClick={() => setBoothModeFlow(null)}>CANCEL</ArcadeButton>
          </div>
        </div>
      )}

      {/* ── Booth Action Modal ── */}
      {boothModeFlow === 'action' && (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center backdrop-blur-md p-4">
          <div className="relative border-2 border-[var(--color-neon-yellow)] p-10 flex flex-col items-center gap-6 max-w-sm w-full"
            style={{ boxShadow: '0 0 30px rgba(255,251,0,0.3), inset 0 0 30px rgba(255,251,0,0.05)' }}>
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-[var(--color-neon-yellow)]" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-[var(--color-neon-yellow)]" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-[var(--color-neon-yellow)]" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-[var(--color-neon-yellow)]" />
            <ArcadeText color="yellow" glow className="text-3xl text-center">BOOTH MATCH</ArcadeText>
            <ArcadeText color="white" className="text-xs tracking-widest opacity-60">FIRST TO 3 WINS</ArcadeText>
            <div className="flex flex-col gap-4 w-full">
              <ArcadeButton color="cyan" className="w-full" onClick={() => handleBoothAction('create')}>CREATE MATCH</ArcadeButton>
              <ArcadeButton color="pink" className="w-full" onClick={() => handleBoothAction('join')}>JOIN MATCH</ArcadeButton>
              <ArcadeButton color="white" className="text-xs py-1 w-full" onClick={() => setBoothModeFlow(null)}>CANCEL</ArcadeButton>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN MENU ── */}
      {!showNameModal && !boothModeFlow && (
        <div className="z-10 flex flex-col items-center gap-8 w-full max-w-lg px-4">

          {/* Logo */}
          <div className="mm-logo flex justify-center">
            <img
              src={logoPng}
              alt="TYPE//BATTLE"
              className="w-auto select-none pointer-events-none"
              style={{
                maxHeight: '220px',
                filter: 'drop-shadow(0 0 18px rgba(0,243,255,0.5)) drop-shadow(0 0 40px rgba(255,0,127,0.35))',
                animation: 'logoFloat 3s ease-in-out infinite',
              }}
              draggable={false}
            />
          </div>

          {/* Pixel-border arcade menu panel */}
          <div className="mm-panel w-full relative">
            {/* Outer pixel border */}
            <div className="relative border-4 p-1" style={{
              borderColor: active.color,
              boxShadow: `0 0 0 2px #000, 0 0 20px ${active.glow}, 0 0 60px ${active.glow.replace('0.6', '0.15')}, inset 0 0 20px rgba(0,0,0,0.8)`,
              transition: 'border-color 0.2s, box-shadow 0.2s',
              imageRendering: 'pixelated',
            }}>
              {/* Pixel corner accents */}
              <div className="absolute -top-2 -left-2 w-5 h-5" style={{ background: active.color, boxShadow: `0 0 8px ${active.color}` }} />
              <div className="absolute -top-2 -right-2 w-5 h-5" style={{ background: active.color, boxShadow: `0 0 8px ${active.color}` }} />
              <div className="absolute -bottom-2 -left-2 w-5 h-5" style={{ background: active.color, boxShadow: `0 0 8px ${active.color}` }} />
              <div className="absolute -bottom-2 -right-2 w-5 h-5" style={{ background: active.color, boxShadow: `0 0 8px ${active.color}` }} />

              {/* Inner border */}
              <div className="border-2 border-black/60 bg-black/80 p-2">

                {/* Header bar */}
                <div className="flex items-center justify-between px-3 py-1 mb-2 border-b-2" style={{ borderColor: active.color, background: `${active.color}15` }}>
                  <span className="font-[family-name:var(--font-arcade)] text-xs tracking-widest" style={{ color: active.color }}>SELECT MODE</span>
                  <span className="font-[family-name:var(--font-arcade)] text-xs tracking-widest" style={{ color: active.color }}>↑↓ NAVIGATE · ENTER SELECT</span>
                </div>

                {/* Menu items */}
                <div className="flex flex-col gap-0">
                  {MENU_ITEMS.map((item, i) => {
                    const isSel = i === selectedIdx;
                    return (
                      <button
                        key={item.id}
                        className="mm-item w-full text-left px-4 py-3 font-[family-name:var(--font-arcade)] tracking-widest transition-all duration-100 relative group flex items-center gap-4"
                        style={{
                          background: isSel ? `${item.color}18` : 'transparent',
                          borderLeft: isSel ? `4px solid ${item.color}` : '4px solid transparent',
                          outline: 'none',
                        }}
                        onClick={() => handleMenuAction(item.id)}
                        onMouseEnter={() => { setSelectedIdx(i); playSound('hover'); }}
                      >
                        {/* Selection cursor */}
                        <span className="text-base shrink-0 transition-all duration-100"
                          style={{ color: item.color, opacity: isSel ? (blink ? 1 : 0.3) : 0, textShadow: `0 0 8px ${item.color}`, transition: 'opacity 0.05s' }}>
                          ►
                        </span>
                        <div className="flex-1">
                          <div className="text-lg leading-none" style={{ color: isSel ? item.color : '#888', textShadow: isSel ? `0 0 8px ${item.color}` : 'none', transition: 'color 0.15s' }}>
                            {item.label}
                          </div>
                          {isSel && (
                            <div className="text-xs mt-0.5 opacity-60" style={{ color: item.color, letterSpacing: '0.15em' }}>
                              {item.sub}
                            </div>
                          )}
                        </div>
                        {isSel && (
                          <span className="text-xs shrink-0" style={{ color: item.color, opacity: 0.6 }}>ENTER</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Footer bar */}
                <div className="mt-2 pt-2 border-t-2 flex justify-between px-3" style={{ borderColor: `${active.color}40` }}>
                  <span className="font-[family-name:var(--font-arcade)] text-xs opacity-30 tracking-widest" style={{ color: active.color }}>© TYPE//BATTLE</span>
                  <span className="font-[family-name:var(--font-arcade)] text-xs opacity-30 tracking-widest" style={{ color: active.color }}>v1.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Press START text */}
          <div className="font-[family-name:var(--font-arcade)] text-sm tracking-[0.3em]"
            style={{ color: blink ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)', transition: 'color 0.1s' }}>
            PRESS ENTER OR CLICK TO SELECT
          </div>
        </div>
      )}
    <style>{`
      @keyframes logoFloat {
        0%, 100% { transform: translateY(0px); filter: drop-shadow(0 0 18px rgba(0,243,255,0.5)) drop-shadow(0 0 40px rgba(255,0,127,0.35)); }
        50% { transform: translateY(-10px); filter: drop-shadow(0 0 28px rgba(0,243,255,0.8)) drop-shadow(0 0 55px rgba(255,0,127,0.55)); }
      }
    `}</style>
    </div>
  );
};

export default MainMenu;

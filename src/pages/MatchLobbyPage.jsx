import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import ArcadeText from '../components/arcade/ArcadeText';
import ArcadeButton from '../components/arcade/ArcadeButton';
import useMatchStore from '../store/useMatchStore';

const PlayerCard = ({ playerName, label, color, isReady, isWaiting }) => {
  const c = color === 'cyan' ? { hex: '#00f3ff', muted: 'rgba(0,243,255,0.1)' } : { hex: '#ff007f', muted: 'rgba(255,0,127,0.1)' };

  return (
    <div className="relative border-4 p-1 flex-1" style={{
      borderColor: isWaiting ? '#333' : c.hex,
      boxShadow: isWaiting ? 'none' : `0 0 0 2px #000, 0 0 20px ${c.hex}50`,
      transition: 'all 0.3s',
    }}>
      {!isWaiting && <>
        <div className="absolute -top-2 -left-2 w-4 h-4" style={{ background: c.hex }} />
        <div className="absolute -top-2 -right-2 w-4 h-4" style={{ background: c.hex }} />
        <div className="absolute -bottom-2 -left-2 w-4 h-4" style={{ background: c.hex }} />
        <div className="absolute -bottom-2 -right-2 w-4 h-4" style={{ background: c.hex }} />
      </>}
      <div className="border-2 border-black/60 bg-black/80 p-6 flex flex-col items-center gap-4 text-center" style={{ minHeight: 200 }}>
        {/* Header */}
        <div className="w-full border-b-2 pb-2 mb-1" style={{ borderColor: isWaiting ? '#333' : `${c.hex}40` }}>
          <span className="font-[family-name:var(--font-arcade)] text-xs tracking-widest" style={{ color: isWaiting ? '#444' : c.hex }}>
            {label}
          </span>
        </div>

        {/* Avatar pixel art */}
        <div className="w-20 h-20 border-4 flex items-center justify-center relative"
          style={{
            borderColor: isWaiting ? '#333' : c.hex,
            background: isWaiting ? '#111' : c.muted,
            boxShadow: isWaiting ? 'none' : `inset 0 0 20px ${c.muted}`,
          }}>
          {isWaiting ? (
            <span className="font-[family-name:var(--font-arcade)] text-4xl text-white/20">?</span>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-6 rounded-t-full relative" style={{ background: c.hex }}>
                <div className="absolute top-2 left-2 w-2 h-2 bg-black rounded-full" />
                <div className="absolute top-2 right-2 w-2 h-2 bg-black rounded-full" />
              </div>
              <div className="w-8 h-4 rounded-b-xl" style={{ background: c.hex }} />
            </div>
          )}
        </div>

        {/* Name */}
        <div>
          <div className="font-[family-name:var(--font-arcade)] text-xl tracking-widest"
            style={{ color: isWaiting ? '#444' : 'white', textShadow: isWaiting ? 'none' : `0 0 8px ${c.hex}40` }}>
            {isWaiting ? '- - - - -' : (playerName || '?????')}
          </div>
        </div>

        {/* Status */}
        {isWaiting ? (
          <span className="font-[family-name:var(--font-arcade)] text-xs tracking-widest text-white/20 animate-pulse">
            WAITING...
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#39ff14', boxShadow: '0 0 6px #39ff14' }} />
            <span className="font-[family-name:var(--font-arcade)] text-sm tracking-widest" style={{ color: '#39ff14', textShadow: '0 0 8px #39ff14' }}>
              READY
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const MatchLobbyPage = () => {
  const navigate = useNavigate();
  const vsRef = useRef(null);
  const containerRef = useRef(null);
  const [blink, setBlink] = useState(true);
  const { players, status } = useMatchStore();

  const p1 = players.find(p => p.isHost) || null;
  const p2 = players.find(p => !p.isHost) || null;

  useEffect(() => {
    gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 });
    gsap.fromTo('.lobby-card', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.15, ease: 'back.out(1.5)', delay: 0.2 });

    gsap.to(vsRef.current, { scale: 1.12, duration: 0.8, yoyo: true, repeat: -1, ease: 'power1.inOut' });

    const blinkTimer = setInterval(() => setBlink(b => !b), 600);
    return () => clearInterval(blinkTimer);
  }, []);

  useEffect(() => {
    if (status === 'starting') {
      const timer = setTimeout(() => navigate('/battle'), 1200);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  const isStarting = status === 'starting';

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #0a0015 0%, #05050A 70%)' }}>
      {/* Scanlines */}
      <div className="pointer-events-none absolute inset-0 z-50" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
      }} />
      {/* Grid */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(0,243,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
      }} />

      {/* Cancelled overlay */}
      {status === 'cancelled' && (
        <div className="absolute inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center backdrop-blur-md">
          <div className="relative border-4 border-red-500 p-1" style={{ boxShadow: '0 0 40px rgba(255,0,60,0.5)' }}>
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500" />
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-red-500" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-red-500" />
            <div className="border-2 border-black/60 bg-black/90 p-10 flex flex-col items-center gap-6">
              <ArcadeText color="red" glow className="text-5xl text-center">MATCH CANCELLED</ArcadeText>
              <ArcadeText color="pink" className="text-lg text-center">HOST DISCONNECTED</ArcadeText>
              <ArcadeButton color="cyan" onClick={() => { useMatchStore.getState().leaveMatch(); navigate('/'); }}>
                MAIN MENU
              </ArcadeButton>
            </div>
          </div>
        </div>
      )}

      <div className="z-10 w-full max-w-4xl px-4 flex flex-col items-center gap-8">
        {/* Title */}
        <div className="text-center">
          <div className="font-[family-name:var(--font-arcade)] text-sm tracking-[0.4em] mb-2"
            style={{ color: isStarting ? '#39ff14' : '#fffb00', textShadow: isStarting ? '0 0 10px #39ff14' : '0 0 10px rgba(255,251,0,0.6)' }}>
            {isStarting ? '● MATCH STARTING...' : (blink ? '● WAITING FOR PLAYERS' : '○ WAITING FOR PLAYERS')}
          </div>
          <h1 className="font-[family-name:var(--font-arcade)] text-4xl md:text-5xl"
            style={{ color: '#00f3ff', textShadow: '0 0 10px #00f3ff, 0 0 30px rgba(0,243,255,0.4)' }}>
            MATCH LOBBY
          </h1>
        </div>

        {/* Player cards + VS */}
        <div className="flex flex-row items-center gap-6 w-full">
          <div className="lobby-card flex-1">
            <PlayerCard playerName={p1?.playerName} label="PLAYER 1 · HOST" color="cyan" isReady={!!p1} isWaiting={!p1} />
          </div>

          <div ref={vsRef} className="shrink-0 flex flex-col items-center gap-2">
            <span className="font-[family-name:var(--font-arcade)] text-5xl md:text-7xl italic"
              style={{ color: '#b026ff', textShadow: '0 0 15px #b026ff, 0 0 40px rgba(176,38,255,0.4)' }}>
              VS
            </span>
          </div>

          <div className="lobby-card flex-1">
            <PlayerCard playerName={p2?.playerName} label="PLAYER 2 · CHALLENGER" color="pink" isReady={!!p2} isWaiting={!p2} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center gap-3">
          {isStarting ? (
            <div className="w-64 h-2 bg-black border border-[var(--color-neon-green)] overflow-hidden">
              <div className="h-full bg-[var(--color-neon-green)] animate-[scan_1s_linear_infinite]"
                style={{ width: '40%' }} />
            </div>
          ) : (
            <ArcadeButton color="white" className="text-sm px-6 py-2"
              onClick={() => { useMatchStore.getState().leaveMatch(); navigate('/'); }}>
              LEAVE LOBBY
            </ArcadeButton>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scan { 0% { transform: translateX(-100%) } 100% { transform: translateX(350%) } }
      `}</style>
    </div>
  );
};

export default MatchLobbyPage;

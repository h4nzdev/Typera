import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import ArcadeText from '../components/arcade/ArcadeText';
import ArcadeButton from '../components/arcade/ArcadeButton';
import useMatchStore from '../store/useMatchStore';

const PixelPanel = ({ children, color = '#ff007f', className = '' }) => (
  <div className={`relative border-4 p-1 ${className}`} style={{
    borderColor: color,
    boxShadow: `0 0 0 2px #000, 0 0 24px ${color}60, 0 0 60px ${color}18, inset 0 0 20px rgba(0,0,0,0.8)`,
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

const JoinMatchPage = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const { initMatch, status } = useMatchStore();

  useEffect(() => {
    gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    gsap.fromTo('.jp-panel', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.5)', delay: 0.1 });
  }, []);

  useEffect(() => {
    if (status === 'starting') navigate('/lobby');
  }, [status, navigate]);

  const handleJoin = (e) => {
    e?.preventDefault();
    if (code.length < 6) { setError('ENTER A 6-CHARACTER CODE'); return; }
    setError('');
    initMatch(code, false);
    navigate('/lobby');
  };

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, rgba(10,0,21,0.4) 0%, rgba(5,5,10,0.72) 100%)' }}>
      {/* Scanlines */}
      <div className="pointer-events-none absolute inset-0 z-50" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
      }} />
      {/* Grid */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(255,0,127,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,127,0.03) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)'
      }} />

      <div className="jp-panel z-10 w-full max-w-md px-4">
        <PixelPanel color="#ff007f">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b-2 pb-3" style={{ borderColor: 'rgba(255,0,127,0.3)' }}>
            <span className="font-[family-name:var(--font-arcade)] text-xs tracking-widest" style={{ color: '#ff007f' }}>
              ● ENTER CODE
            </span>
            <button onClick={() => navigate('/')}
              className="font-[family-name:var(--font-arcade)] text-xs tracking-widest text-white/30 hover:text-red-400 transition-colors">
              ✕ BACK
            </button>
          </div>

          <ArcadeText as="h1" color="pink" glow className="text-4xl text-center mb-8 block">JOIN MATCH</ArcadeText>

          <form onSubmit={handleJoin} className="flex flex-col items-center gap-6">
            <div className="w-full flex flex-col items-center gap-3">
              <span className="font-[family-name:var(--font-arcade)] text-xs tracking-[0.3em] text-white/40">MATCH CODE</span>

              {/* Code input with pixel corners */}
              <div className="relative">
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-[var(--color-neon-pink)]" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--color-neon-pink)]" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[var(--color-neon-pink)]" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[var(--color-neon-pink)]" />
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  autoFocus
                  className="bg-black border-2 border-[var(--color-neon-pink)] px-6 py-4 text-center font-[family-name:var(--font-arcade)] text-4xl tracking-[0.4em] pl-[calc(0.4em+24px)] text-[var(--color-neon-pink)] outline-none uppercase w-[280px]"
                  style={{ textShadow: '0 0 10px rgba(255,0,127,0.7)', boxShadow: '0 0 20px rgba(255,0,127,0.2), inset 0 0 15px rgba(255,0,127,0.05)' }}
                  placeholder="------"
                />
              </div>

              {/* 6-dot character indicators */}
              <div className="flex gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full border border-[var(--color-neon-pink)]"
                    style={{ background: i < code.length ? '#ff007f' : 'transparent', boxShadow: i < code.length ? '0 0 6px #ff007f' : 'none' }} />
                ))}
              </div>

              {error && (
                <span className="font-[family-name:var(--font-arcade)] text-xs text-red-400 tracking-widest animate-pulse">{error}</span>
              )}
            </div>

            <div className="flex flex-col gap-3 w-full border-t-2 pt-4" style={{ borderColor: 'rgba(255,0,127,0.2)' }}>
              <ArcadeButton type="submit" color="pink" className="w-full" onClick={handleJoin}>
                JOIN MATCH
              </ArcadeButton>
              <ArcadeButton type="button" color="cyan" onClick={() => navigate('/')} className="w-full text-sm">
                BACK TO MENU
              </ArcadeButton>
            </div>
          </form>
        </PixelPanel>
      </div>
    </div>
  );
};

export default JoinMatchPage;

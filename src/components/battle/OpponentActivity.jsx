import React, { useEffect, useRef, useState } from 'react';
import ArcadeText from '../arcade/ArcadeText';
import { Activity } from 'lucide-react';
import gsap from 'gsap';

const DEBUFF_CONFIG = {
  steal: {
    label: 'STEAL',
    sub: 'PROGRESS STOLEN',
    color: '#ff003c',
    glow: 'rgba(255,0,60,0.9)',
    icon: '⚡',
  },
  blind: {
    label: 'BLIND',
    sub: 'CANNOT SEE TEXT',
    color: '#b026ff',
    glow: 'rgba(176,38,255,0.9)',
    icon: '👁',
  },
  glitch: {
    label: 'GLITCH',
    sub: 'KEYBOARD SCRAMBLED',
    color: '#fffb00',
    glow: 'rgba(255,251,0,0.9)',
    icon: '⚠',
  },
};

const OpponentActivity = ({ progress = 0, wpm = 0, accuracy = 100, combo = 0, color = 'pink', debuff = null, hp, maxHp, showHp = false }) => {
  const colorClass = color === 'cyan' ? 'text-[var(--color-neon-cyan)]' : 'text-[var(--color-neon-pink)]';
  const bgClass   = color === 'cyan' ? 'bg-[var(--color-neon-cyan)]'   : 'bg-[var(--color-neon-pink)]';
  const borderHex = color === 'cyan' ? '#00f3ff' : '#ff007f';

  const bannerRef = useRef(null);
  const prevDebuffType = useRef(null);
  const [activeCfg, setActiveCfg] = useState(null);
  const hideTimerRef = useRef(null);

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

  // Animate the debuff banner when a new debuff arrives
  useEffect(() => {
    if (!debuff) {
      prevDebuffType.current = null;
      return;
    }
    if (debuff.type === prevDebuffType.current) return;
    prevDebuffType.current = debuff.type;

    const cfg = DEBUFF_CONFIG[debuff.type];
    if (!cfg) return;

    // Clear any existing hide timer
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    setActiveCfg(cfg);

    // Wait one frame for DOM, then animate IN
    requestAnimationFrame(() => {
      const el = bannerRef.current;
      if (!el) return;
      gsap.killTweensOf(el);
      gsap.fromTo(
        el,
        { yPercent: -110, opacity: 0, scaleX: 0.85 },
        {
          yPercent: 0, opacity: 1, scaleX: 1,
          duration: 0.35,
          ease: 'back.out(1.8)',
          onComplete: () => {
            // Hold 2 seconds then animate OUT
            hideTimerRef.current = setTimeout(() => {
              gsap.to(el, {
                yPercent: -115,
                opacity: 0,
                scaleX: 0.85,
                duration: 0.4,
                ease: 'power3.in',
                onComplete: () => {
                  setActiveCfg(null);
                  prevDebuffType.current = null;
                },
              });
            }, 2000);
          },
        }
      );
    });

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [debuff]);

  const isSteal  = debuff?.type === 'steal';
  const isBlind  = debuff?.type === 'blind';
  const isGlitch = debuff?.type === 'glitch';

  return (
    <div
      className={`w-48 xl:w-56 border-2 bg-black flex flex-col gap-0 shrink-0 relative overflow-hidden transition-all duration-300
        ${isGlitch ? 'animate-pulse border-[var(--color-neon-yellow)] skew-x-1' : ''}
        ${isBlind  ? 'opacity-50 blur-[1px] border-[var(--color-neon-purple)]' : ''}
        ${!isGlitch && !isBlind ? '' : ''}
      `}
      style={{
        borderColor: isGlitch ? '#fffb00' : isBlind ? '#b026ff' : borderHex,
        boxShadow: `0 0 12px ${isGlitch ? 'rgba(255,251,0,0.4)' : isBlind ? 'rgba(176,38,255,0.4)' : borderHex + '40'}`,
      }}
    >
      {/* Pixel corner squares */}
      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 z-10" style={{ background: isGlitch ? '#fffb00' : isBlind ? '#b026ff' : borderHex }} />
      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 z-10" style={{ background: isGlitch ? '#fffb00' : isBlind ? '#b026ff' : borderHex }} />
      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 z-10" style={{ background: isGlitch ? '#fffb00' : isBlind ? '#b026ff' : borderHex }} />
      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 z-10" style={{ background: isGlitch ? '#fffb00' : isBlind ? '#b026ff' : borderHex }} />

      {/* Glitch noise overlay */}
      {isGlitch && (
        <div className="absolute inset-0 z-30 pointer-events-none mix-blend-difference bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-60" />
      )}

      {/* ── DEBUFF BANNER ── */}
      {activeCfg && debuff && (
        <div
          ref={bannerRef}
          className="absolute inset-x-0 top-0 z-40 origin-top"
          style={{ transformOrigin: 'top center' }}
        >
          {/* Outer banner border */}
          <div
            className="relative border-b-4 px-3 py-2 flex flex-col items-center"
            style={{
              borderColor: activeCfg.color,
              background: `${activeCfg.color}15`,
              boxShadow: `0 4px 20px ${activeCfg.glow}, inset 0 0 20px ${activeCfg.color}10`,
            }}
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: activeCfg.color, boxShadow: `0 0 8px ${activeCfg.color}` }} />

            {/* Corner accents on the banner itself */}
            <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2" style={{ borderColor: activeCfg.color }} />
            <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2" style={{ borderColor: activeCfg.color }} />

            <div className="flex items-center gap-2 w-full justify-center">
              <span className="text-lg" style={{ filter: `drop-shadow(0 0 6px ${activeCfg.color})` }}>
                {activeCfg.icon}
              </span>
              <div className="flex flex-col items-center">
                <div
                  className="font-[family-name:var(--font-arcade)] text-xl tracking-widest leading-none"
                  style={{ color: activeCfg.color, textShadow: `0 0 8px ${activeCfg.color}, 0 0 20px ${activeCfg.glow}` }}
                >
                  {activeCfg.label}
                </div>
                <div
                  className="font-[family-name:var(--font-arcade)] text-[8px] tracking-widest mt-0.5"
                  style={{ color: `${activeCfg.color}90` }}
                >
                  {activeCfg.sub}
                </div>
              </div>
            </div>

            {/* Scanning bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden">
              <div
                className="h-full w-1/3 animate-[scan_0.8s_linear_infinite]"
                style={{ background: activeCfg.color }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Steal full overlay (blocks stats) */}
      {isSteal && (
        <div className="absolute inset-0 bg-black/85 z-30 flex items-center justify-center backdrop-blur-sm" style={{ top: activeCfg ? '70px' : 0 }}>
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl" style={{ filter: 'drop-shadow(0 0 10px #ff003c)' }}>⚡</span>
            <ArcadeText color="red" glow className="text-2xl tracking-widest animate-pulse">STOLEN</ArcadeText>
          </div>
        </div>
      )}

      {/* Stats content */}
      <div className={`flex flex-col gap-3 p-4 ${isSteal ? 'opacity-5' : ''} ${activeCfg ? 'mt-[68px]' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: `${borderHex}30` }}>
          <div className="flex items-center gap-1.5">
            <Activity size={12} className={colorClass} />
            <span className={`${colorClass} text-[9px] font-[family-name:var(--font-arcade)] tracking-widest`}>OPPONENT</span>
          </div>
          <span className={`${colorClass} text-[9px] font-[family-name:var(--font-arcade)]`}>{progress}%</span>
        </div>

        {showHp && (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[9px] font-[family-name:var(--font-arcade)]">
              <span className="text-red-400">HP</span>
              <span className="text-white">{hp}/{maxHp}</span>
            </div>
            <div className={`w-full h-2 border overflow-hidden transition-colors ${isHit ? 'bg-white border-white' : 'bg-red-900/40 border-red-900/50'}`}>
              <div className={`h-full ${isHit ? 'bg-white' : 'bg-red-500'} shadow-[0_0_8px_red]`}
                style={{ width: `${Math.max(0, (hp / maxHp) * 100)}%`, transition: 'width 0.3s ease-out' }} />
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-[family-name:var(--font-arcade)] text-white/30 tracking-widest">TYPING...</span>
          <div className="w-full h-1.5 bg-white/10 overflow-hidden">
            <div className={`h-full ${bgClass}`} style={{ width: `${progress}%`, transition: 'width 0.15s linear' }} />
          </div>
        </div>

        {/* Stats rows */}
        {[
          { label: 'WPM',      value: wpm },
          { label: 'ACCURACY', value: `${accuracy}%` },
          { label: 'COMBO',    value: `×${combo}` },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center text-[9px] font-[family-name:var(--font-arcade)]">
            <span className="text-white/30">{label}</span>
            <span className="text-white">{value}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes scan { 0% { transform: translateX(-100%) } 100% { transform: translateX(400%) } }
      `}</style>
    </div>
  );
};

export default OpponentActivity;

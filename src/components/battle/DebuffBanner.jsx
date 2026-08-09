import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const DEBUFF_CONFIG = {
  steal: {
    label: 'STOLEN!',
    sub: 'YOUR PROGRESS WAS STOLEN',
    color: '#ff003c',
    glow: 'rgba(255,0,60,0.85)',
    icon: '⚡',
  },
  blind: {
    label: 'BLINDED!',
    sub: 'YOU CANNOT SEE THE TEXT',
    color: '#b026ff',
    glow: 'rgba(176,38,255,0.85)',
    icon: '👁',
  },
  glitch: {
    label: 'GLITCHED!',
    sub: 'KEYBOARD IS SCRAMBLED',
    color: '#fffb00',
    glow: 'rgba(255,251,0,0.85)',
    icon: '⚠',
  },
};

// Banner shown on YOUR screen when YOU receive a debuff
const DebuffBanner = ({ activeDebuff }) => {
  const panelRef = useRef(null);
  const [cfg, setCfg] = useState(null);
  const [mounted, setMounted] = useState(false);
  const prevType = useRef(null);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    if (!activeDebuff || activeDebuff.type === prevType.current) return;
    prevType.current = activeDebuff.type;

    const newCfg = DEBUFF_CONFIG[activeDebuff.type];
    if (!newCfg) return;

    // Clear any existing hide timer
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    setCfg(newCfg);
    setMounted(true);

    // Wait one frame for the DOM to render, then animate in
    requestAnimationFrame(() => {
      const el = panelRef.current;
      if (!el) return;

      gsap.killTweensOf(el);

      // Animate IN: slide down + scale up + fade in
      gsap.fromTo(
        el,
        { yPercent: -120, opacity: 0, scaleX: 0.8 },
        {
          yPercent: 0,
          opacity: 1,
          scaleX: 1,
          duration: 0.4,
          ease: 'back.out(1.8)',
          onComplete: () => {
            // After 2 seconds visible, animate OUT
            hideTimerRef.current = setTimeout(() => {
              gsap.to(el, {
                yPercent: -130,
                opacity: 0,
                scaleX: 0.85,
                duration: 0.45,
                ease: 'power3.in',
                onComplete: () => {
                  setMounted(false);
                  prevType.current = null;
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
  }, [activeDebuff]);

  if (!mounted || !cfg) return null;

  return (
    // Outer wrapper: fixed center position, overflow hidden to clip slide-in
    <div
      className="absolute top-0 left-1/2 z-[200] pointer-events-none overflow-visible"
      style={{ transform: 'translateX(-50%)' }}
    >
      {/* Animated panel — GSAP targets this */}
      <div ref={panelRef} style={{ willChange: 'transform, opacity' }}>
        {/* Pixel border outer frame */}
        <div
          className="relative border-4 p-[3px] mt-3"
          style={{
            borderColor: cfg.color,
            boxShadow: `0 0 0 2px #000, 0 0 25px ${cfg.glow}, 0 0 70px ${cfg.glow.replace('0.85', '0.25')}`,
          }}
        >
          {/* Corner pixel squares */}
          {['-top-2 -left-2', '-top-2 -right-2', '-bottom-2 -left-2', '-bottom-2 -right-2'].map((pos, i) => (
            <div
              key={i}
              className={`absolute ${pos} w-4 h-4`}
              style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }}
            />
          ))}

          {/* Inner panel */}
          <div
            className="border-2 border-black/70 bg-black/96 px-7 py-3 flex items-center gap-5"
            style={{ minWidth: 300 }}
          >
            {/* Icon */}
            <span
              className="text-4xl shrink-0 select-none"
              style={{ filter: `drop-shadow(0 0 12px ${cfg.color})`, animation: 'iconPulse 0.5s ease-in-out 3' }}
            >
              {cfg.icon}
            </span>

            {/* Text block */}
            <div className="flex flex-col gap-0.5 flex-1">
              <span
                className="font-[family-name:var(--font-arcade)] text-[9px] tracking-[0.4em]"
                style={{ color: `${cfg.color}70` }}
              >
                ▶ INCOMING SKILL
              </span>
              <span
                className="font-[family-name:var(--font-arcade)] text-3xl tracking-widest leading-none"
                style={{
                  color: cfg.color,
                  textShadow: `0 0 8px ${cfg.color}, 0 0 22px ${cfg.glow}`,
                }}
              >
                {cfg.label}
              </span>
              <span
                className="font-[family-name:var(--font-arcade)] text-[9px] tracking-[0.18em] mt-0.5"
                style={{ color: `${cfg.color}80` }}
              >
                {cfg.sub}
              </span>
            </div>

            {/* Blinking warning indicator */}
            <span
              className="font-[family-name:var(--font-arcade)] text-sm tracking-widest shrink-0 animate-pulse"
              style={{ color: cfg.color }}
            >
              !!
            </span>
          </div>

          {/* Bottom scan line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
            <div
              className="h-full w-1/3"
              style={{
                background: cfg.color,
                boxShadow: `0 0 8px ${cfg.color}`,
                animation: 'bannerScan 0.9s linear infinite',
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bannerScan {
          0%   { transform: translateX(-100%) }
          100% { transform: translateX(400%) }
        }
        @keyframes iconPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.25); }
        }
      `}</style>
    </div>
  );
};

export default DebuffBanner;

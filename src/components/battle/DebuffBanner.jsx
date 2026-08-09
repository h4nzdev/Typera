import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { playVoice } from '../../lib/sounds';

import stealBanner from '../../assets/banner/steal-banner.png';
import glitchBanner from '../../assets/banner/glitch-banner.png';
import blindBanner from '../../assets/banner/blind-banner.png';

const DEBUFF_CONFIG = {
  steal: {
    label: 'STOLEN!',
    sub: 'YOUR PROGRESS WAS STOLEN',
    color: '#ff003c',
    glow: 'rgba(255,0,60,0.85)',
    icon: '⚡',
    image: stealBanner,
  },
  blind: {
    label: 'BLINDED!',
    sub: 'YOU CANNOT SEE THE TEXT',
    color: '#b026ff',
    glow: 'rgba(176,38,255,0.85)',
    icon: '👁',
    image: blindBanner,
  },
  glitch: {
    label: 'GLITCHED!',
    sub: 'KEYBOARD IS SCRAMBLED',
    color: '#fffb00',
    glow: 'rgba(255,251,0,0.85)',
    icon: '⚠',
    image: glitchBanner,
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

    // Play the voice line immediately when the debuff hits
    playVoice(activeDebuff.type);

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
      className="absolute top-2 left-1/2 z-[200] pointer-events-none overflow-visible"
      style={{ transform: 'translateX(-50%)' }}
    >
      {/* Animated panel — GSAP targets this */}
      <div ref={panelRef} style={{ willChange: 'transform, opacity' }}>
        {/* Pixel border outer frame */}
        <div
          className="relative border-4 p-[3px] mt-2 flex flex-col items-center justify-center bg-black/90"
          style={{
            borderColor: cfg.color,
            boxShadow: `0 0 0 2px #000, 0 0 35px ${cfg.glow}, 0 0 80px ${cfg.glow.replace('0.85', '0.3')}`,
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

          {/* Banner Graphic Image */}
          <div className="relative overflow-hidden p-2 flex items-center justify-center">
            <img
              src={cfg.image}
              alt={cfg.label}
              className="max-h-24 md:max-h-28 w-auto object-contain select-none pointer-events-none"
              style={{
                filter: `drop-shadow(0 0 12px ${cfg.color}) drop-shadow(0 0 25px ${cfg.glow})`,
              }}
              draggable={false}
            />
          </div>

          {/* Bottom scan line */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden">
            <div
              className="h-full w-1/3"
              style={{
                background: cfg.color,
                boxShadow: `0 0 10px ${cfg.color}`,
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
      `}</style>
    </div>
  );
};

export default DebuffBanner;

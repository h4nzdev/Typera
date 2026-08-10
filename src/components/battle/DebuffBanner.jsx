import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { playVoice } from '../../lib/sounds';

import stealBanner from '../../assets/banner/steal-banner.png';
import glitchBanner from '../../assets/banner/glitch-banner.png';
import blindBanner from '../../assets/banner/blind-banner.png';
import freezeBanner from '../../assets/banner/freeze.png';

const DEBUFF_CONFIG = {
  steal: {
    label: 'STOLEN!',
    color: '#ff003c',
    glow: 'rgba(255,0,60,0.85)',
    image: stealBanner,
  },
  blind: {
    label: 'BLINDED!',
    color: '#b026ff',
    glow: 'rgba(176,38,255,0.85)',
    image: blindBanner,
  },
  glitch: {
    label: 'GLITCHED!',
    color: '#fffb00',
    glow: 'rgba(255,251,0,0.85)',
    image: glitchBanner,
  },
  freeze: {
    label: 'FROZEN!',
    color: '#00f3ff',
    glow: 'rgba(0,243,255,0.85)',
    image: freezeBanner,
  },
};

// Banner shown on YOUR screen when YOU receive a debuff
const DebuffBanner = ({ activeDebuff }) => {
  const panelRef = useRef(null);
  const [cfg, setCfg] = useState(null);
  const [mounted, setMounted] = useState(false);
  const prevType = useRef(null);

  useEffect(() => {
    if (!activeDebuff) return;
    if (activeDebuff.type === prevType.current) return;
    prevType.current = activeDebuff.type;

    const newCfg = DEBUFF_CONFIG[activeDebuff.type];
    if (!newCfg) return;

    setCfg(newCfg);
    setMounted(true);

    requestAnimationFrame(() => {
      const el = panelRef.current;
      if (!el) return;

      gsap.killTweensOf(el);

      // GSAP Timeline: Slide IN (0.35s) -> Hold (2.0s) -> Slide OUT (0.35s) -> Unmount
      const tl = gsap.timeline({
        onComplete: () => {
          setMounted(false);
          setCfg(null);
          prevType.current = null;
        }
      });

      tl.fromTo(
        el,
        { yPercent: -140, opacity: 0, scale: 0.8 },
        { yPercent: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.7)' }
      )
      .to(el, { duration: 2.0 })
      .to(
        el,
        { yPercent: -140, opacity: 0, scale: 0.8, duration: 0.35, ease: 'power3.in' }
      );
    });
  }, [activeDebuff]);

  if (!mounted || !cfg) return null;

  return (
    // Outer wrapper: fixed top-center position
    <div
      className="absolute top-10 left-1/2 z-[200] pointer-events-none overflow-visible"
      style={{ transform: 'translateX(-50%)' }}
    >
      {/* Animated panel containing JUST the banner PNG (no outer border box) */}
      <div ref={panelRef} style={{ willChange: 'transform, opacity' }}>
        <img
          src={cfg.image}
          alt={cfg.label}
          className="max-h-28 md:max-h-36 w-auto object-contain select-none pointer-events-none"
          style={{
            filter: `drop-shadow(0 0 15px ${cfg.color}) drop-shadow(0 0 35px ${cfg.glow})`,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default DebuffBanner;

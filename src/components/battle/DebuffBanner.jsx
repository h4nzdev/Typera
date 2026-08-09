import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const DEBUFF_CONFIG = {
  steal: {
    label: 'STOLEN!',
    sub: 'YOUR PROGRESS WAS STOLEN',
    color: '#ff003c',
    glow: 'rgba(255,0,60,0.8)',
    icon: '⚡',
    borderColor: '#ff003c',
  },
  blind: {
    label: 'BLINDED!',
    sub: 'YOU CANNOT SEE THE TEXT',
    color: '#b026ff',
    glow: 'rgba(176,38,255,0.8)',
    icon: '👁',
    borderColor: '#b026ff',
  },
  glitch: {
    label: 'GLITCHED!',
    sub: 'KEYBOARD IS SCRAMBLED',
    color: '#fffb00',
    glow: 'rgba(255,251,0,0.8)',
    icon: '⚠',
    borderColor: '#fffb00',
  },
};

// Banner shown on YOUR screen when YOU get hit by a power-up
const DebuffBanner = ({ activeDebuff }) => {
  const bannerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [currentDebuff, setCurrentDebuff] = useState(null);
  const prevType = useRef(null);

  useEffect(() => {
    if (!activeDebuff || activeDebuff.type === prevType.current) return;
    prevType.current = activeDebuff.type;

    const cfg = DEBUFF_CONFIG[activeDebuff.type];
    if (!cfg) return;

    setCurrentDebuff(cfg);
    setVisible(true);

    const el = bannerRef.current;
    if (!el) return;

    // Kill any running animation
    gsap.killTweensOf(el);

    // Slam in from top, hold, then fly out
    gsap.fromTo(el,
      { y: -120, opacity: 0, scaleY: 0.6 },
      {
        y: 0, opacity: 1, scaleY: 1,
        duration: 0.35,
        ease: 'back.out(2)',
        onComplete: () => {
          gsap.to(el, {
            y: -120, opacity: 0,
            duration: 0.4,
            delay: 1.8,
            ease: 'power3.in',
            onComplete: () => {
              setVisible(false);
              prevType.current = null;
            }
          });
        }
      }
    );
  }, [activeDebuff]);

  if (!visible || !currentDebuff) return null;

  const { label, sub, color, glow, icon, borderColor } = currentDebuff;

  return (
    <div
      ref={bannerRef}
      className="absolute top-4 left-1/2 z-[200] pointer-events-none"
      style={{ transform: 'translateX(-50%)' }}
    >
      {/* Outer pixel border */}
      <div
        className="relative border-4 p-1"
        style={{
          borderColor,
          boxShadow: `0 0 0 2px #000, 0 0 30px ${glow}, 0 0 80px ${glow.replace('0.8', '0.3')}`,
        }}
      >
        {/* Pixel corner squares */}
        <div className="absolute -top-2 -left-2 w-4 h-4" style={{ background: borderColor, boxShadow: `0 0 8px ${borderColor}` }} />
        <div className="absolute -top-2 -right-2 w-4 h-4" style={{ background: borderColor, boxShadow: `0 0 8px ${borderColor}` }} />
        <div className="absolute -bottom-2 -left-2 w-4 h-4" style={{ background: borderColor, boxShadow: `0 0 8px ${borderColor}` }} />
        <div className="absolute -bottom-2 -right-2 w-4 h-4" style={{ background: borderColor, boxShadow: `0 0 8px ${borderColor}` }} />

        {/* Inner border + content */}
        <div
          className="border-2 border-black/60 bg-black/95 px-8 py-3 flex items-center gap-5"
          style={{ minWidth: 320 }}
        >
          {/* Icon */}
          <span
            className="text-4xl shrink-0 animate-pulse"
            style={{ filter: `drop-shadow(0 0 10px ${color})` }}
          >
            {icon}
          </span>

          {/* Text */}
          <div className="flex flex-col gap-0.5">
            {/* Header bar */}
            <div
              className="text-[10px] font-[family-name:var(--font-arcade)] tracking-[0.4em] mb-1"
              style={{ color: `${color}80` }}
            >
              ▶ INCOMING SKILL
            </div>
            <div
              className="font-[family-name:var(--font-arcade)] text-3xl tracking-widest leading-none"
              style={{
                color,
                textShadow: `0 0 10px ${color}, 0 0 25px ${glow}`,
              }}
            >
              {label}
            </div>
            <div
              className="font-[family-name:var(--font-arcade)] text-[10px] tracking-[0.2em] mt-1"
              style={{ color: `${color}90` }}
            >
              {sub}
            </div>
          </div>

          {/* Right: blinking warning */}
          <div
            className="ml-auto shrink-0 font-[family-name:var(--font-arcade)] text-xs tracking-widest animate-pulse"
            style={{ color }}
          >
            !!
          </div>
        </div>
      </div>

      {/* Bottom scan-line flash */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, boxShadow: `0 0 10px ${color}` }}
      />
    </div>
  );
};

export default DebuffBanner;

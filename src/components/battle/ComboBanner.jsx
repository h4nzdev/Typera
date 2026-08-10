import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { playVoice } from '../../lib/sounds';
import comboBannerImg from '../../assets/banner/combo.png';

const ComboBanner = ({ triggerCombo }) => {
  const panelRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    if (!triggerCombo) return;

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    setMounted(true);
    playVoice('combo'); // Trigger combo.mp3!

    requestAnimationFrame(() => {
      const el = panelRef.current;
      if (!el) return;

      gsap.killTweensOf(el);

      // Animate IN: slide down + scale up + slight bounce
      gsap.fromTo(
        el,
        { yPercent: -140, opacity: 0, scale: 0.7, rotation: -4 },
        {
          yPercent: 0,
          opacity: 1,
          scale: 1.05,
          rotation: 0,
          duration: 0.4,
          ease: 'back.out(2)',
          onComplete: () => {
            // Hold for 2 seconds then animate OUT
            hideTimerRef.current = setTimeout(() => {
              gsap.to(el, {
                yPercent: -140,
                opacity: 0,
                scale: 0.8,
                duration: 0.35,
                ease: 'power3.in',
                onComplete: () => {
                  setMounted(false);
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
  }, [triggerCombo]);

  if (!mounted) return null;

  return (
    <div
      className="absolute top-10 left-1/2 z-[210] pointer-events-none overflow-visible select-none"
      style={{ transform: 'translateX(-50%)' }}
    >
      <div ref={panelRef} style={{ willChange: 'transform, opacity' }}>
        <img
          src={comboBannerImg}
          alt="50X COMBO!"
          className="max-h-28 md:max-h-40 w-auto object-contain select-none pointer-events-none"
          style={{
            filter: 'drop-shadow(0 0 20px #39ff14) drop-shadow(0 0 45px rgba(57,255,20,0.9))',
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default ComboBanner;

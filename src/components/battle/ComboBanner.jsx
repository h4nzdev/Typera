import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import comboBannerImg from '../../assets/banner/combo.png';

const ComboBanner = ({ triggerCombo }) => {
  const panelRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!triggerCombo) return;

    setMounted(true);

    requestAnimationFrame(() => {
      const el = panelRef.current;
      if (!el) return;

      gsap.killTweensOf(el);

      // GSAP Timeline: Slide IN (0.35s) -> Hold (2.0s) -> Slide OUT (0.35s) -> Unmount
      const tl = gsap.timeline({
        onComplete: () => {
          setMounted(false);
        }
      });

      tl.fromTo(
        el,
        { yPercent: -140, opacity: 0, scale: 0.7, rotation: -4 },
        { yPercent: 0, opacity: 1, scale: 1.05, rotation: 0, duration: 0.35, ease: 'back.out(2)' }
      )
      .to(el, { duration: 2.0 })
      .to(
        el,
        { yPercent: -140, opacity: 0, scale: 0.8, duration: 0.35, ease: 'power3.in' }
      );
    });
  }, [triggerCombo]);

  if (!mounted) return null;

  return (
    <div
      className="absolute top-10 left-1/2 z-[210] pointer-events-none overflow-visible select-none"
      style={{ transform: 'translateX(-50%)' }}
    >
      <div ref={panelRef} className="relative flex items-center justify-center" style={{ willChange: 'transform, opacity' }}>
        {/* Fiery Background Glow */}
        <div className="absolute -inset-6 bg-gradient-to-r from-orange-600/60 via-red-600/80 to-yellow-500/60 rounded-full blur-xl animate-fire-4" />
        <div className="absolute -inset-3 bg-gradient-to-b from-yellow-300/40 via-orange-500/60 to-red-600/60 rounded-full blur-md animate-pulse" />
        <img
          src={comboBannerImg}
          alt="50X COMBO!"
          className="max-h-28 md:max-h-40 w-auto object-contain select-none pointer-events-none relative z-10"
          style={{
            filter: 'drop-shadow(0 0 20px #ff6600) drop-shadow(0 0 45px #ff3300)',
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default ComboBanner;

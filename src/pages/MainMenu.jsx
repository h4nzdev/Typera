import React, { useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import ArcadeText from '../components/arcade/ArcadeText';
import ArcadeButton from '../components/arcade/ArcadeButton';

const MainMenu = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      tl.fromTo(".logo", { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, 0)
        .fromTo(".subtitle", { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.2)
        .fromTo(".desc", { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.3)
        .fromTo(".menu-btn", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" }, 0.4);
        
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center bg-black/50 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.05)_0%,transparent_60%)] pointer-events-none"></div>
      
      <div className="text-center mb-12 z-10">
        <ArcadeText as="h1" color="cyan" glow className="logo text-6xl md:text-8xl mb-4 block">
          TYPE//BATTLE
        </ArcadeText>
        <ArcadeText as="h2" color="pink" className="subtitle text-2xl md:text-3xl mb-8 block">
          1V1 TYPING ARENA
        </ArcadeText>
        <div className="desc font-[family-name:var(--font-arcade)] text-gray-400 text-lg md:text-xl tracking-widest leading-relaxed">
          <p>TYPE FAST.</p>
          <p>STAY ACCURATE.</p>
          <p>BUILD YOUR COMBO.</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-6 z-10 w-72">
        <ArcadeButton className="menu-btn w-full" color="cyan" onClick={() => navigate('/create')}>
          CREATE MATCH
        </ArcadeButton>
        <ArcadeButton className="menu-btn w-full" color="pink" onClick={() => navigate('/join')}>
          JOIN MATCH
        </ArcadeButton>
        <ArcadeButton className="menu-btn w-full" color="green" onClick={() => navigate('/practice')}>
          SOLO PRACTICE
        </ArcadeButton>
        <ArcadeButton className="menu-btn w-full" color="purple" onClick={() => navigate('/leaderboard')}>
          LEADERBOARD
        </ArcadeButton>
      </div>
    </div>
  );
};

export default MainMenu;

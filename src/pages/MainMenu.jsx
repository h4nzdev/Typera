import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import ArcadeText from '../components/arcade/ArcadeText';
import ArcadeButton from '../components/arcade/ArcadeButton';
import useUserStore from '../store/useUserStore';
import { Settings } from 'lucide-react';

const MainMenu = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  const { playerName, setPlayerName } = useUserStore();
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState('');
  
  // Show modal on first load if no name is set
  useEffect(() => {
    if (!playerName) {
      setShowNameModal(true);
    }
  }, [playerName]);

  useLayoutEffect(() => {
    if (showNameModal) return; // Don't run main animations if modal is active

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      tl.fromTo(".logo", { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, 0)
        .fromTo(".subtitle", { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.2)
        .fromTo(".desc", { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.3)
        .fromTo(".menu-btn", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" }, 0.4);
        
    }, containerRef);
    
    return () => ctx.revert();
  }, [showNameModal]);

  const handleSaveName = () => {
    if (tempName.trim().length > 0) {
      setPlayerName(tempName.toUpperCase());
      setShowNameModal(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center bg-black/50 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.05)_0%,transparent_60%)] pointer-events-none"></div>
      
      {/* Name Entry Modal */}
      {showNameModal && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-md p-4">
          <ArcadeText color="cyan" glow className="text-4xl md:text-5xl mb-8 text-center leading-tight">
            {!playerName ? 'WELCOME TO THE ARENA' : 'UPDATE YOUR ID'}
          </ArcadeText>
          <div className="flex flex-col gap-6 items-center w-full max-w-md">
            <ArcadeText color="pink" className="text-sm tracking-widest text-center">
              ENTER YOUR 5-LETTER INITIALS
            </ArcadeText>
            <input 
              type="text" 
              maxLength={5}
              value={tempName}
              onChange={(e) => setTempName(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
              className="bg-black/80 border-2 border-[var(--color-neon-cyan)] rounded text-[var(--color-neon-cyan)] px-4 py-3 text-4xl font-[inherit] uppercase text-center outline-none focus:shadow-[0_0_20px_var(--color-neon-cyan)] transition-shadow w-48"
              placeholder="AAAAA"
              autoFocus
            />
            <ArcadeButton color="cyan" className="w-48 py-3 mt-4" onClick={handleSaveName} disabled={!tempName.trim()}>
              CONFIRM
            </ArcadeButton>
            {playerName && (
              <ArcadeButton color="white" className="text-xs py-2 w-48" onClick={() => setShowNameModal(false)}>
                CANCEL
              </ArcadeButton>
            )}
          </div>
        </div>
      )}

      {/* Main UI */}
      {!showNameModal && (
        <>
          <div className="absolute top-8 left-8 flex items-center gap-4 z-20">
            <ArcadeText color="white" className="text-sm tracking-widest opacity-50">
              ID: <span className="text-[var(--color-neon-cyan)] opacity-100">{playerName}</span>
            </ArcadeText>
            <button 
              onClick={() => { setTempName(playerName); setShowNameModal(true); }}
              className="text-white/30 hover:text-[var(--color-neon-cyan)] transition-colors"
              title="Change Name"
            >
              <Settings size={16} />
            </button>
          </div>

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
        </>
      )}
    </div>
  );
};

export default MainMenu;

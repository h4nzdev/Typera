import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import ArcadeText from '../components/arcade/ArcadeText';
import ArcadePanel from '../components/arcade/ArcadePanel';
import useMatchStore from '../store/useMatchStore';

const MatchLobbyPage = () => {
  const navigate = useNavigate();
  const vsRef = useRef(null);
  const { players, status } = useMatchStore();

  useEffect(() => {
    // Animate VS pulse
    gsap.to(vsRef.current, {
      scale: 1.1,
      duration: 0.8,
      yoyo: true,
      repeat: -1,
      ease: "power1.inOut"
    });
  }, []);

  useEffect(() => {
    if (status === 'starting') {
      const timer = setTimeout(() => {
        navigate('/battle');
      }, 1500); // Brief pause to show connection before jumping to battle
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  const p1 = players.find(p => p.isHost) || { isHost: true };
  const p2 = players.find(p => !p.isHost) || null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-black/50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.05)_0%,transparent_60%)] pointer-events-none"></div>
      
      {/* Cancelled Modal Overlay */}
      {status === 'cancelled' && (
        <div className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm">
          <ArcadeText color="red" glow className="text-5xl md:text-7xl mb-4 text-center">MATCH CANCELLED</ArcadeText>
          <ArcadeText color="pink" className="text-xl mb-8 tracking-widest text-center">HOST DISCONNECTED</ArcadeText>
          <ArcadeButton color="cyan" onClick={() => { useMatchStore.getState().leaveMatch(); navigate('/'); }}>
            MAIN MENU
          </ArcadeButton>
        </div>
      )}

      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center justify-between gap-12 z-10 p-8">
        
        {/* Player 1 (Host) */}
        <ArcadePanel color="cyan" className="w-full md:w-1/3 flex flex-col items-center gap-6 text-center">
          <ArcadeText color="cyan" className="text-2xl">PLAYER 1</ArcadeText>
          <div className="w-24 h-24 rounded-full border-2 border-[var(--color-neon-cyan)] shadow-[0_0_15px_rgba(0,243,255,0.3)] bg-black/50 flex items-center justify-center overflow-hidden">
            <span className="text-[var(--color-neon-cyan)] text-xs font-[family-name:var(--font-arcade)]">AVATAR</span>
          </div>
          <ArcadeText color="white" glow className="text-xl">HOST</ArcadeText>
          <ArcadeText color="green" glow className="text-lg animate-pulse">READY</ArcadeText>
        </ArcadePanel>

        {/* VS */}
        <div className="flex-shrink-0" ref={vsRef}>
          <ArcadeText color="purple" glow className="text-6xl md:text-8xl italic">VS</ArcadeText>
        </div>

        {/* Player 2 (Guest) */}
        <ArcadePanel color="pink" className="w-full md:w-1/3 flex flex-col items-center gap-6 text-center">
          <ArcadeText color="pink" className="text-2xl">PLAYER 2</ArcadeText>
          <div className="w-24 h-24 rounded-full border-2 border-[var(--color-neon-pink)] shadow-[0_0_15px_rgba(255,0,127,0.3)] bg-black/50 flex items-center justify-center overflow-hidden">
            <span className="text-[var(--color-neon-pink)] text-xs font-[family-name:var(--font-arcade)]">
              {p2 ? 'AVATAR' : '?'}
            </span>
          </div>
          <ArcadeText color="white" glow className="text-xl">{p2 ? 'CHALLENGER' : 'WAITING...'}</ArcadeText>
          {p2 && <ArcadeText color="green" glow className="text-lg animate-pulse">READY</ArcadeText>}
        </ArcadePanel>

      </div>
    </div>
  );
};

export default MatchLobbyPage;

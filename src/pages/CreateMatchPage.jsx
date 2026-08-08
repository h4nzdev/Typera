import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import ArcadeText from '../components/arcade/ArcadeText';
import ArcadePanel from '../components/arcade/ArcadePanel';
import ArcadeButton from '../components/arcade/ArcadeButton';
import useMatchStore from '../store/useMatchStore';

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const CreateMatchPage = () => {
  const navigate = useNavigate();
  const dotsRef = useRef(null);
  const { matchCode, initMatch, leaveMatch, status, category, setCategory } = useMatchStore();

  useEffect(() => {
    // Generate new match code and init realtime channel
    const newCode = generateCode();
    initMatch(newCode, true);
    
    // Simple animated dots
    const tl = gsap.timeline({ repeat: -1 });
    tl.to(".dot", { opacity: 1, duration: 0.3, stagger: 0.2 })
      .to(".dot", { opacity: 0.2, duration: 0.3, stagger: 0.2 }, "+=0.5");
      
    return () => tl.kill();
  }, [initMatch]);

  useEffect(() => {
    if (status === 'starting') {
      navigate('/lobby');
    }
  }, [status, navigate]);

  const handleCancel = () => {
    leaveMatch();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-black/50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.05)_0%,transparent_60%)] pointer-events-none"></div>
      
      <ArcadePanel color="cyan" className="w-full max-w-md text-center z-10 flex flex-col items-center gap-8">
        <ArcadeText as="h1" color="cyan" glow className="text-4xl">CREATE MATCH</ArcadeText>
        
        <div className="flex flex-col items-center gap-2">
          <ArcadeText color="white" className="text-xl">MATCH CODE</ArcadeText>
          <div className="bg-black/50 border border-[var(--color-neon-cyan)] px-8 py-4 rounded-sm">
            <ArcadeText color="cyan" glow className="text-5xl tracking-[0.5em] ml-[0.25em]">{matchCode || '------'}</ArcadeText>
          </div>
        </div>

        {/* Category Selector */}
        <div className="flex flex-col items-center gap-3 w-full">
          <ArcadeText color="pink" className="text-sm">WORD CATEGORY</ArcadeText>
          <div className="flex flex-wrap justify-center gap-2 w-full max-w-[280px]">
            {['all', 'common', 'it', 'gaming', 'tech', 'fun'].map(c => (
              <button 
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1 font-[family-name:var(--font-arcade)] text-xs md:text-sm border ${category === c ? 'border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] shadow-[0_0_10px_var(--color-neon-cyan)]' : 'border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-400'} transition-all uppercase rounded-sm`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <ArcadeText color="pink" glow className="text-xl">
            WAITING FOR PLAYER
            <span ref={dotsRef} className="inline-block ml-2 w-8 text-left">
              <span className="dot opacity-20">.</span>
              <span className="dot opacity-20">.</span>
              <span className="dot opacity-20">.</span>
            </span>
          </ArcadeText>
          
          <ArcadeButton color="red" onClick={handleCancel} className="mt-4 text-sm px-4 py-2">
            CANCEL
          </ArcadeButton>
        </div>
      </ArcadePanel>
    </div>
  );
};

export default CreateMatchPage;

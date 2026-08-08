import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArcadeText from '../components/arcade/ArcadeText';
import ArcadePanel from '../components/arcade/ArcadePanel';
import ArcadeButton from '../components/arcade/ArcadeButton';
import useMatchStore from '../store/useMatchStore';

const JoinMatchPage = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const { initMatch, status } = useMatchStore();

  const handleJoin = (e) => {
    e.preventDefault();
    if (code.length === 6) {
      initMatch(code, false);
      navigate('/lobby'); 
    }
  };

  useEffect(() => {
    if (status === 'starting') {
      navigate('/lobby');
    }
  }, [status, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-black/50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.05)_0%,transparent_60%)] pointer-events-none"></div>
      
      <ArcadePanel color="pink" className="w-full max-w-md text-center z-10 flex flex-col items-center gap-8">
        <ArcadeText as="h1" color="pink" glow className="text-4xl">JOIN MATCH</ArcadeText>
        
        <form onSubmit={handleJoin} className="flex flex-col items-center gap-8 w-full">
          <div className="flex flex-col items-center gap-4 w-full">
            <ArcadeText color="white" className="text-xl">ENTER MATCH CODE</ArcadeText>
            
            <div className="relative w-full max-w-[280px]">
              <input 
                type="text" 
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full bg-black/50 border-2 border-[var(--color-neon-pink)] px-4 py-4 text-center font-[family-name:var(--font-arcade)] text-4xl tracking-[0.25em] pl-[0.25em] text-[var(--color-neon-pink)] outline-none focus:shadow-[0_0_15px_rgba(255,0,127,0.5),inset_0_0_10px_rgba(255,0,127,0.3)] transition-shadow uppercase"
                placeholder="------"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-4 w-full px-4">
            <ArcadeButton type="submit" color="pink" className="w-full" onClick={handleJoin}>
              JOIN MATCH
            </ArcadeButton>
            
            <ArcadeButton type="button" color="cyan" onClick={() => navigate('/')} className="w-full text-sm">
              BACK TO MENU
            </ArcadeButton>
          </div>
        </form>
      </ArcadePanel>
    </div>
  );
};

export default JoinMatchPage;

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import ArcadeText from '../components/arcade/ArcadeText';
import ArcadeButton from '../components/arcade/ArcadeButton';
import { supabase } from '../lib/supabase';
import useMatchStore from '../store/useMatchStore';
import useUserStore from '../store/useUserStore';

const MatchResultPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const containerRef = useRef(null);
  
  const { playerName } = useUserStore();

  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Fallback to mock data if accessed directly for testing
  const matchData = state || {
    isWinner: true,
    wpm: 94,
    accuracy: 98,
    maxCombo: 42
  };
  const { isWinner, wpm, accuracy, maxCombo, isDraw } = matchData;

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      if (isWinner && !isDraw && matchData.mode !== 'solo') {
         // Intense Victory Animation
         tl.fromTo(".result-title-text", 
             { scale: 3, opacity: 0, rotation: -5 },
             { scale: 1, opacity: 1, rotation: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" }
           )
           .fromTo(".result-subtitle",
             { opacity: 0, y: -20 },
             { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
             "-=0.4"
           )
           .fromTo(".stat-card", 
             { x: -50, opacity: 0 }, 
             { x: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: "back.out(1.5)" },
             "-=0.2"
           )
           .fromTo(".result-btns", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, "-=0.2");
      } else {
         // Standard Animation
         tl.from(".result-title", { scale: 0, opacity: 0, duration: 0.8, ease: "back.out(1.5)" })
           .from(".stat-card", { y: 20, opacity: 0, duration: 0.5, stagger: 0.1 }, "+=0.2")
           .from(".result-btns", { opacity: 0, duration: 0.5 }, "+=0.2");
      }
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  const handleSave = async () => {
    if (!playerName || playerName.trim().length === 0) return;
    
    setIsSaving(true);
    setSaveError(null);

    // Check if name already exists
    const { data: existingUsers, error: queryError } = await supabase
      .from('leaderboard')
      .select('name')
      .eq('name', playerName);

    if (queryError) {
      console.error("Error checking name:", queryError);
      setSaveError("ERROR VERIFYING NAME.");
      setIsSaving(false);
      return;
    }

    if (existingUsers && existingUsers.length > 0) {
      setSaveError("INITIALS ALREADY TAKEN.");
      setIsSaving(false);
      return;
    }
    
    const { error } = await supabase
      .from('leaderboard')
      .insert({
        name: playerName,
        wpm,
        accuracy,
        max_combo: maxCombo
      });
      
    setIsSaving(false);
    
    if (error) {
      console.error("Error saving score:", error);
      setSaveError("FAILED TO SAVE.");
    } else {
      setSubmitted(true);
      setTimeout(() => navigate('/leaderboard'), 1000);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center bg-black/90 relative overflow-hidden">
      {/* Mock Particles */}
      {isWinner && !isDraw && (
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50 pointer-events-none"></div>
      )}

      <div className="z-10 flex flex-col items-center text-center gap-8">
        <div className="result-title flex flex-col items-center gap-4">
          <ArcadeText as="h1" color={matchData.mode === 'solo' ? 'cyan' : (isDraw ? 'yellow' : (isWinner ? 'cyan' : 'red'))} glow className="result-title-text text-6xl md:text-8xl">
            {matchData.mode === 'solo' ? 'COMPLETE!' : (isDraw ? 'DRAW!' : (isWinner ? 'VICTORY!' : 'DEFEAT!'))}
          </ArcadeText>
          <ArcadeText color="white" className="result-subtitle text-2xl tracking-widest">
            {matchData.mode === 'solo' 
              ? 'PRACTICE SESSION FINISHED' 
              : (isDraw ? "IT'S A TIE!" : (isWinner ? (matchData.surrendered ? 'OPPONENT SURRENDERED' : (submitted ? `${playerName || 'PLAYER'} WINS` : `${playerName || 'PLAYER'} WINS`)) : 'YOU LOSE!'))}
          </ArcadeText>
        </div>

        <div className="result-stats flex flex-col gap-4 my-8">
          <div className="stat-card"><ArcadeText color={isWinner && !isDraw ? 'green' : 'white'} glow className="text-3xl">{wpm} WPM</ArcadeText></div>
          <div className="stat-card"><ArcadeText color={isWinner && !isDraw ? 'green' : 'white'} glow className="text-3xl">{accuracy}% ACCURACY</ArcadeText></div>
          <div className="stat-card"><ArcadeText color="yellow" glow className="text-3xl">MAX COMBO ×{maxCombo}</ArcadeText></div>
        </div>

        <div className="flex flex-col items-stretch max-w-fit mx-auto mt-2">
          {isWinner && !isDraw && matchData.mode !== 'solo' && !submitted && (
            <div className="flex flex-col items-center gap-4 mb-8">
              <ArcadeButton color="cyan" className="py-3 px-12 flex items-center justify-center shrink-0" onClick={handleSave} disabled={isSaving || !playerName}>
                {isSaving ? 'SAVING...' : 'SAVE TO LEADERBOARD'}
              </ArcadeButton>
              {saveError && <div className="text-[var(--color-neon-red)] mt-2 font-[family-name:var(--font-arcade)]">{saveError}</div>}
            </div>
          )}

          {(!isWinner || isDraw || matchData.mode === 'solo' || submitted) && (
            <div className="flex justify-center mb-8">
              <ArcadeText color="pink" className="text-xl">KEEP TRAINING!</ArcadeText>
            </div>
          )}

          <div className="result-btns flex flex-wrap justify-center gap-4 md:gap-6 mt-4">
            <ArcadeButton color="cyan" className="whitespace-nowrap" onClick={() => {
              if (matchData.mode === 'solo') {
                navigate('/practice');
              } else {
                useMatchStore.getState().resetMatch();
                navigate('/battle');
              }
            }} disabled={isSaving}>
              PLAY AGAIN
            </ArcadeButton>
            {matchData.mode !== 'solo' && (
              <>
                <ArcadeButton color="pink" className="whitespace-nowrap" onClick={() => {
                  const { isHost, leaveMatch } = useMatchStore.getState();
                  leaveMatch();
                  navigate(isHost ? '/create' : '/join');
                }} disabled={isSaving}>
                  NEW MATCH
                </ArcadeButton>
                <ArcadeButton color="purple" className="whitespace-nowrap" onClick={() => navigate('/leaderboard')} disabled={isSaving}>
                  LEADERBOARD
                </ArcadeButton>
              </>
            )}
            <ArcadeButton color="white" className="whitespace-nowrap text-white border-white hover:bg-white/10 text-shadow-none shadow-none text-glow-none border-glow-none" onClick={() => {
              useMatchStore.getState().leaveMatch();
              navigate('/');
            }} disabled={isSaving}>
              MAIN MENU
            </ArcadeButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchResultPage;

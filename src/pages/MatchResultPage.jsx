import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import ArcadeText from '../components/arcade/ArcadeText';
import ArcadeButton from '../components/arcade/ArcadeButton';
import { supabase } from '../lib/supabase';
import useMatchStore from '../store/useMatchStore';

const MatchResultPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const containerRef = useRef(null);

  const [playerName, setPlayerName] = useState('');
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
  const { isWinner, wpm, accuracy, maxCombo } = matchData;

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      tl.from(".result-title", { scale: 0, opacity: 0, duration: 0.8, ease: "back.out(1.5)" })
        .from(".result-stats", { y: 20, opacity: 0, duration: 0.5 }, "+=0.2")
        .from(".result-btns", { opacity: 0, duration: 0.5 }, "+=0.2");
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
      {isWinner && (
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50"></div>
      )}

      <div className="z-10 flex flex-col items-center text-center gap-8">
        <div className="result-title flex flex-col items-center gap-4">
          <ArcadeText as="h1" color={matchData.mode === 'solo' ? 'cyan' : (isWinner ? 'cyan' : 'red')} glow className="text-6xl md:text-8xl">
            {matchData.mode === 'solo' ? 'COMPLETE!' : (isWinner ? 'VICTORY!' : 'DEFEAT!')}
          </ArcadeText>
          <ArcadeText color="white" className="text-2xl tracking-widest">
            {matchData.mode === 'solo' 
              ? 'PRACTICE SESSION FINISHED' 
              : (isWinner ? (matchData.surrendered ? 'OPPONENT SURRENDERED' : (submitted ? `${playerName || 'PLAYER 1'} WINS` : 'PLAYER 1 WINS')) : 'YOU LOSE!')}
          </ArcadeText>
        </div>

        <div className="result-stats flex flex-col gap-4 my-8">
          <ArcadeText color={isWinner ? 'green' : 'white'} glow className="text-3xl">{wpm} WPM</ArcadeText>
          <ArcadeText color={isWinner ? 'green' : 'white'} glow className="text-3xl">{accuracy}% ACCURACY</ArcadeText>
          <ArcadeText color="yellow" glow className="text-3xl">MAX COMBO ×{maxCombo}</ArcadeText>
        </div>

        <div className="flex flex-col items-stretch max-w-fit mx-auto mt-2">
          {isWinner && matchData.mode !== 'solo' && !submitted && (
            <div className="flex flex-col items-center gap-4 mb-8">
              <ArcadeText color="cyan" className="text-sm tracking-widest">ENTER INITIALS FOR LEADERBOARD</ArcadeText>
              <div className="flex flex-col sm:flex-row items-stretch gap-6 w-full">
                <input 
                  type="text" 
                  maxLength={5}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                  className="bg-black/80 border-2 border-[var(--color-neon-cyan)] rounded text-[var(--color-neon-cyan)] px-4 py-3 text-3xl font-[inherit] uppercase text-center outline-none focus:shadow-[0_0_20px_var(--color-neon-cyan)] transition-shadow flex-grow min-w-0"
                  placeholder="AAAAA"
                  autoFocus
                  disabled={isSaving}
                />
                <ArcadeButton color="cyan" className="py-3 px-8 flex items-center justify-center shrink-0" onClick={handleSave} disabled={isSaving || !playerName}>
                  {isSaving ? 'SAVING...' : 'SAVE'}
                </ArcadeButton>
              </div>
              {saveError && <div className="text-[var(--color-neon-red)] mt-2 font-[family-name:var(--font-arcade)]">{saveError}</div>}
            </div>
          )}

          {(!isWinner || matchData.mode === 'solo' || submitted) && (
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

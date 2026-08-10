import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { QrCode, X, Download } from 'lucide-react';
import ArcadeText from '../components/arcade/ArcadeText';
import ArcadeButton from '../components/arcade/ArcadeButton';
import { supabase } from '../lib/supabase';
import useMatchStore from '../store/useMatchStore';
import useUserStore from '../store/useUserStore';
import BoothTicketCard from '../components/battle/BoothTicketCard';

const MatchResultPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const containerRef = useRef(null);
  
  const { playerName } = useUserStore();
  const { status, leaveMatch, channel } = useMatchStore();

  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const matchData = state || {
    isWinner: true,
    wpm: 25,
    accuracy: 94,
    maxCombo: 45,
    mode: 'classic_booth',
    myPoints: 3,
    opponentPoints: 1
  };

  const { isWinner, wpm, accuracy, maxCombo, isDraw, myPoints, opponentPoints } = matchData;
  const isMatchOver = matchData.mode === 'classic_booth' ? (myPoints >= 3 || opponentPoints >= 3) : true;
  const showTicketOption = isMatchOver && isWinner && !isDraw && matchData.mode !== 'solo';

  useEffect(() => {
    if (status === 'cancelled' && matchData.mode !== 'solo') {
      leaveMatch();
      navigate('/');
    }
  }, [status, leaveMatch, navigate, matchData.mode]);

  useEffect(() => {
    // GSAP Entry Animation
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.result-title-text', { y: -50, opacity: 0, duration: 0.8, ease: 'back.out(1.7)' });
      gsap.from('.result-subtitle', { y: 20, opacity: 0, duration: 0.6, delay: 0.3 });
      gsap.from('.stat-card', { scale: 0, opacity: 0, duration: 0.5, stagger: 0.15, delay: 0.5, ease: 'back.out(1.5)' });
      gsap.from('.result-btns', { y: 30, opacity: 0, duration: 0.5, delay: 0.9 });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleSave = async (auto = false) => {
    if (submitted || isSaving) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      if (wpm === 0 && accuracy === 0) {
        setSubmitted(true);
        setIsSaving(false);
        return;
      }

      const { data: existingData, error: fetchErr } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('player_name', playerName || 'PLAYER 1')
        .single();

      if (fetchErr && fetchErr.code !== 'PGRST116') {
        throw fetchErr;
      }

      if (existingData) {
        const totalMatches = (existingData.total_matches || 0) + 1;
        const totalWins = (existingData.total_wins || 0) + (isWinner && !isDraw ? 1 : 0);
        const bestWpm = Math.max(existingData.wpm || 0, wpm);
        const maxComboVal = Math.max(existingData.max_combo || 0, maxCombo);
        const newAccuracy = Math.round(((existingData.accuracy || 100) + accuracy) / 2);

        const { error: updateErr } = await supabase
          .from('leaderboard')
          .update({
            wpm: bestWpm,
            accuracy: newAccuracy,
            max_combo: maxComboVal,
            total_matches: totalMatches,
            total_wins: totalWins,
            created_at: new Date().toISOString()
          })
          .eq('id', existingData.id);

        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('leaderboard')
          .insert([
            {
              player_name: playerName || 'PLAYER 1',
              wpm,
              accuracy,
              max_combo: maxCombo,
              total_matches: 1,
              total_wins: (isWinner && !isDraw ? 1 : 0)
            }
          ]);

        if (insertErr) throw insertErr;
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Save error:", err);
      if (!auto) setSaveError("FAILED TO SAVE SCORE. PLEASE TRY AGAIN.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasAutoSaved = useRef(false);

  useEffect(() => {
    if (matchData.mode === 'classic_booth' && isMatchOver && !hasAutoSaved.current) {
       hasAutoSaved.current = true;
       if (isWinner && !isDraw && (wpm > 0 || accuracy > 0)) {
          handleSave(true);
       }
    }
  }, [matchData.mode, isMatchOver, isWinner, isDraw, wpm, accuracy]);

  const handleExitMatch = () => {
    if (matchData.mode !== 'solo' && channel) {
      channel.send({
        type: 'broadcast',
        event: 'match_status',
        payload: { status: 'cancelled' }
      });
    }
    leaveMatch();
    navigate('/');
  };

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center bg-black/90 relative overflow-x-hidden p-4">
      {/* Background Particles */}
      {isWinner && !isDraw && isMatchOver && (
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50 pointer-events-none"></div>
      )}

      <div className="z-10 flex flex-col items-center text-center gap-6 my-auto max-w-4xl w-full">
        {/* Title Section */}
        <div className="result-title flex flex-col items-center gap-4">
          <ArcadeText as="h1" color={matchData.mode === 'solo' ? 'cyan' : (isDraw ? 'yellow' : (isWinner ? 'cyan' : 'red'))} glow className="result-title-text text-5xl md:text-7xl">
            {!isMatchOver ? (isWinner ? 'ROUND WON!' : (isDraw ? 'ROUND DRAW!' : 'ROUND LOST!')) : (matchData.mode === 'solo' ? 'COMPLETE!' : (isDraw ? 'DRAW!' : (isWinner ? 'VICTORY!' : 'DEFEAT!')))}
          </ArcadeText>
          <ArcadeText color="white" className="result-subtitle text-xl md:text-2xl tracking-widest flex flex-col items-center gap-2">
            <span>
              {!isMatchOver 
                ? `ROUND ${myPoints + opponentPoints || 1} OVER`
                : (matchData.mode === 'solo' 
                ? 'PRACTICE SESSION FINISHED' 
                : (isDraw ? "IT'S A TIE!" : (isWinner ? (matchData.surrendered ? 'OPPONENT SURRENDERED' : (submitted ? 'SCORE SAVED TO LEADERBOARD' : `${playerName || 'PLAYER'} WINS`)) : 'YOU LOSE!')))}
            </span>
            {matchData.mode === 'classic_booth' && (
              <span className="text-yellow-400 text-2xl md:text-3xl mt-1 font-bold filter drop-shadow-[0_0_8px_rgba(255,251,0,0.8)]">
                SCORE: {myPoints || 0} - {opponentPoints || 0}
              </span>
            )}
          </ArcadeText>
        </div>

        {/* Stats Row */}
        <div className="result-stats flex flex-wrap justify-center gap-4 my-4">
          <div className="stat-card px-6 py-3 border border-white/10 bg-white/5 rounded-lg"><ArcadeText color={isWinner && !isDraw ? 'green' : 'white'} glow className="text-2xl md:text-3xl">{wpm} WPM</ArcadeText></div>
          <div className="stat-card px-6 py-3 border border-white/10 bg-white/5 rounded-lg"><ArcadeText color={isWinner && !isDraw ? 'green' : 'white'} glow className="text-2xl md:text-3xl">{accuracy}% ACCURACY</ArcadeText></div>
          <div className="stat-card px-6 py-3 border border-white/10 bg-white/5 rounded-lg"><ArcadeText color="yellow" glow className="text-2xl md:text-3xl">MAX COMBO ×{maxCombo}</ArcadeText></div>
        </div>

        {/* ── WINNER-ONLY TICKET & AUTO DOWNLOAD PANEL ── */}
        {showTicketOption && (
          <div className="flex flex-col items-center gap-3 my-2 bg-[#0c0c16] border-2 border-[var(--color-neon-cyan)] p-6 rounded-2xl shadow-[0_0_25px_rgba(0,243,255,0.25)] max-w-md w-full">
            <span className="text-yellow-400 font-bold tracking-widest text-xs uppercase flex items-center gap-1.5 font-mono">
              ⚡ BOOTH WINNER TICKET ⚡
            </span>
            <span className="text-white/70 text-xs text-center leading-relaxed">
              Your official VIP Competition Ticket PNG has been automatically downloaded to your device!
            </span>

            <div className="flex flex-wrap gap-3 justify-center mt-2 w-full">
              <ArcadeButton 
                color="cyan" 
                className="py-3 px-6 flex items-center justify-center gap-2 text-xs w-full" 
                onClick={() => setShowTicketModal(true)}
              >
                <QrCode size={16} /> VIEW QR CODE & TICKET PREVIEW
              </ArcadeButton>
            </div>

            {/* Hidden/Mounted Ticket Instance for Auto-Download */}
            <div className="hidden">
              <BoothTicketCard
                playerName={playerName || 'PLAYER 1'}
                opponentName={matchData.opponentName || 'OPPONENT'}
                winnerName={playerName || 'PLAYER 1'}
                isDraw={false}
                myPoints={myPoints}
                opponentPoints={opponentPoints}
                wpm={wpm}
                accuracy={accuracy}
                maxCombo={maxCombo}
                matchCode={matchData.matchCode || 'BOOTH-VIP'}
                autoDownload={true}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col items-stretch max-w-fit mx-auto mt-2">
          {/* SAVE TO LEADERBOARD: only for non-booth, or final booth victory */}
          {isWinner && !isDraw && matchData.mode !== 'solo' && !submitted && (wpm > 0 || accuracy > 0) && (matchData.mode !== 'classic_booth' || isMatchOver) && (
            <div className="flex flex-col items-center gap-4 mb-4">
              <ArcadeButton color="cyan" className="py-3 px-12 flex items-center justify-center shrink-0" onClick={() => handleSave(false)} disabled={isSaving || !playerName}>
                {isSaving ? 'SAVING...' : 'SAVE TO LEADERBOARD'}
              </ArcadeButton>
              {saveError && <div className="text-[var(--color-neon-red)] mt-2 font-[family-name:var(--font-arcade)]">{saveError}</div>}
            </div>
          )}

          {(!isWinner || isDraw || matchData.mode === 'solo' || submitted || (wpm === 0 && accuracy === 0)) && isMatchOver && (
            <div className="flex justify-center mb-4">
              <ArcadeText color="pink" className="text-lg">KEEP TRAINING!</ArcadeText>
            </div>
          )}

          <div className="result-btns flex flex-wrap justify-center gap-4 md:gap-6 mt-2">
            {/* BOOTH: intermediate round — NEXT ROUND + SURRENDER only */}
            {matchData.mode === 'classic_booth' && !isMatchOver && (
              <>
                <ArcadeButton color="cyan" className="whitespace-nowrap" onClick={() => {
                  useMatchStore.getState().resetRound();
                  navigate('/battle');
                }} disabled={isSaving}>
                  NEXT ROUND
                </ArcadeButton>
                <ArcadeButton color="pink" className="whitespace-nowrap" onClick={handleExitMatch} disabled={isSaving}>
                  SURRENDER
                </ArcadeButton>
              </>
            )}

            {/* NON-BOOTH: Play Again / New Match / Leaderboard */}
            {matchData.mode !== 'classic_booth' && (
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
            )}
            {matchData.mode !== 'solo' && matchData.mode !== 'classic_booth' && (
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

            {/* EXPLICIT EXIT MATCH / MAIN MENU BUTTON */}
            {(matchData.mode !== 'classic_booth' || isMatchOver) && (
              <ArcadeButton 
                color="white" 
                className="whitespace-nowrap text-white border-white hover:bg-white/10" 
                onClick={handleExitMatch} 
                disabled={isSaving}
              >
                EXIT MATCH
              </ArcadeButton>
            )}
          </div>
        </div>
      </div>

      {/* ── TICKET & QR CODE PREVIEW MODAL ── */}
      {showTicketModal && (
        <div className="fixed inset-0 z-[500] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg flex flex-col items-center gap-4 my-auto">
            <button 
              onClick={() => setShowTicketModal(false)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white flex items-center gap-1 font-mono text-xs bg-white/10 px-3 py-1.5 rounded-full border border-white/20"
            >
              <X size={16} /> CLOSE PREVIEW
            </button>

            <BoothTicketCard
              playerName={playerName || 'PLAYER 1'}
              opponentName={matchData.opponentName || 'OPPONENT'}
              winnerName={playerName || 'PLAYER 1'}
              isDraw={false}
              myPoints={myPoints}
              opponentPoints={opponentPoints}
              wpm={wpm}
              accuracy={accuracy}
              maxCombo={maxCombo}
              matchCode={matchData.matchCode || 'BOOTH-VIP'}
              autoDownload={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchResultPage;

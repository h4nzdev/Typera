import React, { useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { Download, Trophy, Home, CheckCircle2 } from 'lucide-react';
import ArcadeText from '../components/arcade/ArcadeText';
import ArcadeButton from '../components/arcade/ArcadeButton';

const PublicTicketPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ticketRef = useRef(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const playerName = searchParams.get('p1') || 'PLAYER 1';
  const opponentName = searchParams.get('p2') || 'PLAYER 2';
  const winnerName = searchParams.get('w') || 'PLAYER 1';
  const scoreStr = searchParams.get('s') || '3 - 0';
  const wpm = searchParams.get('wpm') || '0';
  const accuracy = searchParams.get('acc') || '100';
  const maxCombo = searchParams.get('c') || '0';
  const dateStr = searchParams.get('d') || new Date().toLocaleDateString();
  const matchCode = searchParams.get('code') || 'BOOTH-VIP';

  const isDraw = winnerName === 'DRAW' || winnerName === 'DRAW (TIE)';

  const handleDownload = async () => {
    if (!ticketRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
      const dataUrl = await toPng(ticketRef.current, { 
        quality: 0.95, 
        cacheBust: true,
        pixelRatio: 2
      });
      const link = document.createElement('a');
      link.download = `type-battle-ticket-${playerName.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to generate ticket:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white flex flex-col items-center justify-center p-4 relative overflow-y-auto select-none"
      style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(10,0,21,0.6) 0%, rgba(5,5,10,0.95) 100%)' }}>
      
      {/* Background neon grid */}
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{
        backgroundImage: `linear-gradient(rgba(0,243,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '36px 36px',
      }} />

      <div className="z-10 w-full max-w-md flex flex-col items-center gap-6 my-8">
        {/* Title */}
        <div className="flex flex-col items-center text-center gap-1">
          <ArcadeText as="h1" color="cyan" glow className="text-3xl md:text-4xl">
            TYPE//BATTLE TICKET
          </ArcadeText>
          <span className="text-xs text-yellow-400 tracking-widest uppercase font-mono">
            OFFICIAL BOOTH COMPETITION RECORD
          </span>
        </div>

        {/* ── THE PRINTED TICKET CONTAINER ── */}
        <div 
          ref={ticketRef} 
          className="w-full bg-[#0c0c14] border-4 border-[var(--color-neon-cyan)] p-6 rounded-2xl relative shadow-[0_0_40px_rgba(0,243,255,0.4)] text-white select-none overflow-hidden font-mono"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(0,243,255,0.15) 0%, transparent 75%)'
          }}
        >
          {/* Top Sawtooth Accent */}
          <div className="absolute top-0 inset-x-0 h-2 bg-black border-b border-[var(--color-neon-cyan)]/30 flex justify-between px-2">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="w-2 h-2 bg-[#0c0c14] rotate-45 transform -translate-y-1 border border-cyan-500/20" />
            ))}
          </div>

          {/* Header (Guaranteed No-Wrap Single Line Layout) */}
          <div className="flex flex-col items-center text-center border-b-2 border-dashed border-cyan-500/40 pb-4 pt-3 gap-1.5">
            <div className="flex items-center justify-center text-[var(--color-neon-cyan)] font-[family-name:var(--font-arcade)] text-base sm:text-lg tracking-normal text-glow-cyan text-center whitespace-nowrap overflow-hidden">
              <span className="whitespace-nowrap inline-block">⚡ TYPE//BATTLE VIP PASS ⚡</span>
            </div>
            <span className="text-[11px] text-white/60 tracking-widest uppercase leading-tight whitespace-nowrap block mt-0.5">AUTHENTICATED BOOTH MATCH RECORD</span>
            <span className="text-[10px] text-yellow-400 font-bold tracking-wider whitespace-nowrap block">{dateStr} | {matchCode}</span>
          </div>

          {/* Match Players & Winner */}
          <div className="my-5 flex flex-col items-center gap-3 border-b-2 border-dashed border-cyan-500/40 pb-5">
            <div className="flex items-center justify-between w-full px-2 text-base font-bold">
              <span className="text-cyan-400 truncate max-w-[130px] whitespace-nowrap">{playerName}</span>
              <span className="text-yellow-400 text-xs italic whitespace-nowrap">VS</span>
              <span className="text-pink-400 truncate max-w-[130px] text-right whitespace-nowrap">{opponentName}</span>
            </div>

            <div className="bg-black/90 border-2 border-yellow-400 rounded-xl px-8 py-3 flex flex-col items-center shadow-[0_0_20px_rgba(255,251,0,0.25)] my-1 w-full">
              <span className="text-xs text-yellow-400 font-bold tracking-widest uppercase flex items-center gap-1 whitespace-nowrap">
                <Trophy size={14} /> {isDraw ? 'MATCH RESULT' : 'BOOTH CHAMPION'}
              </span>
              <span className="text-3xl font-black tracking-widest text-white text-glow-green uppercase mt-1 whitespace-nowrap">
                {isDraw ? 'DRAW (TIE)' : winnerName}
              </span>
              <span className="text-base font-extrabold text-yellow-300 tracking-wider mt-1 whitespace-nowrap">
                SCORE: {scoreStr}
              </span>
            </div>
          </div>

          {/* Performance Breakdown */}
          <div className="grid grid-cols-3 gap-2 text-center border-b-2 border-dashed border-cyan-500/40 pb-5">
            <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 flex flex-col items-center">
              <span className="text-[10px] text-white/50 tracking-widest uppercase whitespace-nowrap">SPEED</span>
              <span className="text-xl font-extrabold text-green-400 whitespace-nowrap">{wpm} <span className="text-[10px]">WPM</span></span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 flex flex-col items-center">
              <span className="text-[10px] text-white/50 tracking-widest uppercase whitespace-nowrap">ACCURACY</span>
              <span className="text-xl font-extrabold text-cyan-400 whitespace-nowrap">{accuracy}%</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 flex flex-col items-center">
              <span className="text-[10px] text-white/50 tracking-widest uppercase whitespace-nowrap">COMBO</span>
              <span className="text-xl font-extrabold text-yellow-400 whitespace-nowrap">×{maxCombo}</span>
            </div>
          </div>

          {/* Barcode */}
          <div className="mt-5 flex flex-col items-center gap-1">
            <div className="h-8 w-full bg-[repeating-linear-gradient(90deg,#fff,#fff_2px,#000_2px,#000_6px)] opacity-70 rounded" />
            <span className="text-[9px] text-white/40 tracking-[0.5em] font-mono whitespace-nowrap">VERIFIED ARCHIVAL RECEIPT</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-3 w-full">
          <ArcadeButton 
            color="cyan" 
            onClick={handleDownload} 
            disabled={isDownloading}
            className="w-full py-4 text-center justify-center flex items-center gap-2"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 size={20} /> TICKET SAVED TO DEVICE!
              </>
            ) : (
              <>
                <Download size={20} /> {isDownloading ? 'SAVING TICKET...' : 'DOWNLOAD TICKET PHOTO TO DEVICE'}
              </>
            )}
          </ArcadeButton>
          
          <ArcadeButton 
            color="white" 
            onClick={() => navigate('/')} 
            className="w-full py-3 text-center justify-center flex items-center gap-2 border-white/30 text-white/70 hover:text-white"
          >
            <Home size={18} /> RETURN TO MAIN MENU
          </ArcadeButton>
        </div>
      </div>
    </div>
  );
};

export default PublicTicketPage;

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import { Download, QrCode, CheckCircle2 } from 'lucide-react';
import ArcadeButton from '../arcade/ArcadeButton';

const BoothTicketCard = ({ 
  playerName = 'PLAYER 1', 
  opponentName = 'PLAYER 2', 
  winnerName = 'PLAYER 1',
  isDraw = false,
  myPoints = 3, 
  opponentPoints = 1,
  wpm = 0,
  accuracy = 100,
  maxCombo = 0,
  matchCode = 'BOOTH-1',
  autoDownload = false
}) => {
  const ticketRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const hasAutoDownloaded = useRef(false);

  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const scoreStr = `${myPoints} - ${opponentPoints}`;
  const publicTicketUrl = `${window.location.origin}/ticket?p1=${encodeURIComponent(playerName)}&p2=${encodeURIComponent(opponentName)}&w=${encodeURIComponent(isDraw ? 'DRAW' : winnerName)}&s=${encodeURIComponent(scoreStr)}&wpm=${wpm}&acc=${accuracy}&c=${maxCombo}&d=${encodeURIComponent(dateStr)}&code=${encodeURIComponent(matchCode)}`;

  useEffect(() => {
    QRCode.toDataURL(publicTicketUrl, {
      width: 250,
      margin: 1,
      color: {
        dark: '#05050a',
        light: '#ffffff'
      }
    })
    .then(url => setQrDataUrl(url))
    .catch(err => console.error("QR Code Error:", err));
  }, [publicTicketUrl]);

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
      console.error("Failed to generate ticket image:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (autoDownload && qrDataUrl && !hasAutoDownloaded.current) {
      hasAutoDownloaded.current = true;
      setTimeout(() => {
        handleDownload();
      }, 700);
    }
  }, [autoDownload, qrDataUrl]);

  return (
    <div className="flex flex-col items-center gap-6 my-4 w-full max-w-md mx-auto">
      {/* ── THE PRINTED TICKET CONTAINER ── */}
      <div 
        ref={ticketRef} 
        className="w-full bg-[#0c0c14] border-4 border-[var(--color-neon-cyan)] p-6 rounded-2xl relative shadow-[0_0_30px_rgba(0,243,255,0.3)] text-white select-none overflow-hidden font-mono"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(0,243,255,0.1) 0%, transparent 75%)'
        }}
      >
        {/* Ticket Top Cutout Accent */}
        <div className="absolute top-0 inset-x-0 h-2 bg-black border-b border-[var(--color-neon-cyan)]/30 flex justify-between px-2">
          {[...Array(16)].map((_, i) => (
            <div key={i} className="w-2 h-2 bg-[#0c0c14] rotate-45 transform -translate-y-1 border border-cyan-500/20" />
          ))}
        </div>

        {/* Ticket Header (Guaranteed No-Wrap Single Line Layout) */}
        <div className="flex flex-col items-center text-center border-b-2 border-dashed border-cyan-500/40 pb-4 pt-3 gap-1.5">
          <div className="flex items-center justify-center text-[var(--color-neon-cyan)] font-[family-name:var(--font-arcade)] text-base sm:text-lg tracking-normal text-glow-cyan text-center whitespace-nowrap overflow-hidden">
            <span className="whitespace-nowrap inline-block">⚡ TYPE//BATTLE VIP PASS ⚡</span>
          </div>
          <span className="text-[10px] text-white/60 tracking-widest uppercase leading-tight whitespace-nowrap block mt-0.5">OFFICIAL BOOTH COMPETITION TICKET</span>
          <span className="text-[9px] text-yellow-400/80 font-bold tracking-wider whitespace-nowrap block">{dateStr} | {matchCode}</span>
        </div>

        {/* Match Players & Winner Section */}
        <div className="my-4 flex flex-col items-center gap-2 border-b-2 border-dashed border-cyan-500/40 pb-4">
          <div className="flex items-center justify-between w-full px-2 text-sm font-bold">
            <span className="text-cyan-400 truncate max-w-[120px] whitespace-nowrap">{playerName}</span>
            <span className="text-yellow-400 text-xs italic whitespace-nowrap">VS</span>
            <span className="text-pink-400 truncate max-w-[120px] text-right whitespace-nowrap">{opponentName}</span>
          </div>

          <div className="bg-black/80 border border-yellow-400/50 rounded-lg px-6 py-2 flex flex-col items-center shadow-[0_0_15px_rgba(255,251,0,0.15)] my-1 w-full">
            <span className="text-[10px] text-yellow-400 font-bold tracking-widest uppercase whitespace-nowrap">
              {isDraw ? '🤝 MATCH RESULT' : '👑 BOOTH CHAMPION'}
            </span>
            <span className="text-2xl font-black tracking-widest text-white text-glow-green uppercase mt-0.5 whitespace-nowrap">
              {isDraw ? 'DRAW (TIE)' : winnerName}
            </span>
            <span className="text-sm font-extrabold text-yellow-300 tracking-wider whitespace-nowrap">
              SCORE: {scoreStr}
            </span>
          </div>
        </div>

        {/* Performance Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-center border-b-2 border-dashed border-cyan-500/40 pb-4">
          <div className="bg-white/5 border border-white/10 rounded p-2 flex flex-col items-center">
            <span className="text-[9px] text-white/50 tracking-widest uppercase whitespace-nowrap">SPEED</span>
            <span className="text-lg font-bold text-green-400 whitespace-nowrap">{wpm} <span className="text-[9px]">WPM</span></span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded p-2 flex flex-col items-center">
            <span className="text-[9px] text-white/50 tracking-widest uppercase whitespace-nowrap">ACCURACY</span>
            <span className="text-lg font-bold text-cyan-400 whitespace-nowrap">{accuracy}%</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded p-2 flex flex-col items-center">
            <span className="text-[9px] text-white/50 tracking-widest uppercase whitespace-nowrap">COMBO</span>
            <span className="text-lg font-bold text-yellow-400 whitespace-nowrap">×{maxCombo}</span>
          </div>
        </div>

        {/* QR Code & Mobile Download Section */}
        <div className="mt-4 flex items-center justify-between gap-4 bg-black/60 border border-white/10 rounded-xl p-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-yellow-300 font-bold tracking-widest uppercase flex items-center gap-1 whitespace-nowrap">
              <QrCode size={13} /> SCAN TO KEEP
            </span>
            <span className="text-[9px] text-white/60 leading-tight max-w-[160px]">
              Scan with phone camera to download ticket photo to your device!
            </span>
          </div>
          
          {qrDataUrl ? (
            <div className="bg-white p-1.5 rounded-lg border-2 border-cyan-400 shrink-0 shadow-[0_0_10px_rgba(0,243,255,0.4)]">
              <img src={qrDataUrl} alt="QR Code" className="w-20 h-20 object-contain" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-white/10 rounded flex items-center justify-center text-[10px] animate-pulse">
              QR CODE...
            </div>
          )}
        </div>

        {/* Decorative Barcode */}
        <div className="mt-4 flex flex-col items-center gap-1">
          <div className="h-6 w-full bg-[repeating-linear-gradient(90deg,#fff,#fff_2px,#000_2px,#000_5px)] opacity-60 rounded" />
          <span className="text-[8px] text-white/30 tracking-[0.4em] font-mono whitespace-nowrap">TYPE-BTL-BOOTH-AUTHENTICATED</span>
        </div>
      </div>

      {/* Action Button: Download PNG Ticket */}
      <div className="flex flex-col items-center gap-2">
        <ArcadeButton 
          color="cyan" 
          onClick={handleDownload} 
          disabled={isDownloading}
          className="py-3 px-8 flex items-center gap-2"
        >
          {downloadSuccess ? (
            <>
              <CheckCircle2 size={18} /> TICKET SAVED!
            </>
          ) : (
            <>
              <Download size={18} /> {isDownloading ? 'GENERATING...' : 'DOWNLOAD TICKET PHOTO'}
            </>
          )}
        </ArcadeButton>
      </div>
    </div>
  );
};

export default BoothTicketCard;

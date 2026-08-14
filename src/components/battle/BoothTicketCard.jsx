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

  const [lanIpInput, setLanIpInput] = useState(() => localStorage.getItem('booth_lan_url') || '');
  const [showLanConfig, setShowLanConfig] = useState(false);

  const getBaseUrl = () => {
    if (import.meta.env.VITE_PUBLIC_URL) return import.meta.env.VITE_PUBLIC_URL;
    const lanUrl = localStorage.getItem('booth_lan_url');
    if (lanUrl) return lanUrl.replace(/\/$/, '');
    return window.location.origin;
  };

  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const scoreStr = `${myPoints}-${opponentPoints}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const baseUrl = getBaseUrl();
  const publicTicketUrl = `${baseUrl}/ticket?p1=${encodeURIComponent(playerName)}&p2=${encodeURIComponent(opponentName)}&w=${encodeURIComponent(isDraw ? 'DRAW' : winnerName)}&s=${scoreStr}&wpm=${wpm}&acc=${accuracy}&c=${maxCombo}&t=${timestamp}&code=${matchCode}`;

  useEffect(() => {
    QRCode.toDataURL(publicTicketUrl, {
      width: 500,
      margin: 4, // ISO/IEC standard 4-module quiet zone for camera scanners
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    .then(url => setQrDataUrl(url))
    .catch(err => console.error("QR Code Error:", err));
  }, [publicTicketUrl]);

  const handleSaveLanUrl = (e) => {
    e.preventDefault();
    if (!lanIpInput.trim()) {
      localStorage.removeItem('booth_lan_url');
    } else {
      let formatted = lanIpInput.trim();
      if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
        formatted = `http://${formatted}`;
      }
      localStorage.setItem('booth_lan_url', formatted);
    }
    setShowLanConfig(false);
  };

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
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="bg-white p-2 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.5)] border-2 border-white">
                <img src={qrDataUrl} alt="QR Code" className="w-28 h-28 md:w-32 md:h-32 object-contain" />
              </div>
              <a 
                href={publicTicketUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[9px] text-cyan-400 hover:underline tracking-wider font-mono opacity-80"
              >
                🔗 OPEN TICKET LINK
              </a>
            </div>
          ) : (
            <div className="w-28 h-28 bg-white/10 rounded-xl flex items-center justify-center text-[10px] animate-pulse">
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
      <div className="flex flex-col items-center gap-3">
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

        {/* Booth WiFi Network IP Configurator (For Local Offline Booth Testing) */}
        {!showLanConfig ? (
          <button 
            type="button" 
            onClick={() => setShowLanConfig(true)}
            className="text-[10px] text-white/40 hover:text-cyan-400 font-mono tracking-wider underline cursor-pointer"
          >
            ⚙ BOOTH NETWORK QR CONFIG (ORIGIN: {baseUrl})
          </button>
        ) : (
          <form onSubmit={handleSaveLanUrl} className="flex flex-col items-center gap-2 bg-black/90 border border-yellow-400/50 p-3 rounded-xl max-w-sm w-full font-mono text-xs z-30">
            <span className="text-yellow-300 text-[10px] font-bold tracking-widest uppercase text-center">SET BOOTH LAN / NETWORK IP FOR SCANNABLE QR CODE</span>
            <input 
              type="text" 
              value={lanIpInput} 
              onChange={(e) => setLanIpInput(e.target.value)} 
              placeholder="e.g. 192.168.1.15:5173 or mybooth.com" 
              className="w-full bg-black border border-white/20 rounded px-2 py-1 text-white text-xs outline-none focus:border-cyan-400"
            />
            <div className="flex gap-2 w-full">
              <button type="submit" className="flex-1 bg-cyan-500/20 border border-cyan-400 text-cyan-300 py-1 rounded text-[10px] font-bold">SAVE IP</button>
              <button type="button" onClick={() => setShowLanConfig(false)} className="flex-1 bg-gray-800 border border-gray-600 text-gray-300 py-1 rounded text-[10px]">CANCEL</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BoothTicketCard;

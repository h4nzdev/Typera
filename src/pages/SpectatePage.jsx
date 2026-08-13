import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ArcadeText from '../components/arcade/ArcadeText';
import ArcadeButton from '../components/arcade/ArcadeButton';
import SpectatorKeyboard from '../components/battle/SpectatorKeyboard';
import DebuffBanner from '../components/battle/DebuffBanner';
import ComboBanner from '../components/battle/ComboBanner';
import PingBadge from '../components/arcade/PingBadge';
import { playSound, playVoice } from '../lib/sounds';
import { Tv, ArrowLeft, Radio, Trophy } from 'lucide-react';

const SpectatePage = () => {
  const { code: routeCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const codeParam = routeCode || searchParams.get('code') || '';
  const [inputCode, setInputCode] = useState(codeParam);
  const [matchCode, setMatchCode] = useState(codeParam.toUpperCase());

  const [channelState, setChannelState] = useState('DISCONNECTED');
  const [matchStatus, setMatchStatus] = useState('waiting');
  const [gameMode, setGameMode] = useState('race');
  const [challengeText, setChallengeText] = useState('');

  const [p1Info, setP1Info] = useState({ name: 'HOST', id: null });
  const [p2Info, setP2Info] = useState({ name: 'CHALLENGER', id: null });

  const [p1Stats, setP1Stats] = useState({
    progress: 0, wpm: 0, accuracy: 100, combo: 0, hp: 1000, typed: '', lastKey: null, activeDebuff: null
  });
  const [p2Stats, setP2Stats] = useState({
    progress: 0, wpm: 0, accuracy: 100, combo: 0, hp: 1000, typed: '', lastKey: null, activeDebuff: null
  });

  const [winnerId, setWinnerId] = useState(null);
  const [tickerMessage, setTickerMessage] = useState('WAITING FOR PLAYERS...');
  const [p1BannerDebuff, setP1BannerDebuff] = useState(null);
  const [p2BannerDebuff, setP2BannerDebuff] = useState(null);
  const [p1ComboTrigger, setP1ComboTrigger] = useState(0);
  const [p2ComboTrigger, setP2ComboTrigger] = useState(0);

  const channelRef = useRef(null);

  useEffect(() => {
    if (!matchCode) return;

    setChannelState('CONNECTING');

    const channel = supabase.channel(`match:${matchCode}`, {
      config: { broadcast: { self: false, ack: false } }
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        let host = null;
        let challenger = null;

        for (const [key, presences] of Object.entries(state)) {
          const p = presences[0];
          if (p.isHost) {
            host = { name: p.playerName || 'HOST', id: key };
          } else {
            challenger = { name: p.playerName || 'CHALLENGER', id: key };
          }
        }

        if (host) setP1Info(host);
        if (challenger) setP2Info(challenger);
      })
      .on('broadcast', { event: 'match_setup' }, (payload) => {
        const words = payload.payload.challengeWords || [];
        const textStr = Array.isArray(words) 
          ? words.map(w => typeof w === 'string' ? w : w.word).join(' ') 
          : '';
        setChallengeText(textStr);
        setGameMode(payload.payload.gameMode || 'race');
        setMatchStatus('playing');
        setWinnerId(null);
        setTickerMessage(`ROUND ${payload.payload.roundNumber || 1} IN PROGRESS!`);
      })
      .on('broadcast', { event: 'match_status' }, (payload) => {
        if (payload.payload.status) setMatchStatus(payload.payload.status);
      })
      .on('broadcast', { event: 'round_winner' }, (payload) => {
        const wId = payload.payload.id;
        setWinnerId(wId);
        setMatchStatus('finished');
        playVoice('you-win');
      })
      .on('broadcast', { event: 'stats_update' }, (payload) => {
        const id = payload.payload.id;
        const stats = payload.payload.stats || {};

        if (id === p1Info.id || payload.payload.isHost) {
          setP1Stats(prev => ({ ...prev, ...stats }));
          if (stats.combo > 0 && stats.combo % 50 === 0 && stats.combo !== p1Stats.combo) {
            setP1ComboTrigger(Date.now());
            setTickerMessage(`🔥 ${p1Info.name} REACHED ${stats.combo}X COMBO!`);
          }
        } else {
          setP2Stats(prev => ({ ...prev, ...stats }));
          if (stats.combo > 0 && stats.combo % 50 === 0 && stats.combo !== p2Stats.combo) {
            setP2ComboTrigger(Date.now());
            setTickerMessage(`🔥 ${p2Info.name} REACHED ${stats.combo}X COMBO!`);
          }
        }
      })
      .on('broadcast', { event: 'match_powerup' }, (payload) => {
        const type = payload.payload.type;
        const targetId = payload.payload.targetId;

        playVoice(type);

        if (targetId === p1Info.id) {
          setP1BannerDebuff({ type, endsAt: Date.now() + 2000 });
          setTickerMessage(`⚡ ${p1Info.name} RECEIVED ${type.toUpperCase()} DEBUFF!`);
        } else {
          setP2BannerDebuff({ type, endsAt: Date.now() + 2000 });
          setTickerMessage(`⚡ ${p2Info.name} RECEIVED ${type.toUpperCase()} DEBUFF!`);
        }
      })
      .subscribe((status) => {
        setChannelState(status === 'SUBSCRIBED' ? 'LIVE' : status);
      });

    return () => {
      channel.unsubscribe();
    };
  }, [matchCode, p1Info.id]);

  // Automatic winner evaluation on 100% progress
  useEffect(() => {
    if (p1Stats.progress >= 100 && !winnerId) {
      setWinnerId(p1Info.id || 'p1');
      setMatchStatus('finished');
      playVoice('you-win');
    } else if (p2Stats.progress >= 100 && !winnerId) {
      setWinnerId(p2Info.id || 'p2');
      setMatchStatus('finished');
      playVoice('you-win');
    }
  }, [p1Stats.progress, p2Stats.progress, p1Info.id, p2Info.id, winnerId]);

  const handleJoinSpectate = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const clean = inputCode.trim().toUpperCase();
    setMatchCode(clean);
    navigate(`/spectate/${clean}`);
  };

  const renderTypingStream = (typedText = '', color = 'cyan') => {
    if (!challengeText) {
      return <div className="text-white/30 italic text-center py-6 text-xs">Waiting for match text...</div>;
    }

    const chars = challengeText.split('');
    const typedArr = typedText.split('');

    return (
      <div className="font-mono text-xs md:text-sm leading-relaxed p-4 bg-black/90 border border-white/10 rounded-xl max-h-48 overflow-y-auto font-bold tracking-wide select-none">
        {chars.map((char, idx) => {
          let charColor = 'text-white/30';
          const isCursor = idx === typedArr.length;

          if (idx < typedArr.length) {
            if (typedArr[idx] === char) {
              charColor = color === 'cyan' ? 'text-[var(--color-neon-cyan)] text-glow-cyan' : 'text-[var(--color-neon-pink)] text-glow-pink';
            } else {
              charColor = 'text-red-500 bg-red-950/60 font-black';
            }
          }

          return (
            <span key={idx} className={`${charColor} ${isCursor ? 'bg-cyan-500/50 animate-pulse underline underline-offset-2' : ''}`}>
              {char}
            </span>
          );
        })}
      </div>
    );
  };

  const wpmDiff = p1Stats.wpm - p2Stats.wpm;
  const isFinished = matchStatus === 'finished' || p1Stats.progress >= 100 || p2Stats.progress >= 100;
  const isP1Winner = isFinished && (winnerId ? (winnerId === p1Info.id || winnerId === 'p1') : p1Stats.progress > p2Stats.progress);
  const isP2Winner = isFinished && (winnerId ? (winnerId === p2Info.id || winnerId === 'p2') : p2Stats.progress > p1Stats.progress);
  const isDraw = isFinished && !isP1Winner && !isP2Winner;

  return (
    <div className="min-h-screen bg-[#05050a] text-white flex flex-col justify-between p-4 relative overflow-x-hidden font-mono select-none"
      style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(10,0,21,0.6) 0%, rgba(5,5,10,0.95) 100%)' }}>
      
      {/* ── TOP HEADER SPECTATOR BAR ── */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between border-b-2 border-white/10 pb-3 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-white/60 hover:text-white flex items-center gap-1 text-xs border border-white/20 px-3 py-1.5 rounded-lg bg-white/5">
            <ArrowLeft size={14} /> MAIN MENU
          </button>
          <div className="flex items-center gap-2 bg-red-950/80 border border-red-500/60 px-3 py-1 rounded-full animate-pulse shadow-[0_0_15px_rgba(255,0,60,0.4)]">
            <Radio size={14} className="text-red-400" />
            <span className="text-xs font-extrabold text-red-400 tracking-widest font-[family-name:var(--font-arcade)]">LIVE SPECTATOR HUD</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-3 py-1 rounded">MATCH: {matchCode || '---'}</span>
          <span className="text-yellow-400 bg-yellow-950/60 border border-yellow-500/40 px-3 py-1 rounded">MODE: {gameMode.toUpperCase()}</span>
          <span className="text-green-400 bg-green-950/60 border border-green-500/40 px-3 py-1 rounded">{channelState}</span>
          <PingBadge />
        </div>
      </div>

      {/* ── BATTLE CODE MODAL PROMPT IF NO CODE ── */}
      {!matchCode ? (
        <div className="my-auto z-20 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          <form onSubmit={handleJoinSpectate} className="w-full bg-[#0c0c16] border-4 border-[var(--color-neon-cyan)] p-8 rounded-2xl flex flex-col items-center gap-6 shadow-[0_0_40px_rgba(0,243,255,0.3)]">
            <div className="flex flex-col items-center text-center gap-2">
              <Tv size={48} className="text-[var(--color-neon-cyan)] animate-pulse" />
              <ArcadeText color="cyan" glow className="text-3xl">SPECTATE BATTLE</ArcadeText>
              <span className="text-xs text-white/60">Enter active Match Code to watch the live match in real-time</span>
            </div>

            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="ENTER MATCH CODE"
              maxLength={8}
              className="w-full bg-black/90 border-2 border-cyan-400/60 rounded-xl px-4 py-3 text-center text-2xl font-black text-cyan-400 tracking-widest uppercase outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,243,255,0.5)]"
            />

            <ArcadeButton color="cyan" type="submit" className="w-full py-4 text-center justify-center text-lg">
              START SPECTATING
            </ArcadeButton>
          </form>
        </div>
      ) : (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 my-auto z-20 py-4">

          {/* ── SPECTATOR MATCH RESULT ANNOUNCEMENT BANNER ── */}
          {isFinished ? (
            <div className="flex flex-col items-center gap-3 bg-gradient-to-r from-yellow-950/90 via-black/95 to-yellow-950/90 border-2 border-yellow-400 p-5 rounded-2xl shadow-[0_0_40px_rgba(255,215,0,0.4)]">
              <div className="flex items-center gap-2 text-yellow-300 font-[family-name:var(--font-arcade)] text-xl tracking-widest">
                <span>🏆</span>
                <span>MATCH COMPLETED!</span>
                <span>🏆</span>
              </div>

              <div className="flex items-center gap-6 my-1">
                <div className={`flex flex-col items-center px-6 py-2 rounded-xl border ${isP1Winner ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'bg-black/40 border-gray-700 text-gray-400'}`}>
                  <span className="text-xs font-bold font-[family-name:var(--font-arcade)]">{isP1Winner ? '👑 WINNER' : (isDraw ? '🤝 DRAW' : '💀 LOSER')}</span>
                  <span className="text-xl font-black">{p1Info.name}</span>
                  <span className="text-xs text-white/70">{p1Stats.wpm} WPM • {p1Stats.accuracy}% ACC</span>
                </div>

                <span className="text-2xl font-black text-white/40">VS</span>

                <div className={`flex flex-col items-center px-6 py-2 rounded-xl border ${isP2Winner ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'bg-black/40 border-gray-700 text-gray-400'}`}>
                  <span className="text-xs font-bold font-[family-name:var(--font-arcade)]">{isP2Winner ? '👑 WINNER' : (isDraw ? '🤝 DRAW' : '💀 LOSER')}</span>
                  <span className="text-xl font-black">{p2Info.name}</span>
                  <span className="text-xs text-white/70">{p2Stats.wpm} WPM • {p2Stats.accuracy}% ACC</span>
                </div>
              </div>
            </div>
          ) : (
            /* ── CENTER ANNOUNCER TICKER & LEAD METER ── */
            <div className="flex flex-col items-center gap-2 bg-black/80 border-2 border-yellow-400/50 p-3 rounded-2xl shadow-[0_0_20px_rgba(255,251,0,0.2)]">
              <span className="text-xs text-yellow-300 font-bold tracking-widest uppercase flex items-center gap-2 font-[family-name:var(--font-arcade)]">
                <Trophy size={16} /> {tickerMessage}
              </span>

              {/* WPM Advantage Bar */}
              <div className="w-full max-w-lg flex items-center gap-3">
                <span className="text-[10px] text-cyan-400 font-bold">{p1Info.name} ({p1Stats.wpm} WPM)</span>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-cyan-400 transition-all duration-300" 
                    style={{ width: `${Math.max(10, Math.min(90, 50 + (wpmDiff * 2)))}%` }} 
                  />
                  <div className="h-full bg-pink-500 flex-1 transition-all duration-300" />
                </div>
                <span className="text-[10px] text-pink-400 font-bold">{p2Info.name} ({p2Stats.wpm} WPM)</span>
              </div>
            </div>
          )}

          {/* ── DUAL PLAYER MONITOR GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">

            {/* ── HOST / PLAYER 1 PANEL (LEFT) ── */}
            <div className={`relative bg-[#0c0c16] border-2 ${isFinished && isP1Winner ? 'border-yellow-400 shadow-[0_0_35px_rgba(255,215,0,0.5)]' : 'border-cyan-400/80 shadow-[0_0_25px_rgba(0,243,255,0.25)]'} p-5 rounded-2xl flex flex-col gap-4 transition-all duration-300`}>
              {/* Header */}
              <div className="flex justify-between items-center border-b border-cyan-500/30 pb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 ${isFinished && isP1Winner ? 'bg-yellow-400' : 'bg-cyan-400'} rounded-full animate-ping`} />
                  <span className="text-cyan-400 font-bold text-lg tracking-wider uppercase font-[family-name:var(--font-arcade)]">{p1Info.name}</span>
                </div>

                {isFinished ? (
                  <div className={`px-3 py-1 rounded-full font-[family-name:var(--font-arcade)] text-xs font-bold tracking-widest animate-pulse ${
                    isP1Winner 
                      ? 'bg-yellow-400/20 border border-yellow-400 text-yellow-300 shadow-[0_0_15px_rgba(255,215,0,0.6)]' 
                      : (isDraw ? 'bg-gray-800 border border-gray-500 text-gray-300' : 'bg-red-950/80 border border-red-500 text-red-400')
                  }`}>
                    {isP1Winner ? '👑 WINNER' : (isDraw ? '🤝 DRAW' : '💀 LOSER')}
                  </div>
                ) : (
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-green-400 font-bold">{p1Stats.wpm} WPM</span>
                    <span className="text-cyan-400">{p1Stats.accuracy}% ACC</span>
                    <span className="text-yellow-400">×{p1Stats.combo} COMBO</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className={`${isFinished && isP1Winner ? 'bg-yellow-400 shadow-[0_0_10px_#ffd700]' : 'bg-cyan-400 shadow-[0_0_10px_#00f3ff]'} h-full transition-all duration-150`} style={{ width: `${p1Stats.progress}%` }} />
              </div>

              {/* Live Typing Stream */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-white/50 tracking-widest uppercase">LIVE TYPING STREAM</span>
                {renderTypingStream(p1Stats.typed, 'cyan')}
              </div>

              {/* Live Virtual Keyboard */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-white/50 tracking-widest uppercase">LIVE KEYBOARD MONITOR</span>
                <SpectatorKeyboard activeKey={p1Stats.lastKey} color="cyan" />
              </div>

              {/* Active Debuff Overlay */}
              <DebuffBanner activeDebuff={p1BannerDebuff} />
              <ComboBanner triggerCombo={p1ComboTrigger} />
            </div>

            {/* ── CHALLENGER / PLAYER 2 PANEL (RIGHT) ── */}
            <div className={`relative bg-[#0c0c16] border-2 ${isFinished && isP2Winner ? 'border-yellow-400 shadow-[0_0_35px_rgba(255,215,0,0.5)]' : 'border-pink-500/80 shadow-[0_0_25px_rgba(255,0,127,0.25)]'} p-5 rounded-2xl flex flex-col gap-4 transition-all duration-300`}>
              {/* Header */}
              <div className="flex justify-between items-center border-b border-pink-500/30 pb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 ${isFinished && isP2Winner ? 'bg-yellow-400' : 'bg-pink-500'} rounded-full animate-ping`} />
                  <span className="text-pink-400 font-bold text-lg tracking-wider uppercase font-[family-name:var(--font-arcade)]">{p2Info.name}</span>
                </div>

                {isFinished ? (
                  <div className={`px-3 py-1 rounded-full font-[family-name:var(--font-arcade)] text-xs font-bold tracking-widest animate-pulse ${
                    isP2Winner 
                      ? 'bg-yellow-400/20 border border-yellow-400 text-yellow-300 shadow-[0_0_15px_rgba(255,215,0,0.6)]' 
                      : (isDraw ? 'bg-gray-800 border border-gray-500 text-gray-300' : 'bg-red-950/80 border border-red-500 text-red-400')
                  }`}>
                    {isP2Winner ? '👑 WINNER' : (isDraw ? '🤝 DRAW' : '💀 LOSER')}
                  </div>
                ) : (
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-green-400 font-bold">{p2Stats.wpm} WPM</span>
                    <span className="text-cyan-400">{p2Stats.accuracy}% ACC</span>
                    <span className="text-yellow-400">×{p2Stats.combo} COMBO</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className={`${isFinished && isP2Winner ? 'bg-yellow-400 shadow-[0_0_10px_#ffd700]' : 'bg-pink-500 shadow-[0_0_10px_#ff007f]'} h-full transition-all duration-150`} style={{ width: `${p2Stats.progress}%` }} />
              </div>

              {/* Live Typing Stream */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-white/50 tracking-widest uppercase">LIVE TYPING STREAM</span>
                {renderTypingStream(p2Stats.typed, 'pink')}
              </div>

              {/* Live Virtual Keyboard */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-white/50 tracking-widest uppercase">LIVE KEYBOARD MONITOR</span>
                <SpectatorKeyboard activeKey={p2Stats.lastKey} color="pink" />
              </div>

              {/* Active Debuff Overlay */}
              <DebuffBanner activeDebuff={p2BannerDebuff} />
              <ComboBanner triggerCombo={p2ComboTrigger} />
            </div>

          </div>
        </div>
      )}

      {/* ── FOOTER BAR ── */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between text-[10px] text-white/40 pt-2 border-t border-white/10 z-20">
        <span>TYPE//BATTLE TOURNAMENT SPECTATOR MONITOR</span>
        <span>REAL-TIME SUPABASE BROADCAST PIPELINE</span>
      </div>
    </div>
  );
};

export default SpectatePage;

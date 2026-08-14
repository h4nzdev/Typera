import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import typingData from '../data/type_battle_word_data.json';
import { playVoice } from '../lib/sounds';

const generateChallenge = (count = 15, category = 'all', mode = 'race') => {
  const words = [];
  const wordList = category === 'all' 
    ? typingData.all 
    : (typingData.categories[category] || typingData.all);
    
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    const word = wordList[randomIndex];
    
    let type = 'normal';
    const rand = Math.random();
    if (mode === 'deathmatch') {
      if (rand < 0.05) type = 'tnt';
      else if (rand < 0.15) type = 'sword';
      else if (rand < 0.25) type = 'critical';
    } else {
      if (rand < 0.12) type = 'critical';
    }
    
    words.push({ word, type });
  }
  return words;
};

// ─── Throttle helper ────────────────────────────────────────────────────────
function throttle(fn, limit) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

const useMatchStore = create((set, get) => ({
  matchCode: null,
  isHost: false,
  myId: null,
  players: [],
  status: 'lobby', // lobby | starting | playing | finished
  channel: null,
  channelState: 'DISCONNECTED',
  opponentStats: { progress: 0, wpm: 0, accuracy: 100, combo: 0, hp: 1000 },
  localReady: false,
  opponentReady: false,
  roundNumber: 1,
  challengeWords: [],
  gameMode: 'race',
  category: 'all',
  activeDebuff: null,
  opponentDebuff: null,
  opponentStrikePulse: null,

  // Internal throttled senders – replaced each time initMatch runs
  _throttledBroadcast: null,
  _throttledStrikeBroadcast: null,

  broadcastKeystrokeStrike: (char, combo) => {
    const { _throttledStrikeBroadcast } = get();
    if (_throttledStrikeBroadcast) {
      _throttledStrikeBroadcast(char, combo);
    }
  },

  setActiveDebuff: (debuff) => set({ activeDebuff: debuff }),

  sendPowerUp: async (type) => {
    const { channel } = get();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'match_powerup',
        payload: { type }
      });
      
      const duration = type === 'blind' ? 3000 : 2000;
      set({ opponentDebuff: { type, endsAt: Date.now() + duration } });
      setTimeout(() => {
        if (get().opponentDebuff?.type === type) {
          set({ opponentDebuff: null });
        }
      }, duration);
    }
  },

  setCategory: (category) => {
    const { isHost, channel, gameMode, roundNumber } = get();
    if (!isHost) return;
    const newWords = generateChallenge(gameMode === 'deathmatch' ? 30 : 15, category, gameMode);
    set({ category, challengeWords: newWords });
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'match_setup',
        payload: { challengeWords: newWords, category, gameMode, roundNumber }
      });
    }
  },

  setGameMode: (newMode) => {
    const { isHost, channel, category, roundNumber } = get();
    const newWords = generateChallenge(newMode === 'deathmatch' ? 30 : 15, category, newMode);
    set({ gameMode: newMode, challengeWords: newWords });
    if (isHost && channel) {
      channel.send({
        type: 'broadcast',
        event: 'match_setup',
        payload: { challengeWords: newWords, category, gameMode: newMode, roundNumber }
      });
    }
  },
  
  appendWords: (count = 10) => {
    const { category, gameMode, challengeWords, channel } = get();
    const newWords = generateChallenge(count, category, gameMode);
    const combined = [...challengeWords, ...newWords];
    set({ challengeWords: combined });
    
    if (channel && get().isHost) {
      channel.send({
        type: 'broadcast',
        event: 'match_append_words',
        payload: { newWords }
      });
    }
  },

  setPaused: async (paused) => {
    set({ isPaused: paused });
    const { channel } = get();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'match_pause',
        payload: { isPaused: paused }
      });
    }
  },

  // ─── SIMPLE READY: just broadcast, no presence, no async ──────────────
  setLocalReady: () => {
    const { channel, myId } = get();
    set({ localReady: true });
    console.log('[READY] setLocalReady called, broadcasting player_ready');
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'player_ready',
        payload: { id: myId }
      });
    }
  },

  // Re-broadcast our ready state (used as heartbeat)
  pingReady: () => {
    const { channel, myId, localReady } = get();
    if (channel && localReady) {
      channel.send({
        type: 'broadcast',
        event: 'player_ready',
        payload: { id: myId }
      });
    }
  },

  clearPresenceReady: async () => {
    set({ localReady: false, opponentReady: false });
    const { channel, isHost } = get();
    if (channel) {
      try {
        const { playerName } = (await import('../store/useUserStore')).default.getState();
        channel.track({ isHost, playerName: playerName || 'PLAYER', readyRound: 0, isReady: false });
      } catch(e) {}
    }
  },

  initMatch: async (code, isHost) => {
    const { channel, hostTimeoutTimer, hostHeartbeatInterval } = get();
    if (channel) {
      await channel.unsubscribe();
    }
    if (hostTimeoutTimer) {
      clearTimeout(hostTimeoutTimer);
    }
    if (hostHeartbeatInterval) {
      clearInterval(hostHeartbeatInterval);
    }

    const myId = crypto.randomUUID();

    const newChannel = supabase.channel(`match:${code}`, {
      config: {
        presence: { key: myId },
        broadcast: { self: false, ack: false },
      },
    });

    const initialWords = isHost ? generateChallenge(get().gameMode === 'deathmatch' ? 30 : 15, get().category, get().gameMode) : [];

    set({ 
      matchCode: code, 
      isHost, 
      myId, 
      channel: newChannel,
      channelState: 'CONNECTING', 
      status: 'lobby', 
      players: [], 
      hostEverSeen: isHost,
      hostTimeoutTimer: null,
      hostHeartbeatInterval: null,
      opponentStats: { progress: 0, wpm: 0, accuracy: 100, combo: 0, hp: 1000 },
      localReady: false,
      opponentReady: false,
      roundNumber: 1,
      challengeWords: initialWords,
      localPoints: 0,
      opponentPoints: 0,
    });

    // If host, set up a 1.5s broadcast heartbeat to announce presence to joining challengers
    if (isHost) {
      const hb = setInterval(() => {
        const activeChan = get().channel;
        if (activeChan) {
          activeChan.send({
            type: 'broadcast',
            event: 'host_ping',
            payload: { hostId: myId }
          });
        }
      }, 1500);
      set({ hostHeartbeatInterval: hb });
    }

    const throttledSend = throttle((stats) => {
      newChannel.send({
        type: 'broadcast',
        event: 'stats_update',
        payload: { id: myId, stats },
      });
    }, 50);

    const throttledStrike = throttle((char, combo) => {
      newChannel.send({
        type: 'broadcast',
        event: 'keystroke_hit',
        payload: { id: myId, char, combo },
      });
    }, 30);

    set({ _throttledBroadcast: throttledSend, _throttledStrikeBroadcast: throttledStrike });

    newChannel
      .on('presence', { event: 'sync' }, () => {
        const state = newChannel.presenceState();
        const connectedPlayers = [];
        for (const [key, presences] of Object.entries(state)) {
           connectedPlayers.push({ id: key, ...presences[0] });
        }
        
        connectedPlayers.sort((a, b) => (a.isHost === b.isHost) ? 0 : a.isHost ? -1 : 1);
        
        set({ players: connectedPlayers });

        const hasHost = connectedPlayers.some(p => p.isHost);
        const currentStatus = get().status;

        if (hasHost) {
          set({ hostEverSeen: true });
          const timer = get().hostTimeoutTimer;
          if (timer) {
            clearTimeout(timer);
            set({ hostTimeoutTimer: null });
          }
          if (currentStatus === 'not_found') {
            set({ status: 'lobby' });
          }
        }

        if (connectedPlayers.length < 2) {
            if (currentStatus === 'playing') {
                set({ status: 'opponent_surrendered' });
            } else if (currentStatus === 'starting' && get().hostEverSeen && !hasHost) {
                set({ status: 'cancelled' });
            } else if (currentStatus === 'lobby' && get().hostEverSeen && !hasHost && !get().isHost) {
                set({ status: 'cancelled' });
            }
        }
        
        if (connectedPlayers.length === 2 && (get().status === 'lobby' || get().status === 'not_found')) {
           set({ status: 'starting' });
           if (get().isHost) {
             const { category, gameMode, roundNumber } = get();
             const currentWords = get().challengeWords.length > 0 ? get().challengeWords : generateChallenge(gameMode === 'deathmatch' ? 30 : 15, category, gameMode);
             newChannel.send({
               type: 'broadcast',
               event: 'match_setup',
               payload: { challengeWords: currentWords, category, gameMode, roundNumber }
             });
             set({ challengeWords: currentWords });
           }
        }
      })
      // ─── Broadcast Handshake & Heartbeat ──────────────────────────────
      .on('broadcast', { event: 'request_host_handshake' }, () => {
        if (get().isHost) {
          const { category, gameMode, roundNumber, challengeWords } = get();
          newChannel.send({
            type: 'broadcast',
            event: 'host_handshake_ack',
            payload: { hostId: myId, category, gameMode, roundNumber, challengeWords }
          });
        }
      })
      .on('broadcast', { event: 'host_ping' }, () => {
        if (!get().isHost) {
          set({ hostEverSeen: true });
          const timer = get().hostTimeoutTimer;
          if (timer) {
            clearTimeout(timer);
            set({ hostTimeoutTimer: null });
          }
          if (get().status === 'not_found') {
            set({ status: 'lobby' });
          }
        }
      })
      .on('broadcast', { event: 'host_handshake_ack' }, (payload) => {
        if (!get().isHost) {
          console.log('[HANDSHAKE] Challenger received host_handshake_ack from host');
          set({ 
            hostEverSeen: true,
            challengeWords: payload.payload.challengeWords || get().challengeWords,
            category: payload.payload.category || 'all',
            gameMode: payload.payload.gameMode || 'race',
            roundNumber: payload.payload.roundNumber || 1,
          });
          const timer = get().hostTimeoutTimer;
          if (timer) {
            clearTimeout(timer);
            set({ hostTimeoutTimer: null });
          }
          if (get().status === 'not_found') {
            set({ status: 'lobby' });
          }
        }
      })
      .on('broadcast', { event: 'player_ready' }, (payload) => {
        const myId = get().myId;
        if (payload.payload.id !== myId) {
          console.log('[READY] Received player_ready from opponent, setting opponentReady=true');
          set({ opponentReady: true });
        }
      })
      .on('broadcast', { event: 'match_setup' }, (payload) => {
        const nextRound = payload.payload.roundNumber || get().roundNumber || 1;
        
        set({ 
          challengeWords: payload.payload.challengeWords, 
          category: payload.payload.category || 'all',
          gameMode: payload.payload.gameMode || 'race',
          roundNumber: nextRound,
          localReady: false,
          opponentReady: false,
        });
      })
      .on('broadcast', { event: 'match_append_words' }, (payload) => {
        set(state => ({ challengeWords: [...state.challengeWords, ...payload.payload.newWords] }));
      })
      .on('broadcast', { event: 'match_pause' }, (payload) => {
        set({ isPaused: payload.payload.isPaused });
      })
      .on('broadcast', { event: 'match_powerup' }, (payload) => {
        const type = payload.payload.type;
        const duration = type === 'blind' ? 3000 : 2000;
        set({ activeDebuff: { type, endsAt: Date.now() + duration } });
        playVoice(type);
        setTimeout(() => {
          if (get().activeDebuff?.type === type) {
            set({ activeDebuff: null });
          }
        }, duration);
      })
      .on('broadcast', { event: 'keystroke_hit' }, (payload) => {
        if (payload.payload.id !== get().myId) {
          set({ opponentStrikePulse: { ts: Date.now(), char: payload.payload.char, combo: payload.payload.combo } });
        }
      })
      .on('broadcast', { event: 'stats_update' }, (payload) => {
        if (payload.payload.id !== get().myId) {
          set({ opponentStats: payload.payload.stats });
        }
      })
      .on('broadcast', { event: 'round_winner' }, (payload) => {
        const winnerId = payload.payload.id;
        const myId = get().myId;
        if (winnerId !== myId) {
          set((state) => ({ opponentPoints: state.opponentPoints + 1 }));
        }
      })
      .on('broadcast', { event: 'match_status' }, (payload) => {
        set({ status: payload.payload.status });
      })
      .subscribe(async (status) => {
        set({ channelState: status });
        if (status === 'SUBSCRIBED') {
          const { playerName } = (await import('../store/useUserStore')).default.getState();
          await newChannel.track({ isHost, joinedAt: Date.now(), playerName: playerName || 'PLAYER', readyRound: 0, isReady: false });
          
          // If challenger, send host handshake request & start 8.0s connection-aware timeout AFTER subscription!
          if (!isHost) {
            newChannel.send({ type: 'broadcast', event: 'request_host_handshake' });
            
            // Retry handshake broadcast at 1.0s and 2.5s
            setTimeout(() => {
              if (!get().hostEverSeen) newChannel.send({ type: 'broadcast', event: 'request_host_handshake' });
            }, 1000);
            setTimeout(() => {
              if (!get().hostEverSeen) newChannel.send({ type: 'broadcast', event: 'request_host_handshake' });
            }, 2500);

            const timer = setTimeout(() => {
              const { players, hostEverSeen, isHost: currentIsHost } = get();
              const hasHostNow = players.some(p => p.isHost) || hostEverSeen;
              if (!currentIsHost && !hasHostNow) {
                console.log('[MATCH STORE] Host not found after 8.0s post-subscription timeout -> status: not_found');
                set({ status: 'not_found' });
              }
            }, 8000);
            set({ hostTimeoutTimer: timer });
          }
        }
      });
  },

  leaveMatch: async () => {
    const { channel, hostHeartbeatInterval, hostTimeoutTimer } = get();
    if (hostHeartbeatInterval) clearInterval(hostHeartbeatInterval);
    if (hostTimeoutTimer) clearTimeout(hostTimeoutTimer);
    if (channel) {
      await channel.unsubscribe();
    }
    set({ matchCode: null, channel: null, channelState: 'DISCONNECTED', players: [], status: 'lobby', challengeWords: [], roundNumber: 1, _throttledBroadcast: null, hostHeartbeatInterval: null, hostTimeoutTimer: null });
  },

  resetRound: () => {
    const nextRound = (get().roundNumber || 1) + 1;
    set({ 
      roundNumber: nextRound,
      opponentStats: { progress: 0, wpm: 0, accuracy: 100, combo: 0, hp: 1000 },
      localReady: false,
      opponentReady: false,
    });
    const { isHost, channel, category, gameMode } = get();
    if (channel) {
      const resetPresence = async () => {
        const { playerName } = (await import('../store/useUserStore')).default.getState();
        channel.track({ isHost, playerName: playerName || 'PLAYER', readyRound: 0, isReady: false });
      };
      resetPresence();
    }
    if (isHost && channel) {
      const newWords = generateChallenge(gameMode === 'deathmatch' ? 30 : 15, category, gameMode);
      set({ challengeWords: newWords });
      channel.send({
        type: 'broadcast',
        event: 'match_setup',
        payload: { challengeWords: newWords, category, gameMode, roundNumber: nextRound }
      });
    }
  },

  resetMatch: () => {
    set({ 
      roundNumber: 1,
      opponentStats: { progress: 0, wpm: 0, accuracy: 100, combo: 0, hp: 1000 },
      localReady: false,
      opponentReady: false,
      localPoints: 0,
      opponentPoints: 0,
    });
    const { isHost, channel, category, gameMode } = get();
    if (channel) {
      const resetPresence = async () => {
        const { playerName } = (await import('../store/useUserStore')).default.getState();
        channel.track({ isHost, playerName: playerName || 'PLAYER', readyRound: 0, isReady: false });
      };
      resetPresence();
    }
    if (isHost && channel) {
      const newWords = generateChallenge(gameMode === 'deathmatch' ? 30 : 15, category, gameMode);
      set({ challengeWords: newWords });
      channel.send({
        type: 'broadcast',
        event: 'match_setup',
        payload: { challengeWords: newWords, category, gameMode, roundNumber: 1 }
      });
    }
  },

  broadcastStats: (stats) => {
    const { _throttledBroadcast } = get();
    if (_throttledBroadcast) {
      _throttledBroadcast(stats);
    }
  },

  recordRoundWinner: async (winnerId) => {
    const { channel } = get();
    if (winnerId === get().myId) {
      set((state) => ({ localPoints: state.localPoints + 1 }));
    }
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'round_winner',
        payload: { id: winnerId },
      });
    }
  },

  updateMatchStatus: async (newStatus) => {
    const { channel } = get();
    set({ status: newStatus });
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'match_status',
        payload: { status: newStatus },
      });
    }
  }
}));

export default useMatchStore;

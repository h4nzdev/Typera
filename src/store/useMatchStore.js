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
    if (mode === 'deathmatch') {
      const rand = Math.random();
      if (rand < 0.05) type = 'tnt';
      else if (rand < 0.15) type = 'sword';
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
  roundNumber: 1, // Strict round tracking for ready handshake
  challengeWords: [],
  gameMode: 'race',
  category: 'all',
  localPoints: 0,
  opponentPoints: 0,
  isPaused: false,
  activeDebuff: null,
  opponentDebuff: null,

  // Internal throttled sender – replaced each time initMatch runs
  _throttledBroadcast: null,

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

  setLocalReady: async () => {
    const { channel, isHost, roundNumber, myId } = get();
    set({ localReady: true });
    
    if (channel) {
      // 1. Broadcast player_ready IMMEDIATELY (<5ms)
      channel.send({
        type: 'broadcast',
        event: 'player_ready',
        payload: { id: myId, readyRound: roundNumber, isReady: true }
      });

      // 2. Async presence track in background
      try {
        const { playerName } = (await import('../store/useUserStore')).default.getState();
        channel.track({ isHost, playerName: playerName || 'PLAYER', readyRound: roundNumber, isReady: true });
      } catch (err) {
        // Non-blocking
      }
    }
  },

  queryReadyStatus: () => {
    const { channel, myId, roundNumber, localReady } = get();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'query_ready',
        payload: { id: myId, roundNumber }
      });
      if (localReady) {
        channel.send({
          type: 'broadcast',
          event: 'player_ready',
          payload: { id: myId, readyRound: roundNumber, isReady: true }
        });
      }
    }
  },

  clearPresenceReady: async () => {
    set({ localReady: false, opponentReady: false });
    const { channel, isHost } = get();
    if (channel) {
      const { playerName } = (await import('../store/useUserStore')).default.getState();
      await channel.track({ isHost, playerName: playerName || 'PLAYER', readyRound: 0, isReady: false });
    }
  },

  initMatch: async (code, isHost) => {
    const { channel } = get();
    if (channel) {
      await channel.unsubscribe();
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
      opponentStats: { progress: 0, wpm: 0, accuracy: 100, combo: 0, hp: 1000 },
      localReady: false,
      opponentReady: false,
      roundNumber: 1,
      challengeWords: initialWords,
      localPoints: 0,
      opponentPoints: 0,
    });

    const throttledSend = throttle((stats) => {
      newChannel.send({
        type: 'broadcast',
        event: 'stats_update',
        payload: { id: myId, stats },
      });
    }, 50);

    set({ _throttledBroadcast: throttledSend });

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

        if (connectedPlayers.length < 2) {
            if (currentStatus === 'playing') {
                set({ status: 'opponent_surrendered' });
            } else if (currentStatus === 'starting') {
                set({ status: 'cancelled' });
            } else if (currentStatus === 'lobby' && !hasHost && !get().isHost) {
                set({ status: 'cancelled' });
            }
        }
        
        if (connectedPlayers.length === 2 && get().status === 'lobby') {
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

        // ── Presence Sync Handshake Check ────────────────────────────
        if (connectedPlayers.length === 2) {
          const myId = get().myId;
          const currentRound = get().roundNumber || 1;
          const me = connectedPlayers.find(p => p.id === myId);
          const opponent = connectedPlayers.find(p => p.id !== myId);

          const isMeReady = me?.isReady || me?.readyRound === currentRound;
          const isOppReady = opponent?.isReady || opponent?.readyRound === currentRound;

          set((state) => ({ 
            localReady: state.localReady || Boolean(isMeReady), 
            opponentReady: state.opponentReady || Boolean(isOppReady) 
          }));
        }
      })
      .on('broadcast', { event: 'query_ready' }, (payload) => {
        const { myId, roundNumber, localReady, channel } = get();
        if (payload.payload.id !== myId && channel) {
          if (localReady) {
            channel.send({
              type: 'broadcast',
              event: 'player_ready',
              payload: { id: myId, readyRound: roundNumber, isReady: true }
            });
          }
        }
      })
      .on('broadcast', { event: 'player_ready' }, (payload) => {
        const myId = get().myId;
        if (payload.payload.id !== myId) {
          set({ opponentReady: true });
        }
      })
      .on('broadcast', { event: 'match_setup' }, (payload) => {
        const nextRound = payload.payload.roundNumber || get().roundNumber || 1;
        const roundChanged = nextRound !== get().roundNumber;
        
        set((state) => ({ 
          challengeWords: payload.payload.challengeWords, 
          category: payload.payload.category || 'all',
          gameMode: payload.payload.gameMode || 'race',
          roundNumber: nextRound,
          localReady: roundChanged ? false : state.localReady,
          opponentReady: roundChanged ? false : state.opponentReady,
        }));
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
      .on('broadcast', { event: 'stats_update' }, (payload) => {
        if (payload.payload.id !== get().myId) {
          set({ opponentStats: payload.payload.stats, opponentReady: true });
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
        }
      });
  },

  leaveMatch: async () => {
    const { channel } = get();
    if (channel) {
      await channel.unsubscribe();
    }
    set({ matchCode: null, channel: null, channelState: 'DISCONNECTED', players: [], status: 'lobby', challengeWords: [], roundNumber: 1, _throttledBroadcast: null });
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
        await channel.track({ isHost, playerName: playerName || 'PLAYER', readyRound: 0, isReady: false });
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
        await channel.track({ isHost, playerName: playerName || 'PLAYER', readyRound: 0, isReady: false });
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

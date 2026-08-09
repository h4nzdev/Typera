import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import typingData from '../data/type_battle_word_data.json';

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
// Returns a function that fires at most once per `limit` ms.
// Unlike lodash throttle, this one fires IMMEDIATELY on the first call,
// then suppresses subsequent calls until the interval expires.
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
  opponentStats: { progress: 0, wpm: 0, accuracy: 100, combo: 0, hp: 1000 },
  localReady: false,
  opponentReady: false,
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
      // Fire-and-forget – no await needed for low-latency feel
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
    const { isHost, channel, gameMode } = get();
    if (!isHost) return;
    const newWords = generateChallenge(gameMode === 'deathmatch' ? 30 : 15, category, gameMode);
    set({ category, challengeWords: newWords });
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'match_setup',
        payload: { challengeWords: newWords, category, gameMode }
      });
    }
  },

  setGameMode: (newMode) => {
    const { isHost, channel, category } = get();
    // Allow setting mode before channel exists (e.g., Booth setup)
    const newWords = generateChallenge(newMode === 'deathmatch' ? 30 : 15, category, newMode);
    set({ gameMode: newMode, challengeWords: newWords });
    if (isHost && channel) {
      channel.send({
        type: 'broadcast',
        event: 'match_setup',
        payload: { challengeWords: newWords, category, gameMode: newMode }
      });
    }
  },
  
  appendWords: (count = 10) => {
    const { category, gameMode, challengeWords, channel } = get();
    const newWords = generateChallenge(count, category, gameMode);
    const combined = [...challengeWords, ...newWords];
    set({ challengeWords: combined });
    
    // In multiplayer, the host appends and broadcasts so both players stay perfectly in sync
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
    set({ localReady: true });
    const { channel, isHost } = get();
    if (channel) {
      // Use presence (not broadcast) so late-arriving players can still see this ready state
      const { playerName } = (await import('../store/useUserStore')).default.getState();
      await channel.track({ isHost, playerName: playerName || 'PLAYER', isReady: true });
    }
  },

  initMatch: async (code, isHost) => {
    const { channel } = get();
    if (channel) {
      await channel.unsubscribe();
    }

    const myId = crypto.randomUUID();

    // ── Channel config optimizations ──────────────────────────────────────────
    // self_broadcast: false  → Supabase won't echo our own broadcasts back to us,
    //                          removing one full round-trip from latency.
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
      status: 'lobby', 
      players: [], 
      opponentStats: { progress: 0, wpm: 0, accuracy: 100, combo: 0, hp: 1000 },
      localReady: false,
      opponentReady: false,
      challengeWords: initialWords,
      localPoints: 0,
      opponentPoints: 0,
    });

    // ── Throttled broadcast sender ────────────────────────────────────────────
    // Stats are sent at most once every 50ms (~20 Hz) per keystroke.
    // This keeps updates smooth and frequent without flooding the channel.
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
        
        // Sort players so host is always first
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
        
        // Auto-start transition if 2 players are in the lobby
        if (connectedPlayers.length === 2 && get().status === 'lobby') {
           set({ status: 'starting' });
           if (get().isHost) {
             const { category, gameMode } = get();
             const currentWords = get().challengeWords.length > 0 ? get().challengeWords : generateChallenge(gameMode === 'deathmatch' ? 30 : 15, category, gameMode);
             newChannel.send({
               type: 'broadcast',
               event: 'match_setup',
               payload: { challengeWords: currentWords, category, gameMode }
             });
             set({ challengeWords: currentWords });
           }
        }

        // Presence-based ready detection (replaces fire-and-forget player_ready broadcast)
        // This fires whenever any presence updates, so late-arriving players immediately
        // see if their opponent is already ready.
        if (connectedPlayers.length === 2) {
          const myId = get().myId;
          const me = connectedPlayers.find(p => p.id === myId);
          const opponent = connectedPlayers.find(p => p.id !== myId);
          if (me?.isReady) set({ localReady: true });
          if (opponent?.isReady) set({ opponentReady: true });
        }
      })
      .on('broadcast', { event: 'match_setup' }, (payload) => {
        set({ 
          challengeWords: payload.payload.challengeWords, 
          category: payload.payload.category || 'all',
          gameMode: payload.payload.gameMode || 'race'
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
        setTimeout(() => {
          if (get().activeDebuff?.type === type) {
            set({ activeDebuff: null });
          }
        }, duration);
      })
      .on('broadcast', { event: 'stats_update' }, (payload) => {
        // Only accept updates from the opponent
        if (payload.payload.id !== get().myId) {
          set({ opponentStats: payload.payload.stats });
        }
      })
      .on('broadcast', { event: 'round_winner' }, (payload) => {
        const winnerId = payload.payload.id;
        const myId = get().myId;
        // Only the OPPONENT updates from the broadcast to avoid double-counting
        if (winnerId !== myId) {
          set((state) => ({ opponentPoints: state.opponentPoints + 1 }));
        }
      })
      .on('broadcast', { event: 'match_status' }, (payload) => {
        set({ status: payload.payload.status });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { playerName } = (await import('../store/useUserStore')).default.getState();
          await newChannel.track({ isHost, joinedAt: Date.now(), playerName: playerName || 'PLAYER' });
        }
      });
  },

  leaveMatch: async () => {
    const { channel } = get();
    if (channel) {
      await channel.unsubscribe();
    }
    set({ matchCode: null, channel: null, players: [], status: 'lobby', challengeWords: [], _throttledBroadcast: null });
  },

  resetRound: () => {
    set({ 
      opponentStats: { progress: 0, wpm: 0, accuracy: 100, combo: 0, hp: 1000 },
      localReady: false,
      opponentReady: false,
    });
    const { isHost, channel, category, gameMode } = get();
    // Reset presence isReady so both players must re-confirm ready for next round
    if (channel) {
      const resetPresence = async () => {
        const { playerName } = (await import('../store/useUserStore')).default.getState();
        await channel.track({ isHost, playerName: playerName || 'PLAYER', isReady: false });
      };
      resetPresence();
    }
    if (isHost && channel) {
      const newWords = generateChallenge(gameMode === 'deathmatch' ? 30 : 15, category, gameMode);
      set({ challengeWords: newWords });
      channel.send({
        type: 'broadcast',
        event: 'match_setup',
        payload: { challengeWords: newWords, category, gameMode }
      });
    }
  },

  resetMatch: () => {
    set({ 
      opponentStats: { progress: 0, wpm: 0, accuracy: 100, combo: 0, hp: 1000 },
      localReady: false,
      opponentReady: false,
      localPoints: 0,
      opponentPoints: 0,
    });
    const { isHost, channel, category, gameMode } = get();
    if (isHost && channel) {
      const newWords = generateChallenge(gameMode === 'deathmatch' ? 30 : 15, category, gameMode);
      set({ challengeWords: newWords });
      channel.send({
        type: 'broadcast',
        event: 'match_setup',
        payload: { challengeWords: newWords, category, gameMode }
      });
    }
  },

  // ── High-frequency stats broadcast (throttled at 50ms = 20Hz) ──────────────
  // Call this on EVERY keystroke. The throttle ensures we don't flood the channel.
  broadcastStats: (stats) => {
    const { _throttledBroadcast } = get();
    if (_throttledBroadcast) {
      _throttledBroadcast(stats);
    }
  },

  recordRoundWinner: async (winnerId) => {
    const { channel } = get();
    // Update the winner's own score locally immediately
    if (winnerId === get().myId) {
      set((state) => ({ localPoints: state.localPoints + 1 }));
    }
    // Broadcast so the opponent knows who won
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

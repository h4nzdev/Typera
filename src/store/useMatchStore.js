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
  isPaused: false,
  activeDebuff: null,
  opponentDebuff: null,

  setActiveDebuff: (debuff) => set({ activeDebuff: debuff }),

  sendPowerUp: async (type) => {
    const { channel } = get();
    if (channel) {
      await channel.send({
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

  setGameMode: (gameMode) => {
    const { isHost, channel, category } = get();
    if (!isHost) return;
    const newWords = generateChallenge(gameMode === 'deathmatch' ? 30 : 15, category, gameMode);
    set({ gameMode, challengeWords: newWords });
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'match_setup',
        payload: { challengeWords: newWords, category, gameMode }
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
      await channel.send({
        type: 'broadcast',
        event: 'match_pause',
        payload: { isPaused: paused }
      });
    }
  },

  setLocalReady: async () => {
    set({ localReady: true });
    const { channel, myId } = get();
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'player_ready',
        payload: { id: myId }
      });
    }
  },

  initMatch: async (code, isHost) => {
    const { channel } = get();
    if (channel) {
      await channel.unsubscribe();
    }

    const myId = crypto.randomUUID();
    const newChannel = supabase.channel(`match:${code}`, {
      config: { presence: { key: myId } },
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
      challengeWords: initialWords
    });

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
      .on('broadcast', { event: 'player_ready' }, (payload) => {
        if (payload.payload.id !== get().myId) {
          set({ opponentReady: true });
        }
      })
      .on('broadcast', { event: 'stats_update' }, (payload) => {
        if (payload.payload.id !== get().myId) {
          set({ opponentStats: payload.payload.stats });
        }
      })
      .on('broadcast', { event: 'match_status' }, (payload) => {
        set({ status: payload.payload.status });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await newChannel.track({ isHost, joinedAt: Date.now() });
        }
      });
  },

  leaveMatch: async () => {
    const { channel } = get();
    if (channel) {
      await channel.unsubscribe();
    }
    set({ matchCode: null, channel: null, players: [], status: 'lobby', challengeWords: [] });
  },

  resetMatch: () => {
    set({ 
      opponentStats: { progress: 0, wpm: 0, accuracy: 100, combo: 0, hp: 1000 },
      localReady: false,
      opponentReady: false,
      // If host restarts, regenerate text for the new match and broadcast it
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

  broadcastStats: async (stats) => {
    const { channel, myId } = get();
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'stats_update',
        payload: { id: myId, stats },
      });
    }
  },

  updateMatchStatus: async (newStatus) => {
    const { channel } = get();
    set({ status: newStatus });
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'match_status',
        payload: { status: newStatus },
      });
    }
  }
}));

export default useMatchStore;

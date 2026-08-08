import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import typingData from '../data/type_battle_word_data.json';

const generateChallenge = (count = 15, category = 'all') => {
  const words = [];
  const wordList = category === 'all' 
    ? typingData.all 
    : (typingData.categories[category] || typingData.all);
    
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    words.push(wordList[randomIndex]);
  }
  return words.join(" ");
};

const useMatchStore = create((set, get) => ({
  matchCode: null,
  isHost: false,
  myId: null,
  players: [],
  status: 'lobby', // lobby | starting | playing | finished
  channel: null,
  opponentStats: { progress: 0, wpm: 0, accuracy: 100, combo: 0 },
  localReady: false,
  opponentReady: false,
  challengeText: '',
  category: 'all',
  isPaused: false,
  activeDebuff: null,

  setActiveDebuff: (debuff) => set({ activeDebuff: debuff }),

  sendPowerUp: async (type) => {
    const { channel } = get();
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'match_powerup',
        payload: { type }
      });
    }
  },

  setCategory: (category) => {
    const { isHost, channel } = get();
    if (!isHost) return;
    const newText = generateChallenge(15, category);
    set({ category, challengeText: newText });
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'match_setup',
        payload: { challengeText: newText, category }
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

    const initialText = isHost ? generateChallenge(15, get().category) : '';

    set({ 
      matchCode: code, 
      isHost, 
      myId, 
      channel: newChannel, 
      status: 'lobby', 
      players: [], 
      opponentStats: { progress: 0, wpm: 0, accuracy: 100, combo: 0 },
      localReady: false,
      opponentReady: false,
      challengeText: initialText
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
             const { category } = get();
             const currentText = get().challengeText || generateChallenge(15, category);
             newChannel.send({
               type: 'broadcast',
               event: 'match_setup',
               payload: { challengeText: currentText, category }
             });
             set({ challengeText: currentText });
           }
        }
      })
      .on('broadcast', { event: 'match_setup' }, (payload) => {
        set({ challengeText: payload.payload.challengeText, category: payload.payload.category || 'all' });
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
    set({ matchCode: null, channel: null, players: [], status: 'lobby', challengeText: '' });
  },

  resetMatch: () => {
    set({ 
      opponentStats: { progress: 0, wpm: 0, accuracy: 100, combo: 0 },
      localReady: false,
      opponentReady: false,
      // If host restarts, regenerate text for the new match and broadcast it
    });
    const { isHost, channel, category } = get();
    if (isHost && channel) {
      const newText = generateChallenge(15, category);
      set({ challengeText: newText });
      channel.send({
        type: 'broadcast',
        event: 'match_setup',
        payload: { challengeText: newText, category }
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

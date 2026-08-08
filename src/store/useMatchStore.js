import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import typingData from '../data/type_battle_word_data.json';

const generateChallenge = (count = 15) => {
  const words = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * typingData.all.length);
    words.push(typingData.all[randomIndex]);
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

    const initialText = isHost ? generateChallenge(15) : '';

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
        
        // Auto-start transition if 2 players are in the lobby
        if (connectedPlayers.length === 2 && get().status === 'lobby') {
           set({ status: 'starting' });
           if (get().isHost) {
             const currentText = get().challengeText || generateChallenge(15);
             newChannel.send({
               type: 'broadcast',
               event: 'match_setup',
               payload: { challengeText: currentText }
             });
             set({ challengeText: currentText });
           }
        }
      })
      .on('broadcast', { event: 'match_setup' }, (payload) => {
        set({ challengeText: payload.payload.challengeText });
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
    const { isHost, channel } = get();
    if (isHost && channel) {
      const newText = generateChallenge(15);
      set({ challengeText: newText });
      channel.send({
        type: 'broadcast',
        event: 'match_setup',
        payload: { challengeText: newText }
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

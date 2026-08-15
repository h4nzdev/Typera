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
  matchId: null, // the UUID of the match in DB
  matchCode: null,
  isHost: false,
  myId: null,
  players: [], // derived from db row: [{ id: player1_id, playerName: player1_name, isHost: true }, { id: player2_id, playerName: player2_name, isHost: false }]
  status: 'lobby', 
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
  localPoints: 0,
  opponentPoints: 0,

  _throttledBroadcast: null,
  _throttledStrikeBroadcast: null,
  _dbSubscription: null,

  // High-frequency events go over broadcast
  broadcastKeystrokeStrike: (char, combo) => {
    const { _throttledStrikeBroadcast } = get();
    if (_throttledStrikeBroadcast) _throttledStrikeBroadcast(char, combo);
  },

  setActiveDebuff: (debuff) => set({ activeDebuff: debuff }),

  sendPowerUp: async (type) => {
    const { channel } = get();
    if (channel) {
      channel.send({ type: 'broadcast', event: 'match_powerup', payload: { type } });
      const duration = type === 'blind' ? 3000 : 2000;
      set({ opponentDebuff: { type, endsAt: Date.now() + duration } });
      setTimeout(() => {
        if (get().opponentDebuff?.type === type) set({ opponentDebuff: null });
      }, duration);
    }
  },

  setCategory: async (category) => {
    const { isHost, matchId, gameMode } = get();
    if (!isHost || !matchId) return;
    const newWords = generateChallenge(gameMode === 'deathmatch' ? 30 : 15, category, gameMode);
    
    // update db directly
    await supabase.from('matches').update({ category, challenge_words: newWords }).eq('id', matchId);
    set({ category, challengeWords: newWords });
  },

  setGameMode: async (newMode) => {
    const { isHost, matchId, category } = get();
    if (!matchId) {
      set({ gameMode: newMode });
      return;
    }
    if (!isHost) return;
    const newWords = generateChallenge(newMode === 'deathmatch' ? 30 : 15, category, newMode);
    
    await supabase.from('matches').update({ game_mode: newMode, challenge_words: newWords }).eq('id', matchId);
    set({ gameMode: newMode, challengeWords: newWords });
  },

  setAllowDebuffs: async (allowed) => {
    const { isHost, matchId } = get();
    if (!matchId) {
      set({ allowDebuffs: allowed });
      return;
    }
    if (!isHost) return;
    await supabase.from('matches').update({ allow_debuffs: allowed }).eq('id', matchId);
    set({ allowDebuffs: allowed });
  },
  
  appendWords: async (count = 10) => {
    const { category, gameMode, challengeWords, matchId, isHost } = get();
    if (!isHost || !matchId) return;
    const newWords = generateChallenge(count, category, gameMode);
    const combined = [...challengeWords, ...newWords];
    
    await supabase.from('matches').update({ challenge_words: combined }).eq('id', matchId);
    set({ challengeWords: combined });
  },

  setPaused: async (paused) => {
    set({ isPaused: paused });
    const { channel } = get();
    if (channel) {
      channel.send({ type: 'broadcast', event: 'match_pause', payload: { isPaused: paused } });
    }
  },

  setLocalReady: async () => {
    const { matchId, myId } = get();
    if (!matchId || !myId) return;
    
    // We update local state optimistically or wait for db
    // Waiting for db via subscription is safer, but we can update optimistic flag
    set({ localReady: true });
    try {
      const { data, error } = await supabase.rpc('toggle_ready', { p_match_id: matchId, p_player_id: myId });
      if (error) throw error;
      // The db change will trigger the subscription to update local state fully
    } catch (err) {
      console.error('Failed to toggle ready', err);
      // Revert if error
      set({ localReady: false });
    }
  },

  pingReady: () => { /* No longer needed */ },

  clearPresenceReady: async () => {
     // Currently we don't have an un-ready RPC, but we can set local to false
     set({ localReady: false, opponentReady: false });
  },

  _handleMatchStateUpdate: (dbMatch) => {
     const { myId } = get();
     const players = [];
     if (dbMatch.player1_id) {
        players.push({ id: dbMatch.player1_id, playerName: dbMatch.player1_name || 'PLAYER 1', isHost: true });
     }
     if (dbMatch.player2_id) {
        players.push({ id: dbMatch.player2_id, playerName: dbMatch.player2_name || 'PLAYER 2', isHost: false });
     }

     const isHost = dbMatch.player1_id === myId;
     const localReady = isHost ? dbMatch.player1_ready : dbMatch.player2_ready;
     const opponentReady = isHost ? dbMatch.player2_ready : dbMatch.player1_ready;

     set({
        matchId: dbMatch.id,
        matchCode: dbMatch.room_code,
        players,
        status: dbMatch.status,
        category: dbMatch.category,
        gameMode: dbMatch.game_mode,
        allowDebuffs: dbMatch.allow_debuffs ?? true,
        roundNumber: dbMatch.round_number,
        challengeWords: dbMatch.challenge_words || [],
        localReady,
        opponentReady,
     });
  },

  initMatch: async (code, isHost) => {
    const { channel, _dbSubscription } = get();
    if (channel) await channel.unsubscribe();
    if (_dbSubscription) await _dbSubscription.unsubscribe();

    let { myId } = get();
    if (!myId) myId = crypto.randomUUID();

    const { playerName } = (await import('../store/useUserStore')).default.getState();
    const pName = playerName || (isHost ? 'PLAYER 1' : 'PLAYER 2');

    let dbMatch = null;

    if (isHost) {
       // Insert new match
       const initialWords = generateChallenge(get().gameMode === 'deathmatch' ? 30 : 15, get().category, get().gameMode);
       const { data, error } = await supabase.from('matches').insert({
          room_code: code,
          player1_id: myId,
          player1_name: pName,
          status: 'waiting',
          challenge_words: initialWords,
          game_mode: get().gameMode,
          category: get().category,
          allow_debuffs: get().allowDebuffs !== undefined ? get().allowDebuffs : true
       }).select().single();
       
       if (error) throw error;
       dbMatch = data;
    } else {
       // Challenger uses RPC to join
       const { data, error } = await supabase.rpc('join_match', { p_room_code: code, p_player2_id: myId, p_player2_name: pName });
       if (error) {
          set({ status: 'not_found' }); // Use existing status map, Join page will handle
          throw error;
       }
       dbMatch = data;
    }

    set({ 
       myId,
       isHost,
       channelState: 'CONNECTING',
       opponentStats: { progress: 0, wpm: 0, accuracy: 100, combo: 0, hp: 1000 },
       localPoints: 0,
       opponentPoints: 0,
       hostEverSeen: true,
    });

    get()._handleMatchStateUpdate(dbMatch);

    // Subscribe to DB changes
    const dbSub = supabase.channel(`db_match:${dbMatch.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${dbMatch.id}` }, (payload) => {
          if (payload.eventType === 'DELETE') {
              set({ status: 'cancelled' });
          } else if (payload.new) {
              get()._handleMatchStateUpdate(payload.new);
          }
      })
      .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
             // Fetch latest to ensure we didn't miss updates
             const { data } = await supabase.from('matches').select('*').eq('id', dbMatch.id).single();
             if (data) get()._handleMatchStateUpdate(data);
          }
      });

    // Setup high-frequency event channel
    const newChannel = supabase.channel(`events:${dbMatch.id}`, { config: { broadcast: { self: false, ack: false } } });

    const throttledSend = throttle((stats) => {
      newChannel.send({ type: 'broadcast', event: 'stats_update', payload: { id: myId, stats } });
    }, 50);

    const throttledStrike = throttle((char, combo) => {
      newChannel.send({ type: 'broadcast', event: 'keystroke_hit', payload: { id: myId, char, combo } });
    }, 30);
    if (!window.__hasMatchUnloadListener) {
      window.__hasMatchUnloadListener = true;
      window.addEventListener('unload', () => {
         const currentMatchId = get().matchId;
         if (currentMatchId) {
             const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
             const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
             if (supabaseUrl && supabaseKey) {
                 fetch(`${supabaseUrl}/rest/v1/matches?id=eq.${currentMatchId}`, {
                     method: 'DELETE',
                     headers: {
                         'apikey': supabaseKey,
                         'Authorization': `Bearer ${supabaseKey}`
                     },
                     keepalive: true
                 }).catch(e => console.error(e));
             }
         }
      });
    }

    set({ _throttledBroadcast: throttledSend, _throttledStrikeBroadcast: throttledStrike, channel: newChannel, _dbSubscription: dbSub });

    newChannel
      .on('broadcast', { event: 'match_pause' }, (payload) => {
        set({ isPaused: payload.payload.isPaused });
      })
      .on('broadcast', { event: 'match_powerup' }, (payload) => {
        const type = payload.payload.type;
        const duration = type === 'blind' ? 3000 : 2000;
        set({ activeDebuff: { type, endsAt: Date.now() + duration } });
        playVoice(type);
        setTimeout(() => {
          if (get().activeDebuff?.type === type) set({ activeDebuff: null });
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
        if (winnerId !== get().myId) {
          set((state) => ({ opponentPoints: state.opponentPoints + 1 }));
        }
      })
      .subscribe((status) => {
        set({ channelState: status });
      });
  },

  leaveMatch: async () => {
    const { channel, _dbSubscription, matchId } = get();
    if (matchId) {
      try {
        await supabase.from('matches').delete().eq('id', matchId);
      } catch (e) {
        console.error('Failed to auto-delete room on leave', e);
      }
    }
    if (channel) await channel.unsubscribe();
    if (_dbSubscription) await _dbSubscription.unsubscribe();
    set({ 
       matchId: null, matchCode: null, channel: null, _dbSubscription: null, 
       channelState: 'DISCONNECTED', players: [], status: 'lobby', 
       challengeWords: [], roundNumber: 1, _throttledBroadcast: null,
       localReady: false, opponentReady: false
    });
  },

  resetRound: async () => {
    const { isHost, matchId, category, gameMode, roundNumber } = get();
    const nextRound = roundNumber + 1;
    set({ opponentStats: { progress: 0, wpm: 0, accuracy: 100, combo: 0, hp: 1000 } });
    
    if (isHost && matchId) {
      const newWords = generateChallenge(gameMode === 'deathmatch' ? 30 : 15, category, gameMode);
      await supabase.from('matches').update({
         round_number: nextRound,
         challenge_words: newWords,
         player1_ready: false,
         player2_ready: false,
         status: 'preparing'
      }).eq('id', matchId);
    }
  },

  resetMatch: async () => {
    const { isHost, matchId, category, gameMode } = get();
    set({ opponentStats: { progress: 0, wpm: 0, accuracy: 100, combo: 0, hp: 1000 }, localPoints: 0, opponentPoints: 0 });
    
    if (isHost && matchId) {
      const newWords = generateChallenge(gameMode === 'deathmatch' ? 30 : 15, category, gameMode);
      await supabase.from('matches').update({
         round_number: 1,
         challenge_words: newWords,
         player1_ready: false,
         player2_ready: false,
         status: 'preparing'
      }).eq('id', matchId);
    }
  },

  broadcastStats: (stats) => {
    const { _throttledBroadcast } = get();
    if (_throttledBroadcast) _throttledBroadcast(stats);
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
    const { matchId } = get();
    if (matchId) {
       await supabase.from('matches').update({ status: newStatus }).eq('id', matchId);
    }
  }
}));

export default useMatchStore;

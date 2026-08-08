import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUserStore = create(
  persist(
    (set) => ({
      playerName: '',
      setPlayerName: (name) => set({ playerName: name.toUpperCase().slice(0, 5) }),
    }),
    {
      name: 'type-battle-user-storage', // unique name for localStorage key
    }
  )
);

export default useUserStore;

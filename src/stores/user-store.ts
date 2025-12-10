import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from '@/lib/database.types';

interface UserState {
  profile: Profile | null;
  isLoading: boolean;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      isLoading: true,

      setProfile: (profile) => set({ profile, isLoading: false }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        })),
      
      clearProfile: () => set({ profile: null, isLoading: false }),
    }),
    {
      name: 'provelt-user',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);

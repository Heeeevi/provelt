import { create } from 'zustand';
import type { Challenge } from '@/lib/database.types';

interface ChallengeState {
  currentChallenge: Challenge | null;
  challenges: Challenge[];
  isLoading: boolean;
  setCurrentChallenge: (challenge: Challenge | null) => void;
  setChallenges: (challenges: Challenge[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useChallengeStore = create<ChallengeState>((set) => ({
  currentChallenge: null,
  challenges: [],
  isLoading: true,

  setCurrentChallenge: (challenge) => set({ currentChallenge: challenge }),
  
  setChallenges: (challenges) => set({ challenges, isLoading: false }),
  
  setLoading: (isLoading) => set({ isLoading }),
}));

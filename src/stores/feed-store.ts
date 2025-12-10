import { create } from 'zustand';
import type { SubmissionWithRelations, FeedItem } from '@/lib/database.types';

interface FeedState {
  items: FeedItem[];
  currentIndex: number;
  isLoading: boolean;
  hasMore: boolean;
  cursor: string | null;
  setItems: (items: FeedItem[]) => void;
  addItems: (items: FeedItem[]) => void;
  setCurrentIndex: (index: number) => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setCursor: (cursor: string | null) => void;
  updateItem: (submissionId: string, updates: Partial<SubmissionWithRelations>) => void;
  reset: () => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  items: [],
  currentIndex: 0,
  isLoading: true,
  hasMore: true,
  cursor: null,

  setItems: (items) => set({ items, isLoading: false }),
  
  addItems: (newItems) =>
    set((state) => ({
      items: [...state.items, ...newItems],
      isLoading: false,
    })),
  
  setCurrentIndex: (currentIndex) => set({ currentIndex }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setHasMore: (hasMore) => set({ hasMore }),
  
  setCursor: (cursor) => set({ cursor }),
  
  updateItem: (submissionId, updates) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.submission.id === submissionId
          ? { ...item, submission: { ...item.submission, ...updates } }
          : item
      ),
    })),
  
  reset: () =>
    set({
      items: [],
      currentIndex: 0,
      isLoading: true,
      hasMore: true,
      cursor: null,
    }),
}));

/**
 * Feed Caching Utility
 * Client-side caching strategies for feed data
 */

import { QueryClient } from '@tanstack/react-query';

// Cache time constants (in milliseconds)
export const CACHE_TIMES = {
  feed: 2 * 60 * 1000,           // 2 minutes
  challenges: 5 * 60 * 1000,     // 5 minutes
  profile: 10 * 60 * 1000,       // 10 minutes
  badges: 30 * 60 * 1000,        // 30 minutes
  static: 60 * 60 * 1000,        // 1 hour
} as const;

// Stale time (when data is considered stale but still usable)
export const STALE_TIMES = {
  feed: 30 * 1000,               // 30 seconds
  challenges: 60 * 1000,         // 1 minute
  profile: 5 * 60 * 1000,        // 5 minutes
  badges: 15 * 60 * 1000,        // 15 minutes
  static: 30 * 60 * 1000,        // 30 minutes
} as const;

/**
 * Create optimized QueryClient with caching defaults
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default stale time - data is fresh for 1 minute
        staleTime: 60 * 1000,
        // Default cache time - keep in cache for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry failed requests 3 times
        retry: 3,
        // Don't refetch on window focus by default
        refetchOnWindowFocus: false,
        // Refetch on reconnect
        refetchOnReconnect: true,
      },
      mutations: {
        // Retry failed mutations once
        retry: 1,
      },
    },
  });
}

/**
 * Query key factory for consistent cache keys
 */
export const queryKeys = {
  // Feed queries
  feed: {
    all: ['feed'] as const,
    list: (cursor?: string) => [...queryKeys.feed.all, 'list', cursor] as const,
    user: (userId: string) => [...queryKeys.feed.all, 'user', userId] as const,
  },
  
  // Challenge queries
  challenges: {
    all: ['challenges'] as const,
    list: (status?: string) => [...queryKeys.challenges.all, 'list', status] as const,
    detail: (id: string) => [...queryKeys.challenges.all, 'detail', id] as const,
    today: () => [...queryKeys.challenges.all, 'today'] as const,
  },
  
  // Profile queries
  profiles: {
    all: ['profiles'] as const,
    detail: (id: string) => [...queryKeys.profiles.all, 'detail', id] as const,
    badges: (id: string) => [...queryKeys.profiles.all, 'badges', id] as const,
  },
  
  // Notification queries
  notifications: {
    all: ['notifications'] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
  },
} as const;

/**
 * Prefetch feed data for better UX
 */
export async function prefetchFeed(queryClient: QueryClient): Promise<void> {
  await queryClient.prefetchInfiniteQuery({
    queryKey: queryKeys.feed.all,
    queryFn: async () => {
      const response = await fetch('/api/submissions?limit=10');
      return response.json();
    },
    initialPageParam: null,
  });
}

/**
 * Prefetch challenge data
 */
export async function prefetchChallenges(queryClient: QueryClient): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.challenges.list('active'),
    queryFn: async () => {
      const response = await fetch('/api/challenges?status=active');
      return response.json();
    },
  });
}

/**
 * Invalidate all feed-related caches
 */
export function invalidateFeedCache(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
}

/**
 * Optimistic update helper for reactions
 */
export function optimisticReactionUpdate(
  queryClient: QueryClient,
  submissionId: string,
  action: 'add' | 'remove'
): void {
  queryClient.setQueriesData(
    { queryKey: queryKeys.feed.all },
    (oldData: any) => {
      if (!oldData?.pages) return oldData;
      
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          items: page.items?.map((item: any) => {
            if (item.id === submissionId) {
              return {
                ...item,
                reactions_count: item.reactions_count + (action === 'add' ? 1 : -1),
                user_reaction: action === 'add' ? 'like' : null,
              };
            }
            return item;
          }),
        })),
      };
    }
  );
}

/**
 * Cache warming - preload critical data on app init
 */
export async function warmCache(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    prefetchFeed(queryClient),
    prefetchChallenges(queryClient),
  ]);
}

/**
 * Get cached data or fetch fresh
 */
export async function getCachedOrFetch<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  fetchFn: () => Promise<T>,
  staleTime: number = STALE_TIMES.feed
): Promise<T> {
  // Check if we have fresh cached data
  const cachedData = queryClient.getQueryData<T>(queryKey);
  const queryState = queryClient.getQueryState(queryKey);
  
  if (cachedData && queryState) {
    const isStale = Date.now() - (queryState.dataUpdatedAt || 0) > staleTime;
    
    if (!isStale) {
      return cachedData;
    }
  }
  
  // Fetch fresh data
  const freshData = await fetchFn();
  queryClient.setQueryData(queryKey, freshData);
  
  return freshData;
}

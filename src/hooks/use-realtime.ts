'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { feedKeys } from '@/hooks/use-feed';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeFeedOptions {
  enabled?: boolean;
  onNewSubmission?: (submission: any) => void;
  onSubmissionUpdate?: (submission: any) => void;
  onSubmissionDelete?: (submissionId: string) => void;
}

/**
 * Hook for real-time feed updates using Supabase Realtime
 * Automatically invalidates queries when new submissions come in
 */
export function useRealtimeFeed(options: UseRealtimeFeedOptions = {}) {
  const {
    enabled = true,
    onNewSubmission,
    onSubmissionUpdate,
    onSubmissionDelete,
  } = options;

  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleInsert = useCallback(
    (payload: any) => {
      console.log('New submission:', payload.new);
      
      // Invalidate feed queries to refetch
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      
      // Call callback if provided
      onNewSubmission?.(payload.new);
    },
    [queryClient, onNewSubmission]
  );

  const handleUpdate = useCallback(
    (payload: any) => {
      console.log('Submission updated:', payload.new);
      
      // Invalidate specific submission and feed
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      
      // Call callback if provided
      onSubmissionUpdate?.(payload.new);
    },
    [queryClient, onSubmissionUpdate]
  );

  const handleDelete = useCallback(
    (payload: any) => {
      console.log('Submission deleted:', payload.old);
      
      // Invalidate feed queries
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
      
      // Call callback if provided
      onSubmissionDelete?.(payload.old?.id);
    },
    [queryClient, onSubmissionDelete]
  );

  useEffect(() => {
    if (!enabled) return;

    // Create realtime channel for submissions
    const channel = supabase
      .channel('submissions-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'submissions',
        },
        handleInsert
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'submissions',
        },
        handleUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'submissions',
        },
        handleDelete
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, handleInsert, handleUpdate, handleDelete]);

  // Return channel for manual control if needed
  return {
    channel: channelRef.current,
    unsubscribe: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    },
  };
}

/**
 * Hook for real-time reactions updates
 */
export function useRealtimeReactions(submissionId?: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!submissionId) return;

    const channel = supabase
      .channel(`reactions-${submissionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `submission_id=eq.${submissionId}`,
        },
        () => {
          // Invalidate feed to refresh reaction counts
          queryClient.invalidateQueries({ queryKey: feedKeys.all });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [submissionId, queryClient]);

  return { channel: channelRef.current };
}

/**
 * Hook for real-time challenge updates
 */
export function useRealtimeChallenge(challengeId?: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!challengeId) return;

    const channel = supabase
      .channel(`challenge-${challengeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'challenges',
          filter: `id=eq.${challengeId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['challenges', challengeId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'submissions',
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['challenges', challengeId] });
          queryClient.invalidateQueries({ queryKey: feedKeys.all });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [challengeId, queryClient]);

  return { channel: channelRef.current };
}

/**
 * Hook for user notifications
 */
export function useRealtimeNotifications(userId?: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New notification:', payload.new);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userId, queryClient]);

  return { channel: channelRef.current };
}

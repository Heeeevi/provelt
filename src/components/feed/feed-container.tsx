'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { FeedCard } from './feed-card';
import { SkeletonFeedCard } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import type { FeedItem } from '@/lib/database.types';
import { Target } from 'lucide-react';

interface FeedContainerProps {
  items: FeedItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error?: Error | null;
  onLoadMore: () => void;
  onRefresh: () => void;
}

export function FeedContainer({
  items,
  isLoading,
  isLoadingMore,
  hasMore,
  error,
  onLoadMore,
  onRefresh,
}: FeedContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Handle scroll to detect active card
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const cardHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / cardHeight);

    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < items.length) {
      setActiveIndex(newIndex);
    }

    // Load more when near bottom
    if (
      hasMore &&
      !isLoadingMore &&
      scrollTop + cardHeight * 2 >= container.scrollHeight
    ) {
      onLoadMore();
    }
  }, [activeIndex, items.length, hasMore, isLoadingMore, onLoadMore]);

  // Attach scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen w-full relative">
        <SkeletonFeedCard />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <ErrorState
          message={error.message}
          onRetry={onRefresh}
        />
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <EmptyState
          icon={<Target className="w-8 h-8 text-surface-500" />}
          title="No submissions yet"
          description="Be the first to complete a challenge and share your proof!"
          action={{
            label: 'Browse Challenges',
            onClick: () => window.location.href = '/challenges',
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
    >
      {items.map((item, index) => (
        <div
          key={item.submission.id}
          className="h-screen w-full snap-start snap-always"
        >
          <FeedCard
            item={item}
            isActive={index === activeIndex}
          />
        </div>
      ))}

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="h-20 flex items-center justify-center">
          <Spinner size="md" />
        </div>
      )}

      {/* End of feed */}
      {!hasMore && items.length > 0 && (
        <div className="h-20 flex items-center justify-center">
          <p className="text-surface-500 text-sm">You've seen all submissions!</p>
        </div>
      )}
    </div>
  );
}

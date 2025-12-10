'use client';

import { SocialFeed } from '@/components/feed/social-feed';
import { useFeed } from '@/hooks/use-feed';
import { PageContainer, Header } from '@/components/layout';
import { LOGO_URL, APP_NAME } from '@/lib/constants';
import Image from 'next/image';

/**
 * Feed Page
 * Instagram/Threads-style social feed of challenge submissions
 */
export default function FeedPage() {
  const {
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error,
    fetchNextPage,
    refetch,
  } = useFeed();

  return (
    <PageContainer>
      {/* Header with Logo */}
      <Header
        title={
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden">
              <Image
                src={LOGO_URL}
                alt={APP_NAME}
                fill
                className="object-cover"
              />
            </div>
            <span className="text-lg font-bold">
              <span className="text-brand-500">PROVE</span>
              <span className="text-white">LT</span>
            </span>
          </div>
        }
      />

      {/* Social Feed */}
      <SocialFeed
        items={items}
        isLoading={isLoading}
        isLoadingMore={isFetchingNextPage}
        hasMore={hasNextPage ?? false}
        error={error}
        onLoadMore={fetchNextPage}
        onRefresh={() => refetch()}
      />
    </PageContainer>
  );
}

'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Flame, 
  Trophy,
  Play,
  Pause,
  Volume2,
  VolumeX,
  MoreHorizontal
} from 'lucide-react';
import type { FeedItem, ReactionType } from '@/lib/database.types';
import { formatRelativeTime } from '@/lib/utils';

interface FeedCardProps {
  item: FeedItem;
  isActive?: boolean;
  onReact?: (type: ReactionType) => void;
  onShare?: () => void;
}

const difficultyColors = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
  expert: 'info',
} as const;

export function FeedCard({ item, isActive = false, onReact, onShare }: FeedCardProps) {
  const { submission, profile, challenge } = item;
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(submission.reactions_count);
  const [isPlaying, setIsPlaying] = useState(isActive);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Early return if missing data
  if (!profile || !challenge) {
    return null;
  }

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    onReact?.('like');
  };

  const handleDoubleTap = () => {
    if (!isLiked) {
      handleLike();
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const isVideo = submission.media_type === 'video';
  const isText = submission.media_type === 'text';

  return (
    <div 
      className="relative h-full w-full bg-surface-950 overflow-hidden"
      onDoubleClick={handleDoubleTap}
    >
      {/* Media Content */}
      <div className="absolute inset-0">
        {isText ? (
          <div className="h-full w-full flex items-center justify-center p-8 bg-gradient-to-br from-brand-900/50 to-accent-900/50">
            <p className="text-xl md:text-2xl text-white text-center font-medium leading-relaxed">
              "{submission.text_content}"
            </p>
          </div>
        ) : isVideo ? (
          <>
            <video
              ref={videoRef}
              src={submission.media_url || ''}
              className="h-full w-full object-cover"
              loop
              muted={isMuted}
              playsInline
              autoPlay={isActive}
              onClick={togglePlay}
            />
            {/* Video Controls */}
            <div className="absolute bottom-24 left-4 flex gap-2">
              <button
                onClick={togglePlay}
                className="p-2 rounded-full bg-black/50 text-white"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-black/50 text-white"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </>
        ) : (
          <Image
            src={submission.media_url || '/placeholder-image.jpg'}
            alt={submission.caption || 'Submission'}
            fill
            className="object-cover"
            priority={isActive}
          />
        )}
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      </div>

      {/* Challenge Badge - Top */}
      <div className="absolute top-4 left-4 right-16">
        <Link href={`/challenges/${challenge.id}`}>
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm">
            <Trophy className="w-4 h-4 text-brand-400" />
            <span className="text-sm text-white font-medium truncate">
              {challenge.title}
            </span>
            <Badge variant={difficultyColors[challenge.difficulty]} className="text-xs">
              {challenge.difficulty}
            </Badge>
          </div>
        </Link>
      </div>

      {/* Action Buttons - Right Side */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-4">
        <Link href={`/profile/${profile.id}`}>
          <Avatar size="lg" className="ring-2 ring-white">
            <AvatarImage src={profile.avatar_url} alt={profile.display_name || 'User'} />
            <AvatarFallback>
              {profile.display_name?.[0] || profile.username?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        </Link>
        
        <ActionButton
          icon={<Heart className={cn('w-7 h-7', isLiked && 'fill-red-500 text-red-500')} />}
          count={likesCount}
          onClick={handleLike}
          active={isLiked}
        />
        
        <ActionButton
          icon={<MessageCircle className="w-7 h-7" />}
          count={submission.comments_count}
          onClick={() => {}}
        />
        
        <ActionButton
          icon={<Share2 className="w-7 h-7" />}
          onClick={onShare}
        />

        <button className="p-2 text-white/80 hover:text-white">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* User Info & Caption - Bottom */}
      <div className="absolute bottom-20 left-4 right-20">
        <Link href={`/profile/${profile.id}`} className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-white">
            @{profile.username || 'anonymous'}
          </span>
          <span className="text-surface-400 text-sm">
            {formatRelativeTime(submission.created_at)}
          </span>
        </Link>
        
        {submission.caption && (
          <p className="text-white text-sm line-clamp-3">
            {submission.caption}
          </p>
        )}

        {/* NFT Badge */}
        {submission.nft_mint_address && (
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent-500/20 text-accent-400 text-xs">
            <Flame className="w-3 h-3" />
            NFT Minted
          </div>
        )}
      </div>

      {/* Double-tap heart animation */}
      <AnimatePresence>
        {isLiked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <Heart className="w-24 h-24 text-red-500 fill-red-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  count?: number;
  onClick?: () => void;
  active?: boolean;
}

function ActionButton({ icon, count, onClick, active }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 transition-transform active:scale-90',
        active ? 'text-red-500' : 'text-white'
      )}
    >
      {icon}
      {count !== undefined && (
        <span className="text-xs font-medium">{formatCount(count)}</span>
      )}
    </button>
  );
}

function formatCount(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

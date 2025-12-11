'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Heart, 
  MessageCircle, 
  Share2, 
  Award, 
  ChevronUp,
  ChevronDown,
  Send,
  Bookmark,
  MoreHorizontal,
  ExternalLink,
  Trophy,
  Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn, formatRelativeTime, truncateAddress } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import type { FeedItem } from '@/lib/database.types';

interface SubmissionViewerProps {
  items: FeedItem[];
  initialIndex?: number;
  onClose: () => void;
}

export function SubmissionViewer({ items, initialIndex = 0, onClose }: SubmissionViewerProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [showComments, setShowComments] = useState(false);

  const currentItem = items[activeIndex];

  // Handle scroll to change active item
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const cardHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / cardHeight);

    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < items.length) {
      setActiveIndex(newIndex);
      setShowComments(false); // Hide comments when switching
    }
  }, [activeIndex, items.length]);

  // Scroll to initial index on mount
  useEffect(() => {
    if (containerRef.current && initialIndex > 0) {
      containerRef.current.scrollTop = initialIndex * containerRef.current.clientHeight;
    }
  }, [initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown' && activeIndex < items.length - 1) {
        containerRef.current?.scrollTo({
          top: (activeIndex + 1) * (containerRef.current?.clientHeight || 0),
          behavior: 'smooth'
        });
      }
      if (e.key === 'ArrowUp' && activeIndex > 0) {
        containerRef.current?.scrollTo({
          top: (activeIndex - 1) * (containerRef.current?.clientHeight || 0),
          behavior: 'smooth'
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, items.length, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Navigation indicators */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
        <button
          onClick={() => containerRef.current?.scrollTo({
            top: (activeIndex - 1) * (containerRef.current?.clientHeight || 0),
            behavior: 'smooth'
          })}
          disabled={activeIndex === 0}
          className={cn(
            "w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-opacity",
            activeIndex === 0 ? "opacity-30" : "hover:bg-black/70"
          )}
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <div className="text-center text-white text-xs">
          {activeIndex + 1}/{items.length}
        </div>
        <button
          onClick={() => containerRef.current?.scrollTo({
            top: (activeIndex + 1) * (containerRef.current?.clientHeight || 0),
            behavior: 'smooth'
          })}
          disabled={activeIndex === items.length - 1}
          className={cn(
            "w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-opacity",
            activeIndex === items.length - 1 ? "opacity-30" : "hover:bg-black/70"
          )}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {items.map((item, index) => (
          <div
            key={item.submission.id}
            className="h-screen w-full snap-start snap-always relative"
          >
            <SubmissionSlide 
              item={item} 
              isActive={index === activeIndex}
              showComments={showComments && index === activeIndex}
              onToggleComments={() => setShowComments(!showComments)}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Individual Submission Slide
function SubmissionSlide({ 
  item, 
  isActive,
  showComments,
  onToggleComments,
}: { 
  item: FeedItem;
  isActive: boolean;
  showComments: boolean;
  onToggleComments: () => void;
}) {
  const { submission, profile, challenge } = item;
  const { userId } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(submission.reactions_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [saved, setSaved] = useState(false);

  const isVideo = submission.media_type === 'video';
  const displayName = profile?.display_name || profile?.username || truncateAddress(submission.user_id);
  const username = profile?.username || truncateAddress(submission.user_id);

  // Auto-play video when active
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  // Check if user has liked
  useEffect(() => {
    const checkIfLiked = async () => {
      if (!userId) return;
      const { data } = await supabase
        .from('reactions')
        .select('id')
        .eq('submission_id', submission.id)
        .eq('user_id', userId)
        .eq('reaction_type', 'like')
        .maybeSingle();
      setLiked(!!data);
    };

    if (userId && submission.id) {
      checkIfLiked();
    }
  }, [userId, submission.id]);

  // Handle like
  const handleLike = async () => {
    if (!userId || isLiking) return;
    
    setIsLiking(true);
    try {
      if (liked) {
        // Unlike
        await supabase
          .from('reactions')
          .delete()
          .eq('submission_id', submission.id)
          .eq('user_id', userId)
          .eq('reaction_type', 'like');
        setLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        await supabase
          .from('reactions')
          .insert({
            submission_id: submission.id,
            user_id: userId,
            reaction_type: 'like',
          });
        setLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Like error:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // Handle double-tap to like
  const [lastTap, setLastTap] = useState(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      if (!liked) handleLike();
    }
    setLastTap(now);
  };

  return (
    <div className="relative h-full w-full bg-black">
      {/* Background Media */}
      <div 
        className="absolute inset-0"
        onClick={handleDoubleTap}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={submission.media_url || ''}
            className="w-full h-full object-contain"
            loop
            muted
            playsInline
          />
        ) : (
          <div className="relative w-full h-full">
            <Image
              src={submission.media_url || '/placeholder.jpg'}
              alt={submission.caption || 'Submission'}
              fill
              className="object-contain"
              priority={isActive}
            />
          </div>
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent" />

      {/* Right side action buttons */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-5">
        {/* Profile */}
        <Link href={`/profile/${submission.user_id}`} className="relative">
          <Avatar className="w-12 h-12 ring-2 ring-white">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-surface-800">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
            <span className="text-[10px] text-white font-bold">+</span>
          </div>
        </Link>

        {/* Like */}
        <button
          onClick={handleLike}
          disabled={isLiking || !userId}
          className="flex flex-col items-center gap-1"
        >
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all",
            liked ? "bg-red-500/20" : "bg-white/10"
          )}>
            <Heart 
              className={cn(
                "w-7 h-7 transition-colors",
                liked ? "fill-red-500 text-red-500" : "text-white"
              )} 
            />
          </div>
          <span className="text-white text-xs font-medium">{likesCount}</span>
        </button>

        {/* Comment */}
        <button
          onClick={onToggleComments}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-xs font-medium">{submission.comments_count || 0}</span>
        </button>

        {/* Save */}
        <button
          onClick={() => setSaved(!saved)}
          className="flex flex-col items-center gap-1"
        >
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all",
            saved ? "bg-yellow-500/20" : "bg-white/10"
          )}>
            <Bookmark 
              className={cn(
                "w-7 h-7 transition-colors",
                saved ? "fill-yellow-500 text-yellow-500" : "text-white"
              )} 
            />
          </div>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <Share2 className="w-7 h-7 text-white" />
          </div>
        </button>
      </div>

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 p-4 pb-6">
        {/* User info */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-white">@{username}</span>
          <span className="text-white/60">·</span>
          <span className="text-white/60 text-sm">{formatRelativeTime(submission.created_at)}</span>
        </div>

        {/* Caption */}
        {submission.caption && (
          <p className="text-white text-sm mb-3 line-clamp-2">
            {submission.caption}
          </p>
        )}

        {/* Challenge & Badge info */}
        {challenge && (
          <Link 
            href={`/challenges/${challenge.id}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm"
          >
            {/* Challenge Badge Image */}
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-surface-800 flex-shrink-0">
              {challenge.badge_image_url ? (
                <Image
                  src={challenge.badge_image_url}
                  alt={challenge.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-500 to-purple-500">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-400" />
                <span className="text-brand-400 text-xs font-medium">Challenge Completed</span>
              </div>
              <p className="text-white font-medium text-sm truncate">{challenge.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge className="bg-brand-500/20 text-brand-400 text-[10px] px-1.5 py-0 border-0">
                  +{challenge.points} XP
                </Badge>
                {submission.nft_mint_address && (
                  <Badge className="bg-purple-500/20 text-purple-400 text-[10px] px-1.5 py-0 border-0">
                    <Award className="w-2.5 h-2.5 mr-0.5" />
                    NFT Badge
                  </Badge>
                )}
              </div>
            </div>

            <ExternalLink className="w-4 h-4 text-white/60" />
          </Link>
        )}
      </div>

      {/* Comments Panel */}
      <AnimatePresence>
        {showComments && (
          <CommentsPanel 
            submissionId={submission.id} 
            onClose={onToggleComments}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Comments Panel
function CommentsPanel({ 
  submissionId, 
  onClose 
}: { 
  submissionId: string;
  onClose: () => void;
}) {
  const { userId } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Fetch comments (placeholder - you'd need a comments table)
  useEffect(() => {
    // For now, just simulate loading
    setIsLoading(false);
    setComments([]);
  }, [submissionId]);

  const handleSendComment = async () => {
    if (!newComment.trim() || !userId || isSending) return;
    
    setIsSending(true);
    // TODO: Implement actual comment posting
    // For now, just add to local state
    setComments(prev => [...prev, {
      id: Date.now(),
      text: newComment,
      user_id: userId,
      created_at: new Date().toISOString(),
    }]);
    setNewComment('');
    setIsSending(false);
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute inset-x-0 bottom-0 h-[60%] bg-surface-900 rounded-t-3xl z-50"
    >
      {/* Handle bar */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-10 h-1 rounded-full bg-surface-700" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-3 border-b border-surface-800">
        <h3 className="text-white font-semibold">Comments</h3>
        <button onClick={onClose} className="text-surface-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-4 max-h-[calc(60vh-120px)]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-surface-700 mx-auto mb-2" />
            <p className="text-surface-500">No comments yet</p>
            <p className="text-surface-600 text-sm">Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-surface-800 text-xs">U</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white text-sm">{comment.text}</p>
                  <p className="text-surface-500 text-xs mt-1">
                    {formatRelativeTime(comment.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment input */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-surface-900 border-t border-surface-800">
        <div className="flex items-center gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={userId ? "Add a comment..." : "Login to comment"}
            disabled={!userId}
            className="flex-1 bg-surface-800 border-surface-700"
            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
          />
          <Button
            size="icon"
            onClick={handleSendComment}
            disabled={!newComment.trim() || !userId || isSending}
            className="bg-brand-500 hover:bg-brand-600"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

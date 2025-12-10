'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Trophy, 
  Clock, 
  Users,
  Target,
  Flame,
  Zap,
  Plus,
  Shield,
} from 'lucide-react';
import { PageContainer, Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkeletonCard } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { useChallenges, type ChallengeWithUI } from '@/hooks/use-challenges';
import { useAuth } from '@/components/providers/auth-provider';
import { cn, formatTimeRemaining } from '@/lib/utils';

const difficultyConfig = {
  easy: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: Zap },
  medium: { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Flame },
  hard: { color: 'text-red-500', bg: 'bg-red-500/10', icon: Target },
};

interface ChallengeCardProps {
  challenge: ChallengeWithUI;
  index: number;
}

function ChallengeCard({ challenge, index }: ChallengeCardProps) {
  const diffConfig = difficultyConfig[challenge.difficulty as keyof typeof difficultyConfig] || difficultyConfig.medium;
  const DiffIcon = diffConfig.icon;
  const timeRemaining = formatTimeRemaining(new Date(challenge.end_time), new Date());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/challenges/${challenge.id}`}>
        <Card className="overflow-hidden hover:bg-surface-800/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Thumbnail */}
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center shrink-0">
                {challenge.badge_image_url ? (
                  <img 
                    src={challenge.badge_image_url} 
                    alt="" 
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Trophy className="w-8 h-8 text-white/80" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-white line-clamp-1">
                    {challenge.title}
                  </h3>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'shrink-0 text-xs',
                      diffConfig.color,
                      diffConfig.bg,
                      'border-transparent'
                    )}
                  >
                    <DiffIcon className="w-3 h-3 mr-1" />
                    {challenge.difficulty}
                  </Badge>
                </div>

                <p className="text-surface-400 text-sm mt-1 line-clamp-2">
                  {challenge.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 text-xs text-surface-500">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    {challenge.xp_reward} XP
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-brand-500" />
                    {challenge.submission_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    {timeRemaining}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

/**
 * Challenges Page
 * Browse all active challenges
 */
export default function ChallengesPage() {
  const [activeTab, setActiveTab] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated } = useAuth();
  
  const { 
    data: challenges, 
    isLoading, 
    error, 
    refetch 
  } = useChallenges({ status: activeTab as any });

  // Filter challenges by search
  const filteredChallenges = challenges?.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  return (
    <PageContainer>
      <Header 
        title="Challenges" 
        rightAction={
          isAuthenticated && (
            <Link href="/challenges/create">
              <Button size="icon" variant="ghost">
                <Plus className="w-5 h-5" />
              </Button>
            </Link>
          )
        }
      />

      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link href="/challenges/create" className="flex-1">
            <Button className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create Challenge
            </Button>
          </Link>
          <Link href="/admin/review">
            <Button variant="outline" size="icon">
              <Shield className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <Input
            placeholder="Search challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="ended">Ended</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : error ? (
              <ErrorState 
                message={error.message} 
                onRetry={refetch}
              />
            ) : filteredChallenges && filteredChallenges.length > 0 ? (
              <div className="space-y-4 pb-24">
                {filteredChallenges.map((challenge, index) => (
                  <ChallengeCard 
                    key={challenge.id} 
                    challenge={challenge}
                    index={index}
                  />
                ))}
              </div>
            ) : searchQuery ? (
              <EmptyState
                icon={<Search className="w-8 h-8 text-surface-500" />}
                title="No results found"
                description={`No challenges match "${searchQuery}"`}
                action={{
                  label: 'Clear Search',
                  onClick: () => setSearchQuery(''),
                }}
              />
            ) : (
              <EmptyState
                icon={<Target className="w-8 h-8 text-surface-500" />}
                title={`No ${activeTab} challenges`}
                description={
                  activeTab === 'active' 
                    ? "Check back soon for new challenges!" 
                    : activeTab === 'upcoming'
                    ? "No upcoming challenges scheduled yet."
                    : "No completed challenges to show."
                }
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}

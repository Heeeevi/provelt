'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Loader2,
  Sparkles,
  Target,
  Trophy,
  Calendar,
  Tag,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Zap,
  Brain,
  Briefcase,
  Flame,
} from 'lucide-react';
import { PageContainer, Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { DifficultyLevel, ChallengeCategory } from '@/lib/database.types';

// Challenge categories with icons and colors
const CATEGORIES: { value: ChallengeCategory; label: string; icon: any; color: string }[] = [
  { value: 'coding', label: 'Coding', icon: Zap, color: 'text-blue-400' },
  { value: 'design', label: 'Design', icon: Sparkles, color: 'text-purple-400' },
  { value: 'art', label: 'Art', icon: ImageIcon, color: 'text-pink-400' },
  { value: 'fitness', label: 'Fitness', icon: Target, color: 'text-green-400' },
  { value: 'music', label: 'Music', icon: Sparkles, color: 'text-yellow-400' },
  { value: 'cooking', label: 'Cooking', icon: Flame, color: 'text-orange-400' },
  { value: 'language', label: 'Language', icon: Brain, color: 'text-cyan-400' },
  { value: 'productivity', label: 'Productivity', icon: Briefcase, color: 'text-indigo-400' },
  { value: 'mindfulness', label: 'Mindfulness', icon: Brain, color: 'text-teal-400' },
  { value: 'other', label: 'Other', icon: Target, color: 'text-gray-400' },
];

// Difficulty levels with XP multipliers
const DIFFICULTIES: { value: DifficultyLevel; label: string; points: number; color: string }[] = [
  { value: 'easy', label: 'Easy', points: 50, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'medium', label: 'Medium', points: 100, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'hard', label: 'Hard', points: 200, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'expert', label: 'Expert', points: 500, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

// Challenge type (for ProveIt categories)
const CHALLENGE_TYPES = [
  { value: 'fun', label: '🔥 Fun', description: 'Creative photo/video challenges' },
  { value: 'professional', label: '💼 Professional', description: 'UI critique, coding, marketing' },
  { value: 'logic', label: '🧠 Logic', description: 'Riddles, puzzles, research tasks' },
];

export default function CreateChallengePage() {
  const router = useRouter();
  const { userId, isAuthenticated } = useAuth();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState<ChallengeCategory>('other');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [challengeType, setChallengeType] = useState('fun');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [duration, setDuration] = useState(7); // Days
  const [badgeName, setBadgeName] = useState('');
  const [badgeImageUrl, setBadgeImageUrl] = useState('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [step, setStep] = useState(1);

  // Get points based on difficulty
  const selectedDifficulty = DIFFICULTIES.find(d => d.value === difficulty);
  const points = selectedDifficulty?.points || 100;

  // Add tag
  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 5 && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Submit challenge
  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Title is required' });
      return;
    }
    if (!description.trim()) {
      setMessage({ type: 'error', text: 'Description is required' });
      return;
    }
    if (!instructions.trim()) {
      setMessage({ type: 'error', text: 'Instructions are required' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // Calculate dates
      const startsAt = new Date();
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + duration);

      // Get profile ID if userId is wallet address
      let creatorId: string | null = null;
      if (userId) {
        // Check if userId is wallet address (longer than UUID)
        if (userId.length > 36) {
          // Fetch profile by wallet address
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('wallet_address', userId)
            .maybeSingle();
          
          creatorId = profile?.id || null;
        } else {
          creatorId = userId;
        }
      }

      // Create challenge
      const { data, error } = await supabase
        .from('challenges')
        .insert({
          title: title.trim(),
          description: description.trim(),
          instructions: instructions.trim(),
          category,
          difficulty,
          points,
          tags: [...tags, challengeType],
          badge_name: badgeName.trim() || `${title.trim()} Badge`,
          badge_image_url: badgeImageUrl || null,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          created_by: creatorId,
          is_active: true,
          is_featured: false,
        })
        .select()
        .single();

      if (error) throw error;

      setMessage({ type: 'success', text: 'Challenge created successfully!' });
      
      // Redirect to challenge page
      setTimeout(() => {
        router.push(`/challenges/${data.id}`);
      }, 1000);
    } catch (error: any) {
      console.error('Create challenge error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to create challenge' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <PageContainer>
        <Header 
          title="Create Challenge"
          leftAction={
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          }
        />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <Trophy className="w-16 h-16 text-surface-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Connect Wallet to Create</h2>
          <p className="text-surface-400 mb-6">You need to connect your wallet to create challenges</p>
          <Button onClick={() => router.push('/auth/login')}>
            Connect Wallet
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header 
        title="Create Challenge"
        leftAction={
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 pb-8"
      >
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step >= s
                  ? "bg-brand-500 text-white"
                  : "bg-surface-800 text-surface-500"
              )}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Message Banner */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg flex items-center gap-2 ${
              message.type === 'error' 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {message.type === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{message.text}</span>
          </motion.div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-500" />
                Basic Information
              </h2>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Challenge Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., 30-Second Pitch Challenge"
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Description *</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this challenge about?"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-surface-500">{description.length}/500</p>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Instructions *</label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Step-by-step instructions for completing the challenge..."
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-surface-500">{instructions.length}/1000</p>
              </div>

              <Button 
                className="w-full" 
                onClick={() => setStep(2)}
                disabled={!title.trim() || !description.trim() || !instructions.trim()}
              >
                Next: Category & Difficulty
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Category & Difficulty */}
        {step === 2 && (
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Challenge Type */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Challenge Type</h3>
                <div className="grid grid-cols-1 gap-2">
                  {CHALLENGE_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setChallengeType(type.value)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        challengeType === type.value
                          ? "border-brand-500 bg-brand-500/10"
                          : "border-surface-700 bg-surface-800/50 hover:border-surface-600"
                      )}
                    >
                      <p className="font-medium text-white">{type.label}</p>
                      <p className="text-xs text-surface-400">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Category</h3>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={cn(
                          "px-3 py-2 rounded-lg border flex items-center gap-2 transition-all",
                          category === cat.value
                            ? "border-brand-500 bg-brand-500/10"
                            : "border-surface-700 bg-surface-800/50 hover:border-surface-600"
                        )}
                      >
                        <Icon className={cn("w-4 h-4", cat.color)} />
                        <span className="text-sm text-white">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Difficulty & XP Reward</h3>
                <div className="grid grid-cols-2 gap-2">
                  {DIFFICULTIES.map((diff) => (
                    <button
                      key={diff.value}
                      onClick={() => setDifficulty(diff.value)}
                      className={cn(
                        "p-3 rounded-lg border transition-all",
                        difficulty === diff.value
                          ? "border-brand-500 bg-brand-500/10"
                          : "border-surface-700 bg-surface-800/50 hover:border-surface-600"
                      )}
                    >
                      <Badge className={cn("mb-2", diff.color)}>
                        {diff.label}
                      </Badge>
                      <p className="text-lg font-bold text-white">+{diff.points} XP</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Challenge Duration
                </h3>
                <div className="flex gap-2">
                  {[1, 3, 7, 14, 30].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={cn(
                        "flex-1 py-2 rounded-lg border text-sm transition-all",
                        duration === d
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-surface-700 bg-surface-800/50 text-surface-400 hover:border-surface-600"
                      )}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)}>
                  Next: Tags & Badge
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Tags & Badge */}
        {step === 3 && (
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Tags */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags (up to 5)
                </h3>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    maxLength={20}
                  />
                  <Button variant="outline" onClick={handleAddTag} disabled={tags.length >= 5}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleRemoveTag(tag)}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-700 text-surface-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                      >
                        #{tag} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Badge Name */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-brand-500" />
                  Badge Name (NFT)
                </h3>
                <Input
                  value={badgeName}
                  onChange={(e) => setBadgeName(e.target.value)}
                  placeholder={`${title || 'Challenge'} Badge`}
                  maxLength={50}
                />
                <p className="text-xs text-surface-500">
                  This will be the name of the NFT badge awarded to completers
                </p>
              </div>

              {/* Badge Image URL */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Badge Image URL (optional)
                </h3>
                <Input
                  value={badgeImageUrl}
                  onChange={(e) => setBadgeImageUrl(e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-surface-500">
                  Leave empty for auto-generated badge
                </p>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-lg bg-surface-800/50 border border-surface-700">
                <h4 className="text-sm font-medium text-surface-400 mb-3">Challenge Preview</h4>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">{title || 'Challenge Title'}</h3>
                  <div className="flex items-center gap-2">
                    <Badge className={selectedDifficulty?.color}>
                      {selectedDifficulty?.label}
                    </Badge>
                    <Badge variant="outline">
                      +{points} XP
                    </Badge>
                    <Badge variant="outline">
                      {duration} days
                    </Badge>
                  </div>
                  <p className="text-sm text-surface-400 line-clamp-2">
                    {description || 'Challenge description...'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Challenge
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </PageContainer>
  );
}

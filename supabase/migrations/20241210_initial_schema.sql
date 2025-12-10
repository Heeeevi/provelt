-- ============================================
-- PROVELT Database Schema
-- Phase 2: Complete PostgreSQL Schema
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM TYPES
-- ============================================

-- Difficulty levels for challenges
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard', 'expert');

-- Media types for submissions
CREATE TYPE media_type AS ENUM ('image', 'video', 'text');

-- Submission status workflow
CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');

-- Challenge categories
CREATE TYPE challenge_category AS ENUM (
  'coding',
  'design',
  'fitness',
  'music',
  'art',
  'cooking',
  'language',
  'productivity',
  'mindfulness',
  'other'
);

-- Reaction types
CREATE TYPE reaction_type AS ENUM ('like', 'fire', 'clap', 'mindblown', 'heart');

-- ============================================
-- PROFILES TABLE
-- Extended user profiles linked to Supabase Auth
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  wallet_address TEXT UNIQUE,
  
  -- Stats (denormalized for performance)
  total_points INTEGER DEFAULT 0,
  badges_count INTEGER DEFAULT 0,
  submissions_count INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  
  -- Settings
  is_public BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$'),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 500)
);

-- Indexes for profiles
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_wallet ON profiles(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_profiles_points ON profiles(total_points DESC);

-- ============================================
-- CHALLENGES TABLE
-- Daily/weekly skill challenges
-- ============================================

CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT,
  
  -- Classification
  difficulty difficulty_level NOT NULL DEFAULT 'easy',
  category challenge_category NOT NULL DEFAULT 'other',
  tags TEXT[] DEFAULT '{}',
  
  -- Rewards
  points INTEGER NOT NULL DEFAULT 10,
  badge_image_url TEXT,
  badge_name TEXT,
  
  -- Timing
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Stats (denormalized)
  submissions_count INTEGER DEFAULT 0,
  completions_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (ends_at > starts_at),
  CONSTRAINT title_length CHECK (char_length(title) >= 5 AND char_length(title) <= 100),
  CONSTRAINT positive_points CHECK (points > 0)
);

-- Indexes for challenges
CREATE INDEX idx_challenges_active ON challenges(is_active, starts_at, ends_at);
CREATE INDEX idx_challenges_category ON challenges(category);
CREATE INDEX idx_challenges_featured ON challenges(is_featured) WHERE is_featured = true;
CREATE INDEX idx_challenges_dates ON challenges(starts_at DESC, ends_at DESC);

-- ============================================
-- SUBMISSIONS TABLE
-- User proof submissions for challenges
-- ============================================

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  
  -- Content
  media_url TEXT,
  media_type media_type NOT NULL,
  text_content TEXT,
  caption TEXT,
  
  -- Status
  status submission_status DEFAULT 'pending',
  rejection_reason TEXT,
  
  -- NFT Data
  nft_mint_address TEXT,
  nft_metadata_uri TEXT,
  nft_tx_signature TEXT,
  minted_at TIMESTAMPTZ,
  
  -- Stats (denormalized)
  reactions_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_media CHECK (
    (media_type = 'text' AND text_content IS NOT NULL) OR
    (media_type IN ('image', 'video') AND media_url IS NOT NULL)
  ),
  CONSTRAINT caption_length CHECK (char_length(caption) <= 500),
  CONSTRAINT one_submission_per_challenge UNIQUE (user_id, challenge_id)
);

-- Indexes for submissions
CREATE INDEX idx_submissions_user ON submissions(user_id);
CREATE INDEX idx_submissions_challenge ON submissions(challenge_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_feed ON submissions(status, created_at DESC) WHERE status = 'approved';
CREATE INDEX idx_submissions_nft ON submissions(nft_mint_address) WHERE nft_mint_address IS NOT NULL;

-- ============================================
-- BADGE_NFTS TABLE
-- Earned badges / minted NFTs
-- ============================================

CREATE TABLE badge_nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  
  -- NFT Data
  mint_address TEXT NOT NULL UNIQUE,
  metadata_uri TEXT NOT NULL,
  tx_signature TEXT NOT NULL,
  
  -- Badge Info
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  
  -- Attributes (stored as JSONB for flexibility)
  attributes JSONB DEFAULT '[]',
  
  -- Timestamps
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_challenge_badge UNIQUE (user_id, challenge_id)
);

-- Indexes for badge_nfts
CREATE INDEX idx_badges_user ON badge_nfts(user_id);
CREATE INDEX idx_badges_challenge ON badge_nfts(challenge_id);
CREATE INDEX idx_badges_mint ON badge_nfts(mint_address);
CREATE INDEX idx_badges_earned ON badge_nfts(earned_at DESC);

-- ============================================
-- REACTIONS TABLE
-- Likes/reactions on submissions
-- ============================================

CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  
  -- Reaction type
  reaction_type reaction_type NOT NULL DEFAULT 'like',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One reaction type per user per submission
  CONSTRAINT unique_user_reaction UNIQUE (user_id, submission_id, reaction_type)
);

-- Indexes for reactions
CREATE INDEX idx_reactions_submission ON reactions(submission_id);
CREATE INDEX idx_reactions_user ON reactions(user_id);

-- ============================================
-- FOLLOWS TABLE
-- User following relationships
-- ============================================

CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Can't follow yourself
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Indexes for follows
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- ============================================
-- NOTIFICATIONS TABLE
-- User notifications
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notification content
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to increment submission count on challenge
CREATE OR REPLACE FUNCTION increment_challenge_submissions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE challenges 
  SET submissions_count = submissions_count + 1
  WHERE id = NEW.challenge_id;
  
  UPDATE profiles
  SET submissions_count = submissions_count + 1
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_submission_created
  AFTER INSERT ON submissions
  FOR EACH ROW EXECUTE FUNCTION increment_challenge_submissions();

-- Function to increment badge count when NFT is minted
CREATE OR REPLACE FUNCTION increment_badge_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET badges_count = badges_count + 1
  WHERE id = NEW.user_id;
  
  UPDATE challenges
  SET completions_count = completions_count + 1
  WHERE id = NEW.challenge_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_badge_created
  AFTER INSERT ON badge_nfts
  FOR EACH ROW EXECUTE FUNCTION increment_badge_count();

-- Function to update reaction count
CREATE OR REPLACE FUNCTION update_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE submissions 
    SET reactions_count = reactions_count + 1
    WHERE id = NEW.submission_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE submissions 
    SET reactions_count = reactions_count - 1
    WHERE id = OLD.submission_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reaction_changed
  AFTER INSERT OR DELETE ON reactions
  FOR EACH ROW EXECUTE FUNCTION update_reaction_count();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Anonymous'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Challenges policies
CREATE POLICY "Active challenges are viewable by everyone"
  ON challenges FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage challenges"
  ON challenges FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Submissions policies
CREATE POLICY "Approved submissions are viewable by everyone"
  ON submissions FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can view their own submissions"
  ON submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create submissions"
  ON submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending submissions"
  ON submissions FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Badge policies
CREATE POLICY "Badges are viewable by everyone"
  ON badge_nfts FOR SELECT
  USING (true);

CREATE POLICY "System can create badges"
  ON badge_nfts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Reaction policies
CREATE POLICY "Reactions are viewable by everyone"
  ON reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reactions"
  ON reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Follow policies
CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can follow"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Notification policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage buckets (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('badges', 'badges', true);

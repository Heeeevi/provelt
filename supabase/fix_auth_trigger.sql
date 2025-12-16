-- ============================================
-- FIX: Auth Trigger for New User Profile
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. First, check if profiles table exists, if not create it
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  wallet_address TEXT UNIQUE,
  
  -- Stats
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
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 3. Create improved function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, username)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'User'
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    -- Generate unique username from email
    LOWER(REPLACE(split_part(NEW.email, '@', 1), '.', '_')) || '_' || SUBSTRING(NEW.id::text, 1, 4)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger
CREATE TRIGGER trigger_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. Enable RLS but allow inserts from the trigger
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Allow everyone to view profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

-- 8. Test: Create profiles for any existing auth users that don't have profiles
INSERT INTO public.profiles (id, display_name, username)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1), 'User'),
  LOWER(REPLACE(split_part(au.email, '@', 1), '.', '_')) || '_' || SUBSTRING(au.id::text, 1, 4)
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Done! Now try signing up again.

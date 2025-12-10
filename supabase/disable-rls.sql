-- ============================================
-- FIX DATABASE FOR WALLET-BASED AUTH
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE follows DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE badge_nfts DISABLE ROW LEVEL SECURITY;

-- STEP 2: Remove foreign key constraint from profiles to auth.users
-- This allows creating profiles without Supabase auth
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- STEP 3: Make storage bucket public (for file uploads)
UPDATE storage.buckets SET public = true WHERE id = 'submissions';

-- STEP 4: Create storage policy for uploads (if not exists)
DO $$
BEGIN
  -- Allow anyone to upload to submissions bucket
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public uploads' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Allow public uploads" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'submissions');
  END IF;
  
  -- Allow anyone to read from submissions bucket
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public reads' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Allow public reads" ON storage.objects
      FOR SELECT USING (bucket_id = 'submissions');
  END IF;
END $$;

-- Verify changes
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';


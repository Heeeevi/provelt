-- Function to increment user stats atomically
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION increment_user_stats(
  p_user_id TEXT,
  p_points INTEGER DEFAULT 0,
  p_badges INTEGER DEFAULT 0,
  p_submissions INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE profiles
  SET 
    total_points = total_points + p_points,
    badges_count = badges_count + p_badges,
    submissions_count = submissions_count + p_submissions,
    updated_at = NOW()
  WHERE id = p_user_id OR wallet_address = p_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_user_stats TO anon, authenticated, service_role;

-- PROVELT Seed Data
-- Run this SQL in Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new)

-- =====================================================
-- IMPORTANT: Profiles are created automatically when users sign up
-- This seed only creates challenges for testing
-- =====================================================


-- =====================================================
-- 1. CREATE CHALLENGES
-- =====================================================

INSERT INTO challenges (id, title, description, category, difficulty, points, badge_name, badge_image_url, instructions, starts_at, ends_at, is_active, submissions_count, created_at)
VALUES
  -- Challenge 1: Coding - Build a Component
  ('c1111111-1111-1111-1111-111111111111',
   '🧩 Build a React Component',
   'Create a reusable React component with TypeScript. Show us your best UI component with proper props and styling!',
   'coding',
   'medium',
   100,
   'React Builder',
   'https://api.dicebear.com/7.x/shapes/svg?seed=react&backgroundColor=10b981',
   'Create a React component with TypeScript, include proper prop types, add styling with Tailwind CSS, share a screenshot or video demo',
   NOW() - INTERVAL '7 days',
   NOW() + INTERVAL '7 days',
   true,
   0,
   NOW() - INTERVAL '7 days'),

  -- Challenge 2: Design - Daily UI
  ('c2222222-2222-2222-2222-222222222222',
   '🎨 Daily UI: Login Page',
   'Design a modern, dark-themed login page. Focus on usability, aesthetics, and micro-interactions.',
   'design',
   'easy',
   75,
   'UI Designer',
   'https://api.dicebear.com/7.x/shapes/svg?seed=design&backgroundColor=8b5cf6',
   'Design a login page, use dark theme colors, include email and social login options, export as image or Figma link',
   NOW() - INTERVAL '5 days',
   NOW() + INTERVAL '9 days',
   true,
   0,
   NOW() - INTERVAL '5 days'),

  -- Challenge 3: Fitness - Morning Run
  ('c3333333-3333-3333-3333-333333333333',
   '🏃 5K Morning Run',
   'Complete a 5K run in the morning (before 9 AM). Share your route, time, and a sweaty selfie!',
   'fitness',
   'medium',
   150,
   'Early Bird Runner',
   'https://api.dicebear.com/7.x/shapes/svg?seed=running&backgroundColor=f59e0b',
   'Run 5K before 9 AM, track with any running app, share screenshot of your route and time, bonus: include a photo!',
   NOW() - INTERVAL '3 days',
   NOW() + INTERVAL '4 days',
   true,
   0,
   NOW() - INTERVAL '3 days'),

  -- Challenge 4: Learning - Read & Summarize
  ('c4444444-4444-4444-4444-444444444444',
   '📚 Read & Summarize',
   'Read a tech article or book chapter and create a visual summary or thread-style breakdown.',
   'productivity',
   'easy',
   50,
   'Knowledge Seeker',
   'https://api.dicebear.com/7.x/shapes/svg?seed=book&backgroundColor=3b82f6',
   'Read any tech article or book chapter, create a summary (image, notes, or video), share what you learned',
   NOW() - INTERVAL '2 days',
   NOW() + INTERVAL '12 days',
   true,
   0,
   NOW() - INTERVAL '2 days'),

  -- Challenge 5: Creative - 60 Second Video
  ('c5555555-5555-5555-5555-555555555555',
   '🎬 60-Second Tutorial',
   'Create a 60-second tutorial video teaching something you know. Could be coding, design, cooking, anything!',
   'art',
   'hard',
   200,
   'Video Creator',
   'https://api.dicebear.com/7.x/shapes/svg?seed=video&backgroundColor=ec4899',
   'Record a 60-second tutorial, teach something valuable, edit and upload your video, add captions if possible',
   NOW() - INTERVAL '1 day',
   NOW() + INTERVAL '13 days',
   true,
   0,
   NOW() - INTERVAL '1 day'),

  -- Challenge 6: Wellness - Meditation
  ('c6666666-6666-6666-6666-666666666666',
   '🧘 10-Minute Meditation',
   'Complete a 10-minute meditation session. Share your experience and how you feel after.',
   'mindfulness',
   'easy',
   50,
   'Mindful Soul',
   'https://api.dicebear.com/7.x/shapes/svg?seed=meditation&backgroundColor=14b8a6',
   'Meditate for 10 minutes, use any app or technique, share screenshot or reflection, describe your experience',
   NOW(),
   NOW() + INTERVAL '14 days',
   true,
   0,
   NOW()),

  -- Challenge 7: Coding - API Integration
  ('c7777777-7777-7777-7777-777777777777',
   '🔌 API Integration Challenge',
   'Build something that integrates with a public API. Weather, crypto prices, AI - your choice!',
   'coding',
   'hard',
   175,
   'API Master',
   'https://api.dicebear.com/7.x/shapes/svg?seed=api&backgroundColor=6366f1',
   'Choose a public API, build an integration, create a demo (screenshot or video), share your code or live link',
   NOW() - INTERVAL '4 days',
   NOW() + INTERVAL '10 days',
   true,
   0,
   NOW() - INTERVAL '4 days'),

  -- Challenge 8: Design - Logo Design
  ('c8888888-8888-8888-8888-888888888888',
   '✏️ Logo Design Sprint',
   'Design a logo for an imaginary startup. Include variations and explain your design choices.',
   'design',
   'medium',
   125,
   'Logo Designer',
   'https://api.dicebear.com/7.x/shapes/svg?seed=logo&backgroundColor=f97316',
   'Create a logo for a fictional startup, include light and dark versions, explain your design process, export as image',
   NOW() - INTERVAL '6 days',
   NOW() + INTERVAL '8 days',
   true,
   0,
   NOW() - INTERVAL '6 days')
ON CONFLICT (id) DO NOTHING;


-- =====================================================
-- DONE! 
-- =====================================================
-- You now have:
-- ✅ 8 active challenges across different categories
--
-- To add submissions:
-- 1. Sign up/login to the app
-- 2. Go to a challenge
-- 3. Click "Submit Proof" and upload your content
--
-- Or use the SQL below after you have a user ID:
-- 
-- INSERT INTO submissions (user_id, challenge_id, media_url, media_type, caption, status)
-- VALUES (
--   'YOUR_USER_ID_FROM_AUTH',  -- Get this from profiles table after signing up
--   'c1111111-1111-1111-1111-111111111111',
--   'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
--   'image',
--   'My awesome submission! 🚀',
--   'approved'
-- );

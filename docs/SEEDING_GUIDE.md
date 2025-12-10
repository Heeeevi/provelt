# 📦 PROVELT Data Seeding & Content Upload Guide

## 🚀 Quick Start: Insert Seed Data

### Step 1: Open Supabase SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the sidebar
4. Click **New Query**

### Step 2: Run the Seed SQL
1. Open `supabase/seed.sql` from this project
2. Copy ALL the content
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Data
After running, you should have:
- ✅ 5 sample users
- ✅ 8 active challenges
- ✅ 14 feed submissions
- ✅ 5 badges
- ✅ Some likes

---

## 📹 Uploading Videos/Images

### Method 1: Via the App (Recommended)

1. **Login** to the app (use wallet or magic link)
2. Go to **Challenges** tab
3. Select a challenge
4. Click **Submit Proof**
5. Upload your file (image or video, max 50MB)
6. Add a caption
7. Submit!

Supported formats:
- Images: JPG, PNG, GIF, WebP
- Videos: MP4, WebM

### Method 2: Direct to Supabase Storage

1. Go to Supabase Dashboard → **Storage**
2. Find or create `submissions` bucket
3. Upload your file
4. Copy the public URL
5. Insert submission via SQL:

```sql
INSERT INTO submissions (user_id, challenge_id, media_url, media_type, caption, status)
VALUES (
  'YOUR_USER_ID',
  'CHALLENGE_ID',
  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/submissions/YOUR_FILE.mp4',
  'video', -- or 'image'
  'Your caption here',
  'approved'
);
```

### Method 3: Use External Video URLs

You can use videos from:
- **Cloudinary** (recommended)
- **YouTube** (embed URL)
- **Vimeo**
- Any direct video URL

Example with Cloudinary:
```sql
INSERT INTO submissions (user_id, challenge_id, media_url, media_type, caption, status)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'c5555555-5555-5555-5555-555555555555',
  'https://res.cloudinary.com/YOUR_CLOUD/video/upload/v123/sample.mp4',
  'video',
  '🎬 My 60-second tutorial!',
  'approved'
);
```

---

## 🎥 Free Video Resources for Testing

### Sample Videos (Direct URLs)
```
# Sample MP4 videos for testing
https://www.w3schools.com/html/mov_bbb.mp4
https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4

# Cloudinary sample videos
https://res.cloudinary.com/demo/video/upload/dog.mp4
https://res.cloudinary.com/demo/video/upload/elephants.mp4
```

### Upload Your Own Videos
1. **Cloudinary** (free tier): https://cloudinary.com/
2. **Supabase Storage** (included in your project)
3. **Imgur** (for GIFs/short videos)

---

## 🖼️ Free Image Resources

### Unsplash (High Quality Photos)
```
https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800  # Coding
https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800  # Running
https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800  # Design
https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800  # Meditation
```

### DiceBear Avatars (Generated)
```
https://api.dicebear.com/7.x/avataaars/svg?seed=USERNAME
https://api.dicebear.com/7.x/shapes/svg?seed=BADGE_NAME&backgroundColor=10b981
```

---

## 📝 Quick SQL Snippets

### Add a New Challenge
```sql
INSERT INTO challenges (title, description, category, difficulty, points, badge_name, starts_at, ends_at, is_active)
VALUES (
  '🎯 Your Challenge Title',
  'Description of what to do',
  'coding', -- or: design, fitness, learning, creative, wellness
  'beginner', -- or: intermediate, advanced
  100, -- XP points
  'Badge Name',
  NOW(),
  NOW() + INTERVAL '7 days',
  true
);
```

### Add a New Submission
```sql
INSERT INTO submissions (user_id, challenge_id, media_url, media_type, caption, status, likes_count)
VALUES (
  '11111111-1111-1111-1111-111111111111', -- Use existing user ID
  'c1111111-1111-1111-1111-111111111111', -- Use existing challenge ID  
  'https://your-image-or-video-url.com/file.jpg',
  'image', -- or 'video'
  'Your caption with emojis! 🚀',
  'approved',
  0
);
```

### Update Submission Counts
```sql
-- Update challenge submission count
UPDATE challenges 
SET submissions_count = (
  SELECT COUNT(*) FROM submissions WHERE challenge_id = challenges.id
);

-- Update user submission count  
UPDATE profiles
SET submissions_count = (
  SELECT COUNT(*) FROM submissions WHERE user_id = profiles.id AND status = 'approved'
);
```

---

## 🔧 Troubleshooting

### "Permission denied" error
Make sure RLS policies allow inserts. Run:
```sql
-- Temporarily disable RLS for seeding
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;

-- Run your INSERT statements here...

-- Re-enable RLS after seeding
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
```

### Video not playing
- Make sure the video URL is a direct link to the file (ends in .mp4 or .webm)
- Check CORS settings if using external URLs
- Verify the video is publicly accessible

### Images not loading
- Add the domain to `next.config.js` under `images.remotePatterns`
- Make sure the URL is publicly accessible

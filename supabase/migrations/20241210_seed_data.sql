-- ============================================
-- PROVELT Seed Data
-- Sample challenges and test data
-- ============================================

-- Insert sample challenges
INSERT INTO challenges (
  title,
  description,
  instructions,
  difficulty,
  category,
  tags,
  points,
  badge_name,
  starts_at,
  ends_at,
  is_active,
  is_featured
) VALUES
-- Today's featured challenge
(
  '100 Lines of Code',
  'Write 100 lines of meaningful code in any language. Could be a new feature, bug fix, or a small project.',
  '1. Write at least 100 lines of code\n2. Screenshot your editor or share a GitHub commit\n3. Explain what you built in the caption',
  'medium',
  'coding',
  ARRAY['coding', 'programming', 'development'],
  50,
  'Code Warrior',
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '23 hours',
  true,
  true
),
-- Design challenge
(
  'Design a Mobile App Screen',
  'Create a beautiful UI design for any mobile app screen. Use Figma, Sketch, or any design tool.',
  '1. Design at least one complete mobile screen\n2. Export as PNG or share Figma link\n3. Describe your design decisions',
  'medium',
  'design',
  ARRAY['design', 'ui', 'ux', 'mobile'],
  40,
  'Design Star',
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '23 hours',
  true,
  false
),
-- Fitness challenge
(
  '30 Minute Workout',
  'Complete a 30-minute workout of any type. Running, gym, yoga, or home exercises all count!',
  '1. Exercise for at least 30 minutes\n2. Take a selfie or screenshot your fitness tracker\n3. Share what workout you did',
  'easy',
  'fitness',
  ARRAY['fitness', 'health', 'workout', 'exercise'],
  30,
  'Fitness Pro',
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '23 hours',
  true,
  false
),
-- Coding challenge - harder
(
  'Build an API Endpoint',
  'Create a REST or GraphQL API endpoint with proper error handling and documentation.',
  '1. Build a functional API endpoint\n2. Include input validation\n3. Share code snippet or GitHub link\n4. Describe the endpoint purpose',
  'hard',
  'coding',
  ARRAY['api', 'backend', 'coding', 'rest'],
  75,
  'API Architect',
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '47 hours',
  true,
  false
),
-- Art challenge
(
  'Daily Sketch',
  'Draw or paint something today. Digital or traditional art - express yourself!',
  '1. Create an original artwork\n2. Photo/scan your work\n3. Share your inspiration',
  'easy',
  'art',
  ARRAY['art', 'drawing', 'creative', 'sketch'],
  25,
  'Artist Soul',
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '23 hours',
  true,
  false
),
-- Productivity challenge
(
  'Inbox Zero',
  'Clear your email inbox to zero unread messages. Organize, archive, or respond to everything!',
  '1. Process all emails in your inbox\n2. Screenshot your empty inbox\n3. Share your email management tips',
  'easy',
  'productivity',
  ARRAY['productivity', 'organization', 'email'],
  20,
  'Inbox Champion',
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '23 hours',
  true,
  false
),
-- Language challenge
(
  'Learn 10 New Words',
  'Learn 10 new vocabulary words in any language you''re studying.',
  '1. Study 10 new words\n2. Write them out with meanings\n3. Use at least 3 in sentences',
  'easy',
  'language',
  ARRAY['language', 'learning', 'vocabulary'],
  25,
  'Word Wizard',
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '23 hours',
  true,
  false
),
-- Expert coding challenge
(
  'Implement a Data Structure',
  'Implement a complex data structure from scratch: B-tree, Red-Black Tree, Skip List, or similar.',
  '1. Implement the data structure in any language\n2. Include basic operations (insert, delete, search)\n3. Write unit tests\n4. Explain time complexity',
  'expert',
  'coding',
  ARRAY['algorithms', 'data-structures', 'coding', 'cs'],
  100,
  'Algorithm Master',
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '71 hours',
  true,
  false
),
-- Cooking challenge
(
  'Cook a New Recipe',
  'Try cooking a recipe you''ve never made before. Challenge your culinary skills!',
  '1. Cook something new\n2. Photo the finished dish\n3. Share the recipe name and your experience',
  'medium',
  'cooking',
  ARRAY['cooking', 'food', 'recipe', 'culinary'],
  35,
  'Chef Explorer',
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '23 hours',
  true,
  false
),
-- Mindfulness challenge
(
  '15 Minutes of Meditation',
  'Practice mindfulness meditation for at least 15 minutes. Use an app or guided session.',
  '1. Meditate for 15+ minutes\n2. Screenshot your meditation timer/app\n3. Share how you felt before and after',
  'easy',
  'mindfulness',
  ARRAY['meditation', 'mindfulness', 'wellness', 'mental-health'],
  20,
  'Zen Master',
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '23 hours',
  true,
  false
);

-- Note: Actual user submissions and badges will be created through the app

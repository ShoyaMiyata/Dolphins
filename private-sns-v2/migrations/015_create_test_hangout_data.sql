-- Create test data for hangouts
-- This creates sample hangouts from different users for testing swipe functionality

-- IMPORTANT: Replace the user_id values with actual user IDs from your auth.users table
-- You can get user IDs by running: SELECT id, email FROM auth.users;

-- Test data using actual user IDs
-- User 1: yaushomiya@gmail.com (63ed8b99-16e2-4251-bdda-cf3b84bc6a7e)
-- User 2: shoyatrip@gmail.com (38badf70-aa09-4ac0-99cf-8c3479e28b96)

-- Create test hangouts with different creators
INSERT INTO hangouts (user_id, title, description, location, date, time, visibility_type, created_at)
VALUES
  ('63ed8b99-16e2-4251-bdda-cf3b84bc6a7e', 'カフェでランチしよう！', '駅前の新しいカフェが気になる！一緒にランチしませんか？', '駅前カフェ', '2025-01-15', '12:00', 'public', NOW() - INTERVAL '2 days'),
  ('38badf70-aa09-4ac0-99cf-8c3479e28b96', '映画見に行こう', '今週末の映画、誰か一緒に見ませんか？アクション映画が好きです！', '映画館', '2025-01-18', '14:30', 'public', NOW() - INTERVAL '1 day'),
  ('63ed8b99-16e2-4251-bdda-cf3b84bc6a7e', 'ボードゲーム会', '家でボードゲームしませんか？新しいゲーム買ったのでみんなで遊びましょう！', '自宅', '2025-01-20', '19:00', 'public', NOW() - INTERVAL '6 hours'),
  ('38badf70-aa09-4ac0-99cf-8c3479e28b96', 'ジョギングパートナー募集', '朝のジョギング、一緒に走りませんか？コースは公園周りです', '公園', '2025-01-22', '06:30', 'public', NOW() - INTERVAL '3 hours'),
  ('63ed8b99-16e2-4251-bdda-cf3b84bc6a7e', '料理教室参加しませんか？', '料理が好きなので、一緒に新しいレシピに挑戦しましょう！', 'キッチンスタジオ', '2025-01-25', '10:00', 'public', NOW() - INTERVAL '1 hour');

-- Create some responses for testing
-- (Replace user IDs with actual ones)
/*
INSERT INTO hangout_responses (hangout_id, user_id, response, created_at)
SELECT
  h.id,
  'actual-user-id-responding',
  CASE (random() * 2)::int
    WHEN 0 THEN 'yes'
    WHEN 1 THEN 'no'
    ELSE 'maybe'
  END,
  NOW() - INTERVAL '1 hour' * (random() * 24)::int
FROM hangouts h
WHERE h.user_id != 'actual-user-id-responding'
LIMIT 3;
*/

-- Verification queries:
/*
-- Check created hangouts
SELECT h.id, h.title, p.display_name, h.date, h.time
FROM hangouts h
JOIN profiles p ON h.user_id = p.id
ORDER BY h.created_at DESC;

-- Check responses
SELECT hr.hangout_id, h.title, p.display_name, hr.response
FROM hangout_responses hr
JOIN hangouts h ON hr.hangout_id = h.id
JOIN profiles p ON hr.user_id = p.id
ORDER BY hr.created_at DESC;
*/

-- How to use this test data:
-- 1. Run: SELECT id, email FROM auth.users;
-- 2. Copy 2-3 user IDs and replace 'actual-user-id-X' in the INSERT statements above
-- 3. Run the INSERT statements
-- 4. Login with one user account and check the "回答する" tab - you should see hangouts from other users

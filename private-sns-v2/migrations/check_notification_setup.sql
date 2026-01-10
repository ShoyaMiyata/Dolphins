-- Quick check for notification setup
-- Run this to verify everything is configured correctly

-- 1. Check if related_group_id column exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'notifications'
        AND column_name = 'related_group_id'
    )
    THEN '✅ related_group_id column exists'
    ELSE '❌ related_group_id column is missing'
  END AS status;

-- 2. Check notification types in constraint
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS allowed_types
FROM pg_constraint
WHERE conrelid = 'notifications'::regclass
  AND contype = 'c'
  AND conname LIKE '%type%';

-- 3. Check reactivate_member function signature
SELECT
  proname AS function_name,
  pg_get_function_arguments(oid) AS parameters,
  pg_get_functiondef(oid) LIKE '%p_inviter_id%' AS has_inviter_param
FROM pg_proc
WHERE proname = 'reactivate_member';

-- 4. Check recent group_members (last 5)
SELECT
  gm.id,
  gm.group_id,
  gm.user_id,
  gm.is_active,
  gm.created_at,
  p.username,
  g.name AS group_name
FROM group_members gm
LEFT JOIN profiles p ON gm.user_id = p.id
LEFT JOIN groups g ON gm.group_id = g.id
ORDER BY gm.created_at DESC
LIMIT 5;

-- 5. Check recent notifications (last 5)
SELECT
  n.id,
  n.type,
  n.message,
  n.related_group_id,
  n.created_at,
  p1.username AS notified_user,
  p2.username AS related_user,
  g.name AS group_name
FROM notifications n
LEFT JOIN profiles p1 ON n.user_id = p1.id
LEFT JOIN profiles p2 ON n.related_user_id = p2.id
LEFT JOIN groups g ON n.related_group_id = g.id
ORDER BY n.created_at DESC
LIMIT 5;

-- 6. Check group_invite notifications specifically
SELECT
  n.id,
  n.message,
  n.created_at,
  p1.username AS invited_user,
  p2.username AS inviter,
  g.name AS group_name
FROM notifications n
LEFT JOIN profiles p1 ON n.user_id = p1.id
LEFT JOIN profiles p2 ON n.related_user_id = p2.id
LEFT JOIN groups g ON n.related_group_id = g.id
WHERE n.type = 'group_invite'
ORDER BY n.created_at DESC
LIMIT 10;

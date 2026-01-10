-- グループ招待通知のデバッグ用クエリ

-- 1. トリガーが存在するか確認
SELECT
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  proname AS function_name,
  tgenabled AS enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname LIKE '%group%invite%' OR tgname LIKE '%group_member%'
ORDER BY tgname;

-- 2. 通知関連の関数を確認
SELECT
  proname AS function_name,
  prosrc AS function_body
FROM pg_proc
WHERE proname LIKE '%group%invite%notification%'
ORDER BY proname;

-- 3. 最新のgroup_membersレコードを確認（招待されたメンバー）
SELECT
  id,
  group_id,
  user_id,
  role,
  is_active,
  joined_at,
  created_at
FROM group_members
ORDER BY created_at DESC
LIMIT 10;

-- 4. 最新の通知を確認
SELECT
  id,
  user_id,
  type,
  related_user_id,
  related_post_id,
  related_group_id,
  message,
  is_read,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- 5. グループ招待通知のみを確認
SELECT
  n.id,
  n.user_id,
  n.type,
  n.related_user_id,
  n.related_group_id,
  n.message,
  n.created_at,
  p1.username AS invited_user,
  p2.username AS inviter_user,
  g.name AS group_name
FROM notifications n
LEFT JOIN profiles p1 ON n.user_id = p1.id
LEFT JOIN profiles p2 ON n.related_user_id = p2.id
LEFT JOIN groups g ON n.related_group_id = g.id
WHERE n.type = 'group_invite'
ORDER BY n.created_at DESC
LIMIT 10;

-- 6. notification_type_check制約を確認
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'notifications'::regclass
  AND contype = 'c'
  AND conname LIKE '%type%';

-- 7. 特定のユーザーが招待されたかチェック（user_idを置き換えてください）
-- SELECT * FROM group_members
-- WHERE user_id = 'YOUR_USER_ID_HERE'
-- ORDER BY created_at DESC;

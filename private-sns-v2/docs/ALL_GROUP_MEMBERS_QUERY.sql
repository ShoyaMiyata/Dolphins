-- 全グループメンバーを取得するクエリ（ユーザー情報付き）
-- 特定のグループIDの全メンバーを取得

-- 使用例:
-- SELECT * FROM get_all_group_members('your-group-id-here');

-- または直接実行する場合（グループIDを直接指定）:
SELECT
  gm.id,
  gm.group_id,
  gm.user_id,
  gm.role,
  gm.is_active,
  gm.joined_at,
  gm.created_at,
  gm.updated_at,

  -- ユーザー情報（profilesテーブルから）
  p.username,
  p.display_name,
  p.avatar_url,
  p.bio,
  p.created_at as user_created_at,
  p.updated_at as user_updated_at,

  -- グループ情報（必要に応じて）
  g.name as group_name,
  g.visibility_type,
  g.owner_id

FROM group_members gm

-- ユーザー情報とJOIN
INNER JOIN profiles p ON gm.user_id = p.id

-- グループ情報とJOIN（必要に応じて）
INNER JOIN groups g ON gm.group_id = g.id

-- アクティブメンバーのみ（必要に応じて）
WHERE gm.is_active = true

-- 特定のグループのメンバーのみ（直接グループIDを指定）
AND gm.group_id = 'your-group-id-here'

-- 参加日時の降順（新しいメンバーが上）
ORDER BY gm.joined_at DESC;


-- バリエーション: 全グループの全メンバーを取得（管理用）
SELECT
  gm.id,
  gm.group_id,
  gm.user_id,
  gm.role,
  gm.is_active,
  gm.joined_at,

  p.username,
  p.display_name,
  p.avatar_url,

  g.name as group_name,
  g.visibility_type

FROM group_members gm

INNER JOIN profiles p ON gm.user_id = p.id
INNER JOIN groups g ON gm.group_id = g.id

WHERE gm.is_active = true

ORDER BY g.name, gm.joined_at DESC;


-- バリエーション: 特定のユーザーが所属する全グループのメンバー一覧
-- 使用例: 'user-id-here' を実際のユーザーIDに置き換えて実行

SELECT
  gm.id,
  gm.group_id,
  gm.user_id,
  gm.role,
  gm.is_active,
  gm.joined_at,

  p.username,
  p.display_name,
  p.avatar_url,

  g.name as group_name,
  g.visibility_type

FROM group_members gm

INNER JOIN profiles p ON gm.user_id = p.id
INNER JOIN groups g ON gm.group_id = g.id

WHERE gm.is_active = true
  AND gm.group_id IN (
    SELECT group_id FROM group_members
    WHERE user_id = 'user-id-here' AND is_active = true
  )

ORDER BY g.name, gm.joined_at DESC;

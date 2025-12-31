-- 現在のhangoutsの件数を確認
SELECT COUNT(*) as total_hangouts FROM public.hangouts;

-- 最新の10件を確認
SELECT id, user_id, title, created_at, visibility_type 
FROM public.hangouts 
ORDER BY created_at DESC 
LIMIT 10;

-- ユーザー一覧
SELECT id, username, display_name 
FROM public.profiles 
LIMIT 10;

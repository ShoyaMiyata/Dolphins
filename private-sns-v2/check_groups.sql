-- 特定のグループが存在するか確認
SELECT id, name, visibility_type, owner_id FROM groups 
WHERE id IN ('d46124de-8348-470f-bd21-2fb6007c37c2', 'ddaf8a8f-6eb4-42a3-b1ab-7459716e5734');

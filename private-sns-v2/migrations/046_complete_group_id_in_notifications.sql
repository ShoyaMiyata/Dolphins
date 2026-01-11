-- Migration: Complete related_group_id in notifications
-- This migration updates triggers to ensure group interactions have related_group_id set
-- and backfills existing notifications to fix the visibility issue.

-- 1. Update Group Post Like Trigger Function
CREATE OR REPLACE FUNCTION public.create_group_post_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  v_group_id UUID;
BEGIN
  SELECT user_id, group_id INTO target_user_id, v_group_id 
  FROM group_posts WHERE id = NEW.group_post_id;
  
  IF NEW.user_id != target_user_id THEN
    INSERT INTO public.notifications (user_id, type, related_user_id, related_group_post_id, related_group_id)
    VALUES (target_user_id, 'group_post_like', NEW.user_id, NEW.group_post_id, v_group_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Group Post Reaction Trigger Function
CREATE OR REPLACE FUNCTION public.create_group_post_reaction_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  v_group_id UUID;
BEGIN
  SELECT user_id, group_id INTO target_user_id, v_group_id 
  FROM group_posts WHERE id = NEW.group_post_id;
  
  IF NEW.user_id != target_user_id THEN
    INSERT INTO public.notifications (user_id, type, related_user_id, related_group_post_id, related_group_id)
    VALUES (target_user_id, 'group_post_reaction', NEW.user_id, NEW.group_post_id, v_group_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Group Post Comment Trigger Function
CREATE OR REPLACE FUNCTION public.create_group_post_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  v_group_id UUID;
BEGIN
  SELECT user_id, group_id INTO target_user_id, v_group_id 
  FROM group_posts WHERE id = NEW.group_post_id;
  
  IF NEW.user_id != target_user_id THEN
    INSERT INTO public.notifications (user_id, type, related_user_id, related_group_post_id, related_group_id)
    VALUES (target_user_id, 'group_post_comment', NEW.user_id, NEW.group_post_id, v_group_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Backfill existing notifications with missing related_group_id
-- For group posts
UPDATE notifications n
SET related_group_id = gp.group_id
FROM group_posts gp
WHERE n.related_group_post_id = gp.id
  AND n.related_group_id IS NULL;

-- For group post comments
UPDATE notifications n
SET related_group_id = gp.group_id
FROM group_post_comments gpc
JOIN group_posts gp ON gpc.group_post_id = gp.id
WHERE n.related_group_post_comment_id = gpc.id
  AND n.related_group_id IS NULL;

-- Migration: Fix and Enhance Notifications
-- This migration adds support for comment likes/reactions and group post interactions in the notification system.

-- 1. Add missing columns to the notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_group_post_id UUID REFERENCES group_posts(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_group_post_comment_id UUID REFERENCES group_post_comments(id) ON DELETE CASCADE;

-- 2. Update the type constraint to include new notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notification_type_check;
ALTER TABLE notifications ADD CONSTRAINT notification_type_check CHECK (
  type IN (
    'like', 'comment', 'comment_reply', 'repost', 'reaction', 'follow', 'group_invite',
    'comment_like', 'comment_reaction',
    'group_post_comment', 'group_post_like', 'group_post_reaction',
    'group_join_approved', 'group_join_rejected'
  )
);

-- 3. Fix create_like_notification to handle comment likes
CREATE OR REPLACE FUNCTION public.create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF NEW.post_id IS NOT NULL THEN
    -- Post like
    SELECT user_id INTO target_user_id FROM posts WHERE id = NEW.post_id;
    
    IF NEW.user_id != target_user_id THEN
      INSERT INTO public.notifications (user_id, type, related_user_id, related_post_id)
      VALUES (target_user_id, 'like', NEW.user_id, NEW.post_id);
    END IF;
  ELSIF NEW.comment_id IS NOT NULL THEN
    -- Comment like
    SELECT user_id INTO target_user_id FROM comments WHERE id = NEW.comment_id;
    
    IF NEW.user_id != target_user_id THEN
      INSERT INTO public.notifications (user_id, type, related_user_id, related_comment_id)
      VALUES (target_user_id, 'comment_like', NEW.user_id, NEW.comment_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fix create_reaction_notification to notify comment author for comment reactions
CREATE OR REPLACE FUNCTION public.create_reaction_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF NEW.post_id IS NOT NULL THEN
    -- Post reaction
    SELECT user_id INTO target_user_id FROM posts WHERE id = NEW.post_id;
    
    IF NEW.user_id != target_user_id THEN
      INSERT INTO public.notifications (user_id, type, related_user_id, related_post_id)
      VALUES (target_user_id, 'reaction', NEW.user_id, NEW.post_id);
    END IF;
  ELSIF NEW.comment_id IS NOT NULL THEN
    -- Comment reaction
    SELECT user_id INTO target_user_id FROM comments WHERE id = NEW.comment_id;
    
    IF NEW.user_id != target_user_id THEN
      INSERT INTO public.notifications (user_id, type, related_user_id, related_comment_id)
      VALUES (target_user_id, 'comment_reaction', NEW.user_id, NEW.comment_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add triggers for group post interactions

-- Function for group post likes
CREATE OR REPLACE FUNCTION public.create_group_post_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT user_id INTO target_user_id FROM group_posts WHERE id = NEW.group_post_id;
  
  IF NEW.user_id != target_user_id THEN
    INSERT INTO public.notifications (user_id, type, related_user_id, related_group_post_id)
    VALUES (target_user_id, 'group_post_like', NEW.user_id, NEW.group_post_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for group post reactions
CREATE OR REPLACE FUNCTION public.create_group_post_reaction_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT user_id INTO target_user_id FROM group_posts WHERE id = NEW.group_post_id;
  
  IF NEW.user_id != target_user_id THEN
    INSERT INTO public.notifications (user_id, type, related_user_id, related_group_post_id)
    VALUES (target_user_id, 'group_post_reaction', NEW.user_id, NEW.group_post_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for group post comments
CREATE OR REPLACE FUNCTION public.create_group_post_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT user_id INTO target_user_id FROM group_posts WHERE id = NEW.group_post_id;
  
  IF NEW.user_id != target_user_id THEN
    INSERT INTO public.notifications (user_id, type, related_user_id, related_group_post_id)
    VALUES (target_user_id, 'group_post_comment', NEW.user_id, NEW.group_post_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create triggers for group interactions
DROP TRIGGER IF EXISTS on_group_post_like_created ON group_post_likes;
CREATE TRIGGER on_group_post_like_created
  AFTER INSERT ON group_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.create_group_post_like_notification();

DROP TRIGGER IF EXISTS on_group_post_reaction_created ON group_post_reactions;
CREATE TRIGGER on_group_post_reaction_created
  AFTER INSERT ON group_post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.create_group_post_reaction_notification();

DROP TRIGGER IF EXISTS on_group_post_comment_created ON group_post_comments;
CREATE TRIGGER on_group_post_comment_created
  AFTER INSERT ON group_post_comments
  FOR EACH ROW EXECUTE FUNCTION public.create_group_post_comment_notification();

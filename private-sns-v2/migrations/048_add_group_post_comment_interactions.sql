-- Migration: Add Group Post Comment Interactions
-- This migration enables likes and reactions for group post comments.

-- 1. Update group_post_likes table
ALTER TABLE group_post_likes ADD COLUMN IF NOT EXISTS group_post_comment_id UUID REFERENCES group_post_comments(id) ON DELETE CASCADE;
ALTER TABLE group_post_likes ALTER COLUMN group_post_id DROP NOT NULL;

-- Ensure either group_post_id OR group_post_comment_id is set
ALTER TABLE group_post_likes DROP CONSTRAINT IF EXISTS group_post_likes_target_check;
ALTER TABLE group_post_likes ADD CONSTRAINT group_post_likes_target_check 
  CHECK ((group_post_id IS NOT NULL AND group_post_comment_id IS NULL) OR (group_post_id IS NULL AND group_post_comment_id IS NOT NULL));

-- Unique constraint for users liking the same comment
ALTER TABLE group_post_likes DROP CONSTRAINT IF EXISTS group_post_likes_user_comment_unique;
ALTER TABLE group_post_likes ADD CONSTRAINT group_post_likes_user_comment_unique UNIQUE (user_id, group_post_comment_id);

-- 2. Update group_post_reactions table
ALTER TABLE group_post_reactions ADD COLUMN IF NOT EXISTS group_post_comment_id UUID REFERENCES group_post_comments(id) ON DELETE CASCADE;
ALTER TABLE group_post_reactions ALTER COLUMN group_post_id DROP NOT NULL;

-- Ensure either group_post_id OR group_post_comment_id is set
ALTER TABLE group_post_reactions DROP CONSTRAINT IF EXISTS group_post_reactions_target_check;
ALTER TABLE group_post_reactions ADD CONSTRAINT group_post_reactions_target_check 
  CHECK ((group_post_id IS NOT NULL AND group_post_comment_id IS NULL) OR (group_post_id IS NULL AND group_post_comment_id IS NOT NULL));

-- Unique constraint for users reacting to the same comment with the same emoji
ALTER TABLE group_post_reactions DROP CONSTRAINT IF EXISTS group_post_reactions_user_comment_emoji_unique;
ALTER TABLE group_post_reactions ADD CONSTRAINT group_post_reactions_user_comment_emoji_unique UNIQUE (user_id, group_post_comment_id, emoji);

-- 3. Update Notification Trigger Functions
-- Update group post like notification to handle comments
CREATE OR REPLACE FUNCTION public.create_group_post_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  v_group_id UUID;
BEGIN
  IF NEW.group_post_id IS NOT NULL THEN
    -- Post like
    SELECT user_id, group_id INTO target_user_id, v_group_id 
    FROM group_posts WHERE id = NEW.group_post_id;
    
    IF NEW.user_id != target_user_id THEN
      INSERT INTO public.notifications (user_id, type, related_user_id, related_group_post_id, related_group_id)
      VALUES (target_user_id, 'group_post_like', NEW.user_id, NEW.group_post_id, v_group_id);
    END IF;
  ELSE
    -- Comment like
    SELECT user_id INTO target_user_id FROM group_post_comments WHERE id = NEW.group_post_comment_id;
    -- Get group_id from the post associated with the comment
    SELECT gp.group_id INTO v_group_id 
    FROM group_posts gp
    JOIN group_post_comments gpc ON gpc.group_post_id = gp.id
    WHERE gpc.id = NEW.group_post_comment_id;
    
    IF NEW.user_id != target_user_id THEN
      INSERT INTO public.notifications (user_id, type, related_user_id, related_group_post_comment_id, related_group_id)
      VALUES (target_user_id, 'comment_like', NEW.user_id, NEW.group_post_comment_id, v_group_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update group post reaction notification to handle comments
CREATE OR REPLACE FUNCTION public.create_group_post_reaction_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  v_group_id UUID;
BEGIN
  IF NEW.group_post_id IS NOT NULL THEN
    -- Post reaction
    SELECT user_id, group_id INTO target_user_id, v_group_id 
    FROM group_posts WHERE id = NEW.group_post_id;
    
    IF NEW.user_id != target_user_id THEN
      INSERT INTO public.notifications (user_id, type, related_user_id, related_group_post_id, related_group_id)
      VALUES (target_user_id, 'group_post_reaction', NEW.user_id, NEW.group_post_id, v_group_id);
    END IF;
  ELSE
    -- Comment reaction
    SELECT user_id INTO target_user_id FROM group_post_comments WHERE id = NEW.group_post_comment_id;
    -- Get group_id from the post associated with the comment
    SELECT gp.group_id INTO v_group_id 
    FROM group_posts gp
    JOIN group_post_comments gpc ON gpc.group_post_id = gp.id
    WHERE gpc.id = NEW.group_post_comment_id;
    
    IF NEW.user_id != target_user_id THEN
      INSERT INTO public.notifications (user_id, type, related_user_id, related_group_post_comment_id, related_group_id)
      VALUES (target_user_id, 'comment_reaction', NEW.user_id, NEW.group_post_comment_id, v_group_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

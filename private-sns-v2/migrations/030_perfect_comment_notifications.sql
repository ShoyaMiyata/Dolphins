-- Perfect comment notification system with distinct message types
-- Ensures notifications work correctly with proper type differentiation

-- First, ensure the constraint allows both 'comment' and 'comment_reply'
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find and drop existing constraint
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
    WHERE rel.relname = 'notifications'
      AND att.attname = 'type'
      AND con.contype = 'c';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE notifications DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- Add the constraint allowing both comment types
ALTER TABLE notifications ADD CONSTRAINT notification_type_check CHECK (type IN ('like', 'comment', 'comment_reply', 'repost', 'reaction', 'follow'));

-- Create the perfect comment notification function
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Get post owner
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;

  -- Safety check: ensure post owner exists
  IF post_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Notify post owner with 'comment' type (if not the commenter)
  IF NEW.user_id != post_owner_id THEN
    -- Check if notification already exists to avoid duplicates
    IF NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = post_owner_id
        AND type = 'comment'
        AND related_user_id = NEW.user_id
        AND related_post_id = NEW.post_id
        AND created_at > NOW() - INTERVAL '1 minute'
    ) THEN
      INSERT INTO public.notifications (user_id, type, related_user_id, related_post_id)
      VALUES (
        post_owner_id,
        'comment',
        NEW.user_id,
        NEW.post_id
      );
    END IF;
  END IF;

  -- Notify other unique previous commenters with 'comment_reply' type
  -- Exclude the current commenter and the post owner (already notified above)
  INSERT INTO public.notifications (user_id, type, related_user_id, related_post_id)
  SELECT DISTINCT c.user_id, 'comment_reply', NEW.user_id, NEW.post_id
  FROM public.comments c
  WHERE c.post_id = NEW.post_id
    AND c.user_id != NEW.user_id
    AND c.user_id != post_owner_id
    -- Check if notification already exists to avoid duplicates
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = c.user_id
        AND n.type = 'comment_reply'
        AND n.related_user_id = NEW.user_id
        AND n.related_post_id = NEW.post_id
        AND n.created_at > NOW() - INTERVAL '1 minute'
    );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the comment creation
    RAISE WARNING 'Failed to create comment notifications: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

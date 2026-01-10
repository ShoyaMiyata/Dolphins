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

-- Create the perfect comment notification function with debug logging
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  previous_commenter_count INTEGER;
BEGIN
  -- Log trigger execution
  RAISE WARNING 'TRIGGER STARTED: create_comment_notification for comment_id=%, user_id=%, post_id=%', NEW.id, NEW.user_id, NEW.post_id;

  -- Get post owner
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;

  -- Safety check: ensure post owner exists
  IF post_owner_id IS NULL THEN
    RAISE WARNING 'TRIGGER END: Post owner not found for post_id: %', NEW.post_id;
    RETURN NEW;
  END IF;

  RAISE WARNING 'TRIGGER: post_owner_id=%', post_owner_id;

  -- Count previous commenters for debugging
  SELECT COUNT(DISTINCT c.user_id) INTO previous_commenter_count
  FROM public.comments c
  WHERE c.post_id = NEW.post_id
    AND c.user_id != NEW.user_id
    AND c.user_id != post_owner_id;

  RAISE WARNING 'TRIGGER: Found % previous commenters', previous_commenter_count;

  -- Notify post owner with 'comment' type (if not the commenter)
  IF NEW.user_id != post_owner_id THEN
    RAISE WARNING 'TRIGGER: Creating comment notification for post owner';
    INSERT INTO public.notifications (user_id, type, related_user_id, related_post_id)
    VALUES (
      post_owner_id,
      'comment',
      NEW.user_id,
      NEW.post_id
    );
    RAISE WARNING 'TRIGGER: Created comment notification for post owner';
  ELSE
    RAISE WARNING 'TRIGGER: Skipped notification to post owner (self-comment)';
  END IF;

  -- Notify other unique previous commenters with 'comment_reply' type
  -- Exclude only the current commenter (post owner can also receive notifications)
  -- Simplified query for debugging
  INSERT INTO public.notifications (user_id, type, related_user_id, related_post_id)
  SELECT DISTINCT c.user_id, 'comment_reply', NEW.user_id, NEW.post_id
  FROM public.comments c
  WHERE c.post_id = NEW.post_id
    AND c.user_id != NEW.user_id;

    GET DIAGNOSTICS previous_commenter_count = ROW_COUNT;
    RAISE WARNING 'TRIGGER: Created % comment_reply notifications', previous_commenter_count;
  ELSE
    RAISE WARNING 'TRIGGER: No previous commenters to notify';
  END IF;

  RAISE WARNING 'TRIGGER END: create_comment_notification completed';
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the comment creation
    RAISE WARNING 'TRIGGER ERROR: Failed to create comment notifications: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

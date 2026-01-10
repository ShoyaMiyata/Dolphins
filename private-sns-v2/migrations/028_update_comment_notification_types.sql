-- Update notification types to distinguish between owner and participant comment notifications
-- First, update the check constraint to allow new types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notification_type;
ALTER TABLE notifications ADD CONSTRAINT notification_type CHECK (type IN ('like', 'comment', 'comment_reply', 'repost', 'reaction', 'follow'));

-- Update the comment notification function to use different types with better error handling
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

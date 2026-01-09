-- Update comment notification function to notify previous commenters
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Get post owner
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;

  -- Notify post owner (if not the commenter)
  IF NEW.user_id != post_owner_id THEN
    INSERT INTO public.notifications (user_id, type, related_user_id, related_post_id)
    VALUES (
      post_owner_id,
      'comment',
      NEW.user_id,
      NEW.post_id
    );
  END IF;

  -- Notify other unique previous commenters
  -- Exclude the current commenter and the post owner (already notified above)
  INSERT INTO public.notifications (user_id, type, related_user_id, related_post_id)
  SELECT DISTINCT user_id, 'comment', NEW.user_id, NEW.post_id
  FROM public.comments
  WHERE post_id = NEW.post_id
    AND user_id != NEW.user_id
    AND user_id != post_owner_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

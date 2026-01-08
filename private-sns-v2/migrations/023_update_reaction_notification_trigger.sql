-- Update the reaction notification trigger to handle comment reactions

-- Recreate the function to handle both post and comment reactions
CREATE OR REPLACE FUNCTION public.create_reaction_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  target_post_id UUID;
BEGIN
  -- Determine the target user and post based on whether it's a post or comment reaction
  IF NEW.post_id IS NOT NULL THEN
    -- Post reaction
    SELECT user_id INTO target_user_id FROM posts WHERE id = NEW.post_id;
    target_post_id := NEW.post_id;
  ELSIF NEW.comment_id IS NOT NULL THEN
    -- Comment reaction - get the post owner
    SELECT p.user_id, c.post_id INTO target_user_id, target_post_id
    FROM comments c
    JOIN posts p ON c.post_id = p.id
    WHERE c.id = NEW.comment_id;
  ELSE
    -- Invalid reaction, skip
    RETURN NEW;
  END IF;

  -- Don't create notification if user reacts to their own post/comment
  IF NEW.user_id != target_user_id THEN
    INSERT INTO public.notifications (user_id, type, related_user_id, related_post_id)
    VALUES (
      target_user_id,
      'reaction',
      NEW.user_id,
      target_post_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_reaction_created ON reactions;
CREATE TRIGGER on_reaction_created
  AFTER INSERT ON reactions
  FOR EACH ROW EXECUTE FUNCTION public.create_reaction_notification();

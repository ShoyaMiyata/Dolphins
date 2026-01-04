-- Create notification functions and triggers

-- Function to create notification for likes
CREATE OR REPLACE FUNCTION public.create_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't create notification if user likes their own post
  IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    INSERT INTO public.notifications (user_id, type, related_user_id, related_post_id)
    VALUES (
      (SELECT user_id FROM posts WHERE id = NEW.post_id),
      'like',
      NEW.user_id,
      NEW.post_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for comments
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't create notification if user comments on their own post
  IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    INSERT INTO public.notifications (user_id, type, related_user_id, related_post_id)
    VALUES (
      (SELECT user_id FROM posts WHERE id = NEW.post_id),
      'comment',
      NEW.user_id,
      NEW.post_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for reposts
CREATE OR REPLACE FUNCTION public.create_repost_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't create notification if user reposts their own post
  IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    INSERT INTO public.notifications (user_id, type, related_user_id, related_post_id)
    VALUES (
      (SELECT user_id FROM posts WHERE id = NEW.post_id),
      'repost',
      NEW.user_id,
      NEW.post_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for reactions
CREATE OR REPLACE FUNCTION public.create_reaction_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't create notification if user reacts to their own post
  IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    INSERT INTO public.notifications (user_id, type, related_user_id, related_post_id)
    VALUES (
      (SELECT user_id FROM posts WHERE id = NEW.post_id),
      'reaction',
      NEW.user_id,
      NEW.post_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for follows
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, related_user_id)
  VALUES (
    NEW.following_id,
    'follow',
    NEW.follower_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_like_created ON likes;
CREATE TRIGGER on_like_created
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION public.create_like_notification();

DROP TRIGGER IF EXISTS on_comment_created ON comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION public.create_comment_notification();

DROP TRIGGER IF EXISTS on_repost_created ON reposts;
CREATE TRIGGER on_repost_created
  AFTER INSERT ON reposts
  FOR EACH ROW EXECUTE FUNCTION public.create_repost_notification();

DROP TRIGGER IF EXISTS on_reaction_created ON reactions;
CREATE TRIGGER on_reaction_created
  AFTER INSERT ON reactions
  FOR EACH ROW EXECUTE FUNCTION public.create_reaction_notification();

DROP TRIGGER IF EXISTS on_follow_created ON follows;
CREATE TRIGGER on_follow_created
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION public.create_follow_notification();

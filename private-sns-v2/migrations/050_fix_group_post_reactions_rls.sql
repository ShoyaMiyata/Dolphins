-- Migration: Fix Group Post Reactions/Likes RLS and unify notification triggers
-- Background:
--   048 made group_post_id nullable and added group_post_comment_id to support
--   comment likes/reactions, but the SELECT RLS policies from 040 still only
--   reference group_post_id via JOIN. Since `.insert().select().single()` runs the
--   SELECT policy to return the inserted row, the policy mismatch returns 0 rows and
--   the client throws ("リアクションできませんでした"). This migration rebuilds the
--   SELECT policies to cover both post- and comment-targeted rows, and re-applies the
--   notification trigger functions/triggers so the comment-aware (NULL-branching)
--   definitions are authoritative regardless of prior migration ordering.

-- 1. Rebuild SELECT policy for group_post_reactions (post OR comment targeted)
DROP POLICY IF EXISTS "Group interactions are viewable by group members" ON public.group_post_reactions;
CREATE POLICY "Group interactions are viewable by group members" ON public.group_post_reactions
  FOR SELECT USING (
    (group_post_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.group_posts gp
      JOIN public.group_members gm ON gp.group_id = gm.group_id
      WHERE gp.id = group_post_reactions.group_post_id
      AND gm.user_id = auth.uid()
    ))
    OR
    (group_post_comment_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.group_post_comments gpc
      JOIN public.group_posts gp ON gpc.group_post_id = gp.id
      JOIN public.group_members gm ON gp.group_id = gm.group_id
      WHERE gpc.id = group_post_reactions.group_post_comment_id
      AND gm.user_id = auth.uid()
    ))
  );

-- 2. Rebuild SELECT policy for group_post_likes (post OR comment targeted)
DROP POLICY IF EXISTS "Group interactions are viewable by group members" ON public.group_post_likes;
CREATE POLICY "Group interactions are viewable by group members" ON public.group_post_likes
  FOR SELECT USING (
    (group_post_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.group_posts gp
      JOIN public.group_members gm ON gp.group_id = gm.group_id
      WHERE gp.id = group_post_likes.group_post_id
      AND gm.user_id = auth.uid()
    ))
    OR
    (group_post_comment_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.group_post_comments gpc
      JOIN public.group_posts gp ON gpc.group_post_id = gp.id
      JOIN public.group_members gm ON gp.group_id = gm.group_id
      WHERE gpc.id = group_post_likes.group_post_comment_id
      AND gm.user_id = auth.uid()
    ))
  );

-- 3. Re-apply comment-aware notification trigger functions (authoritative definitions)
CREATE OR REPLACE FUNCTION public.create_group_post_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  v_group_id UUID;
BEGIN
  IF NEW.group_post_id IS NOT NULL THEN
    SELECT user_id, group_id INTO target_user_id, v_group_id
    FROM group_posts WHERE id = NEW.group_post_id;

    IF NEW.user_id != target_user_id THEN
      INSERT INTO public.notifications (user_id, type, related_user_id, related_group_post_id, related_group_id)
      VALUES (target_user_id, 'group_post_like', NEW.user_id, NEW.group_post_id, v_group_id);
    END IF;
  ELSE
    SELECT user_id INTO target_user_id FROM group_post_comments WHERE id = NEW.group_post_comment_id;
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

CREATE OR REPLACE FUNCTION public.create_group_post_reaction_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  v_group_id UUID;
BEGIN
  IF NEW.group_post_id IS NOT NULL THEN
    SELECT user_id, group_id INTO target_user_id, v_group_id
    FROM group_posts WHERE id = NEW.group_post_id;

    IF NEW.user_id != target_user_id THEN
      INSERT INTO public.notifications (user_id, type, related_user_id, related_group_post_id, related_group_id)
      VALUES (target_user_id, 'group_post_reaction', NEW.user_id, NEW.group_post_id, v_group_id);
    END IF;
  ELSE
    SELECT user_id INTO target_user_id FROM group_post_comments WHERE id = NEW.group_post_comment_id;
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

-- 4. Re-bind triggers so they reference the latest function definitions
DROP TRIGGER IF EXISTS on_group_post_like_created ON group_post_likes;
CREATE TRIGGER on_group_post_like_created
  AFTER INSERT ON group_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.create_group_post_like_notification();

DROP TRIGGER IF EXISTS on_group_post_reaction_created ON group_post_reactions;
CREATE TRIGGER on_group_post_reaction_created
  AFTER INSERT ON group_post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.create_group_post_reaction_notification();

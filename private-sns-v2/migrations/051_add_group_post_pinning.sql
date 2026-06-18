-- Migration: Add pinning to group posts
-- Allows any group member to pin/unpin posts so they surface at the top of the
-- channel. Pinned posts are ordered by pinned_at DESC, then created_at DESC.
-- Pin state is mutated only through the SECURITY DEFINER RPC below, which verifies
-- group membership. The post-body UPDATE policy from 011 (author-only) is left
-- untouched so members cannot edit each other's content.

ALTER TABLE group_posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE group_posts ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_group_posts_pinned
  ON group_posts(group_id, is_pinned DESC, pinned_at DESC, created_at DESC);

CREATE OR REPLACE FUNCTION public.toggle_group_post_pin(p_post_id UUID, p_pinned BOOLEAN)
RETURNS void AS $$
DECLARE
  v_group_id UUID;
BEGIN
  SELECT group_id INTO v_group_id FROM group_posts WHERE id = p_post_id;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'group post not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = v_group_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not a group member';
  END IF;

  UPDATE group_posts
    SET is_pinned = p_pinned,
        pinned_at = CASE WHEN p_pinned THEN NOW() ELSE NULL END
    WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

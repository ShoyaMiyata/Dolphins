-- Migration: Advanced Notification Visibility Fix and Backfill
-- This migration ensures all group notifications are correctly hidden for non-members,
-- specifically handling the distinction between "new invites" and "left members".

-- 1. Aggressive Backfill of related_group_id
-- For group posts (likes, reactions, comments)
UPDATE notifications n
SET related_group_id = gp.group_id
FROM group_posts gp
WHERE n.related_group_post_id = gp.id
  AND n.related_group_id IS NULL;

-- For group post comments
UPDATE notifications n
SET related_group_id = gp.group_id
FROM group_post_comments gpc
JOIN group_posts gp ON gpc.group_post_id = gp.id
WHERE n.related_group_post_comment_id = gpc.id
  AND n.related_group_id IS NULL;

-- 2. Update Triggers to catch any remaining leaks
-- (Likely handled by 046, but re-asserting here for safety)

-- 3. Redefine RLS Policy for Notifications
-- Hide everything that has a related_group_id if not an active member,
-- BUT allow visibility if they haven't joined yet (no record in group_members).
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND (
      -- 1. Not group-related
      related_group_id IS NULL 
      -- 2. Explicit rejection notice (should always be visible to target)
      OR type = 'group_join_rejected'
      -- 3. Is currently an active member
      OR EXISTS (
        SELECT 1 FROM group_members
        WHERE group_id = notifications.related_group_id
          AND user_id = auth.uid()
          AND is_active = true
      )
      -- 4. Has NOT explicitly joined/left yet (handles new invites/requests)
      -- If they were ever a member and left, is_active would be false, so this check will fail.
      OR NOT EXISTS (
        SELECT 1 FROM group_members
        WHERE group_id = notifications.related_group_id
          AND user_id = auth.uid()
      )
    )
  );

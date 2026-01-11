-- Migration: Refine Notification Visibility
-- This migration updates the RLS policy for notifications to hide group-related 
-- notifications for users who are no longer active members of the associated group.

-- 1. Drop the existing select policy
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

-- 2. Create a refined select policy
-- Users can see their own notifications only if:
-- a) It's not group-related (related_group_id IS NULL)
-- b) OR it's a join rejection notice (type = 'group_join_rejected')
-- c) OR they are currently an active member of that group
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND (
      related_group_id IS NULL 
      OR type = 'group_join_rejected'
      OR EXISTS (
        SELECT 1 FROM group_members
        WHERE group_id = notifications.related_group_id
          AND user_id = auth.uid()
          AND is_active = true
      )
    )
  );

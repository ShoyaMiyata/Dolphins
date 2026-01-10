-- Fix groups RLS policy to include is_active condition for private groups

-- Drop existing policy
DROP POLICY IF EXISTS "Private groups are viewable by members" ON groups;

-- Recreate policy with is_active condition
CREATE POLICY "Private groups are viewable by members" ON groups
  FOR SELECT USING (
    visibility_type = 'private' AND
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.is_active = true
    )
  );

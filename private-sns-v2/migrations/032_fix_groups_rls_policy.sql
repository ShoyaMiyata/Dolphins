-- Fix infinite recursion in RLS policies

-- Drop problematic policies that cause circular references
DROP POLICY IF EXISTS "Private groups are viewable by members" ON groups;
DROP POLICY IF EXISTS "Group members are viewable by group members" ON group_members;

-- Recreate group members policy without circular reference
CREATE POLICY "Group members are viewable by authenticated users" ON group_members
  FOR SELECT USING (
    -- Allow access to own membership records
    user_id = auth.uid() OR
    -- Allow access to group member records for admins of that group
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
      AND gm.is_active = true
    )
  );

-- Recreate groups policy with proper conditions
CREATE POLICY "Private groups are viewable by members" ON groups
  FOR SELECT USING (
    visibility_type = 'public' OR
    (
      visibility_type = 'private' AND
      EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
        AND group_members.is_active = true
      )
    )
  );

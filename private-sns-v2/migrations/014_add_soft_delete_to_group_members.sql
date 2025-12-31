-- Add soft delete functionality to group_members table
-- This allows us to track member history and handle re-invites properly

ALTER TABLE group_members
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN left_at TIMESTAMP WITH TIME ZONE;

-- Update existing records to be active
UPDATE group_members SET is_active = true WHERE is_active IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_group_members_is_active ON group_members(is_active);
CREATE INDEX IF NOT EXISTS idx_group_members_left_at ON group_members(left_at);

-- Update RLS policies to only show active members by default
-- But allow admins to see inactive members for re-invite purposes

-- Update the member viewing policy to only show active members by default
DROP POLICY IF EXISTS "Group members are viewable by group members" ON group_members;
CREATE POLICY "Active group members are viewable by group members" ON group_members
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.is_active = true
    )
  );

-- Allow admins to view inactive members for re-invite purposes
CREATE POLICY "Inactive group members are viewable by admins" ON group_members
  FOR SELECT USING (
    is_active = false AND
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
      AND gm.is_active = true
    )
  );

-- Update insert policy to handle re-activation
DROP POLICY IF EXISTS "Users can join groups (free)" ON group_members;
CREATE POLICY "Users can join groups (free) or reactivate membership" ON group_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.join_type = 'free'
    )
  );

-- Update admin invite policy
DROP POLICY IF EXISTS "Group owners and admins can invite members" ON group_members;
CREATE POLICY "Group owners and admins can invite or reactivate members" ON group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
      AND gm.is_active = true
    )
  );

-- Update update policy
DROP POLICY IF EXISTS "Group owners and admins can update member roles" ON group_members;
CREATE POLICY "Group owners and admins can update active member roles" ON group_members
  FOR UPDATE USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
      AND gm.is_active = true
    )
  );

-- Update delete policy to use soft delete
DROP POLICY IF EXISTS "Users can leave groups, owners/admins can remove members" ON group_members;
CREATE POLICY "Users can soft leave groups, owners/admins can soft remove members" ON group_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
      AND gm.is_active = true
    ) OR
    auth.uid() = user_id
  );

-- Function to handle soft delete (leave group)
CREATE OR REPLACE FUNCTION public.soft_leave_group(
  p_group_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  member_record RECORD;
BEGIN
  -- Get the member record
  SELECT * INTO member_record
  FROM group_members
  WHERE group_id = p_group_id AND user_id = p_user_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if owner is trying to leave
  IF member_record.role = 'owner' THEN
    -- Check if there are other active members
    IF EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = p_group_id AND user_id != p_user_id AND is_active = true
    ) THEN
      RETURN false; -- Owner cannot leave if there are other members
    ELSE
      -- If owner is the only member, allow leaving (group becomes inactive)
      UPDATE group_members
      SET is_active = false, left_at = NOW()
      WHERE group_id = p_group_id AND user_id = p_user_id;
      RETURN true;
    END IF;
  ELSE
    -- Regular member leaving
    UPDATE group_members
    SET is_active = false, left_at = NOW()
    WHERE group_id = p_group_id AND user_id = p_user_id;
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle soft remove member (admin removing member)
CREATE OR REPLACE FUNCTION public.soft_remove_member(
  p_group_id UUID,
  p_user_id UUID,
  p_remover_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  remover_record RECORD;
  target_record RECORD;
BEGIN
  -- Check if remover has permission
  SELECT * INTO remover_record
  FROM group_members
  WHERE group_id = p_group_id AND user_id = p_remover_id AND is_active = true
  AND role IN ('owner', 'admin');

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Get target member
  SELECT * INTO target_record
  FROM group_members
  WHERE group_id = p_group_id AND user_id = p_user_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Cannot remove owner
  IF target_record.role = 'owner' THEN
    RETURN false;
  END IF;

  -- Soft delete the member
  UPDATE group_members
  SET is_active = false, left_at = NOW()
  WHERE group_id = p_group_id AND user_id = p_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reactivate member (for re-invites)
CREATE OR REPLACE FUNCTION public.reactivate_member(
  p_group_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if inactive member exists
  IF EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND is_active = false
  ) THEN
    -- Reactivate the member
    UPDATE group_members
    SET is_active = true, left_at = NULL, joined_at = NOW()
    WHERE group_id = p_group_id AND user_id = p_user_id;
    RETURN true;
  ELSE
    -- Insert new member record
    INSERT INTO group_members (group_id, user_id, role, is_active)
    VALUES (p_group_id, p_user_id, 'member', true);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

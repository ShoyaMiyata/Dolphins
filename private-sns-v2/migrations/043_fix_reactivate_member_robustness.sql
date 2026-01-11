-- Migration: Robust reactivate_member function
-- This migration updates reactivate_member to handle existing active/inactive members gracefully.

CREATE OR REPLACE FUNCTION public.reactivate_member(
  p_group_id UUID,
  p_user_id UUID,
  p_inviter_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_group_name TEXT;
  v_existing_role TEXT;
  v_is_active BOOLEAN;
BEGIN
  -- Check existing membership
  SELECT role, is_active INTO v_existing_role, v_is_active
  FROM group_members
  WHERE group_id = p_group_id AND user_id = p_user_id;

  IF FOUND THEN
    IF NOT v_is_active THEN
      -- Reactivate if inactive
      UPDATE group_members
      SET is_active = true, left_at = NULL, joined_at = NOW()
      WHERE group_id = p_group_id AND user_id = p_user_id;
    END IF;
    -- If already active, we just fall through and maybe create notification
  ELSE
    -- Insert new member record if not found at all
    INSERT INTO group_members (group_id, user_id, role, is_active)
    VALUES (p_group_id, p_user_id, 'member', true);
  END IF;

  -- Create notification if inviter_id is provided and it's not the user themselves
  IF p_inviter_id IS NOT NULL AND p_inviter_id != p_user_id THEN
    -- Get group name
    SELECT name INTO v_group_name FROM groups WHERE id = p_group_id;

    -- Create notification for invited user
    INSERT INTO public.notifications (user_id, type, related_user_id, related_group_id, message)
    VALUES (
      p_user_id,
      'group_invite',
      p_inviter_id,
      p_group_id,
      COALESCE(v_group_name, 'グループ') || ' に招待されました'
    );
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

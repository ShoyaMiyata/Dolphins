-- Fix group invite notification conflicts
-- Separate notification functions for group_members and group_invites tables

-- Drop the conflicting trigger on group_members
DROP TRIGGER IF EXISTS on_group_member_invited ON group_members;

-- Create a separate function for group_members invite notifications
CREATE OR REPLACE FUNCTION public.create_group_member_invite_notification()
RETURNS TRIGGER AS $$
DECLARE
  group_name TEXT;
  inviter_id UUID;
BEGIN
  -- Get the current user who is inviting (from auth context)
  inviter_id := auth.uid();

  -- Only create notification when:
  -- 1. User is being invited by someone else (not self-joining)
  -- 2. Member is being activated (new or reactivated)
  IF NEW.is_active = true AND inviter_id IS NOT NULL AND inviter_id != NEW.user_id THEN
    -- Get group name
    SELECT name INTO group_name FROM groups WHERE id = NEW.group_id;

    -- Create notification for invited user
    INSERT INTO public.notifications (user_id, type, related_user_id, related_group_id, message)
    VALUES (
      NEW.user_id,
      'group_invite',
      inviter_id,
      NEW.group_id,
      COALESCE(group_name, 'グループ') || ' に招待されました'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger for group_members with the correct function
DROP TRIGGER IF EXISTS on_group_member_invited ON group_members;
CREATE TRIGGER on_group_member_invited
  AFTER INSERT ON group_members
  FOR EACH ROW EXECUTE FUNCTION public.create_group_member_invite_notification();

-- Update reactivate_member function to support inviter tracking
-- This is needed because we need to know who is doing the invite
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

-- Ensure the group_invites notification function is still correct
-- (This was defined in 031_add_group_invites.sql)
CREATE OR REPLACE FUNCTION public.create_group_invite_notification()
RETURNS TRIGGER AS $$
DECLARE
  group_name TEXT;
BEGIN
  -- Get group name
  SELECT name INTO group_name FROM groups WHERE id = NEW.group_id;

  -- Create notification for invited user
  INSERT INTO public.notifications (user_id, type, related_user_id, related_group_id, message)
  VALUES (
    NEW.invited_user_id,
    'group_invite',
    NEW.invited_by_user_id,
    NEW.group_id,
    COALESCE(group_name, 'グループ') || ' への招待が届きました'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

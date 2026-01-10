-- Fix group invite notification by passing inviter_id explicitly
-- Problem: auth.uid() returns NULL in SECURITY DEFINER functions

-- Update reactivate_member to accept and return inviter_id
CREATE OR REPLACE FUNCTION public.reactivate_member(
  p_group_id UUID,
  p_user_id UUID,
  p_inviter_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_group_name TEXT;
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
  ELSE
    -- Insert new member record
    INSERT INTO group_members (group_id, user_id, role, is_active)
    VALUES (p_group_id, p_user_id, 'member', true);
  END IF;

  -- Create notification if inviter_id is provided
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

    -- Log for debugging
    RAISE NOTICE 'Created notification: user_id=%, inviter_id=%, group_id=%, group_name=%',
      p_user_id, p_inviter_id, p_group_id, v_group_name;
  ELSE
    RAISE NOTICE 'Skipped notification: inviter_id=%, user_id=%', p_inviter_id, p_user_id;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove the trigger-based notification creation since we're doing it in the function
DROP TRIGGER IF EXISTS on_group_member_invited ON group_members;
DROP FUNCTION IF EXISTS public.create_group_member_invite_notification();

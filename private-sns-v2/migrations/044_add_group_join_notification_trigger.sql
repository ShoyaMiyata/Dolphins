-- Migration: Group Join Notifications
-- This migration adds support for notifying all group members when a new member joins or is reactivated.

-- 1. Update the notification type constraint to include 'group_member_joined'
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notification_type_check;
ALTER TABLE notifications ADD CONSTRAINT notification_type_check CHECK (
  type IN (
    'like', 'comment', 'comment_reply', 'repost', 'reaction', 'follow', 'group_invite',
    'comment_like', 'comment_reaction',
    'group_post_comment', 'group_post_like', 'group_post_reaction',
    'group_join_approved', 'group_join_rejected',
    'group_member_joined'
  )
);

-- 2. Create function to notify all group members when someone joins
CREATE OR REPLACE FUNCTION public.create_group_join_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_group_name TEXT;
  v_joined_user_display_name TEXT;
BEGIN
  -- We only want to notify when a member becomes active (either new insert or reactivation)
  IF (TG_OP = 'INSERT' AND NEW.is_active = true) OR 
     (TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true) THEN
    
    -- Get group name
    SELECT name INTO v_group_name FROM groups WHERE id = NEW.group_id;
    
    -- Get joined user's name
    SELECT COALESCE(display_name, username) INTO v_joined_user_display_name 
    FROM profiles 
    WHERE id = NEW.user_id;

    -- Insert notifications for all OTHER active members of the group
    -- Exclude the person who performed the action (auth.uid()) to avoid notifying the inviter/approver
    INSERT INTO public.notifications (user_id, type, related_user_id, related_group_id, message)
    SELECT 
      user_id, 
      'group_member_joined', 
      NEW.user_id, 
      NEW.group_id,
      v_joined_user_display_name || ' さんが ' || COALESCE(v_group_name, 'グループ') || ' に参加しました'
    FROM group_members
    WHERE group_id = NEW.group_id 
      AND user_id != NEW.user_id 
      AND user_id != auth.uid() -- Exclude the requester
      AND is_active = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger on group_members
DROP TRIGGER IF EXISTS on_group_member_joined ON group_members;
CREATE TRIGGER on_group_member_joined
  AFTER INSERT OR UPDATE ON group_members
  FOR EACH ROW EXECUTE FUNCTION public.create_group_join_notification();

-- Add notifications for group join request approval/rejection
-- Automatically notify users when their join requests are approved or rejected

-- Add 'group_join_approved' and 'group_join_rejected' to notification types
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find and drop existing constraint
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
    WHERE rel.relname = 'notifications'
      AND att.attname = 'type'
      AND con.contype = 'c';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE notifications DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

ALTER TABLE notifications ADD CONSTRAINT notification_type_check CHECK (type IN ('like', 'comment', 'comment_reply', 'repost', 'reaction', 'follow', 'group_invite', 'group_join_approved', 'group_join_rejected'));

-- Function to create notification when group join request is approved or rejected
CREATE OR REPLACE FUNCTION public.create_group_join_request_notification()
RETURNS TRIGGER AS $$
DECLARE
  group_name TEXT;
  approver_name TEXT;
BEGIN
  -- Only create notification when status changes from pending to approved or rejected
  IF OLD.status = 'pending' AND (NEW.status = 'approved' OR NEW.status = 'rejected') THEN
    -- Get group name
    SELECT name INTO group_name FROM groups WHERE id = NEW.group_id;

    -- Get approver name (the person who approved/rejected)
    SELECT display_name INTO approver_name FROM profiles WHERE id = NEW.approved_by_user_id;

    -- Create notification for the user who requested to join
    INSERT INTO public.notifications (user_id, type, related_user_id, related_group_id, message)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.status = 'approved' THEN 'group_join_approved' ELSE 'group_join_rejected' END,
      NEW.approved_by_user_id,
      NEW.group_id,
      CASE WHEN NEW.status = 'approved'
           THEN COALESCE(group_name, 'グループ') || ' への参加が承認されました'
           ELSE COALESCE(group_name, 'グループ') || ' への参加が拒否されました'
      END
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for group join request notifications
DROP TRIGGER IF EXISTS on_group_join_request_status_change ON group_join_requests;
CREATE TRIGGER on_group_join_request_status_change
  AFTER UPDATE ON group_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.create_group_join_request_notification();

-- Function to handle group join request approval (add user to group_members)
CREATE OR REPLACE FUNCTION public.handle_group_join_request_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- If join request is approved, add user to group members
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (NEW.group_id, NEW.user_id, 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for group join request approval
DROP TRIGGER IF EXISTS on_group_join_request_approved ON group_join_requests;
CREATE TRIGGER on_group_join_request_approved
  AFTER UPDATE ON group_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_group_join_request_approval();

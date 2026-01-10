-- Complete fix for group invite notifications
-- Run this in Supabase SQL Editor

-- ===================================================================
-- STEP 1: Add related_group_id column to notifications table
-- ===================================================================
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_related_group_id ON notifications(related_group_id);

-- ===================================================================
-- STEP 2: Add group notification types to constraint
-- ===================================================================
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

-- Add new constraint with all notification types
ALTER TABLE notifications ADD CONSTRAINT notification_type_check
  CHECK (type IN (
    'like',
    'comment',
    'comment_reply',
    'repost',
    'reaction',
    'follow',
    'group_invite',
    'group_join_approved',
    'group_join_rejected'
  ));

-- ===================================================================
-- STEP 3: Update reactivate_member function to create notifications
-- ===================================================================
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

-- ===================================================================
-- STEP 4: Clean up old triggers (if they exist)
-- ===================================================================
DROP TRIGGER IF EXISTS on_group_member_invited ON group_members;
DROP FUNCTION IF EXISTS public.create_group_member_invite_notification();

-- ===================================================================
-- STEP 5: Create notification functions for group_invites table (if exists)
-- ===================================================================
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

-- Only create trigger if group_invites table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_invites') THEN
    DROP TRIGGER IF EXISTS on_group_invite_created ON group_invites;
    CREATE TRIGGER on_group_invite_created
      AFTER INSERT ON group_invites
      FOR EACH ROW EXECUTE FUNCTION public.create_group_invite_notification();
  END IF;
END $$;

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================

-- Check if related_group_id column exists
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
  AND column_name = 'related_group_id';

-- Check notification type constraint
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'notifications'::regclass
  AND contype = 'c'
  AND conname LIKE '%type%';

-- Check reactivate_member function
SELECT
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments
FROM pg_proc
WHERE proname = 'reactivate_member';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All migrations completed successfully!';
  RAISE NOTICE 'You can now test group invitations.';
END $$;

-- Add group invites functionality
-- Enables private groups to invite members with notifications

-- Add 'invite' option to join_type constraint
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_join_type_check;
ALTER TABLE groups ADD CONSTRAINT groups_join_type_check CHECK (join_type IN ('free', 'approval', 'invite'));

-- Create group_invites table
CREATE TABLE IF NOT EXISTS group_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- UNIQUE制約を削除して再招待を可能にする
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_group_invites_group_id ON group_invites(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_invited_user_id ON group_invites(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_invited_by_user_id ON group_invites(invited_by_user_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_status ON group_invites(status);
CREATE INDEX IF NOT EXISTS idx_group_invites_created_at ON group_invites(created_at DESC);

-- Enable RLS
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_invites
CREATE POLICY "Group members can view invites for their group" ON group_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_invites.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Invited users can view their own invites" ON group_invites
  FOR SELECT USING (auth.uid() = invited_user_id);

CREATE POLICY "Group owners and admins can create invites" ON group_invites
  FOR INSERT WITH CHECK (
    auth.uid() = invited_by_user_id AND
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_invites.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('owner', 'admin')
    ) AND
    -- Cannot invite existing members
    NOT EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_invites.group_id
      AND group_members.user_id = group_invites.invited_user_id
    )
  );

CREATE POLICY "Invited users can update their invite status" ON group_invites
  FOR UPDATE USING (auth.uid() = invited_user_id)
  WITH CHECK (auth.uid() = invited_user_id);

CREATE POLICY "Group owners and admins can update invites" ON group_invites
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_invites.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('owner', 'admin')
    )
  );

-- Add group_invite to notification types
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

ALTER TABLE notifications ADD CONSTRAINT notification_type_check CHECK (type IN ('like', 'comment', 'comment_reply', 'repost', 'reaction', 'follow', 'group_invite'));

-- Function to create notification when group invite is created
CREATE OR REPLACE FUNCTION public.create_group_invite_notification()
RETURNS TRIGGER AS $$
DECLARE
  group_name TEXT;
BEGIN
  -- Get group name
  SELECT name INTO group_name FROM groups WHERE id = NEW.group_id;

  -- Create notification for invited user
  INSERT INTO public.notifications (user_id, type, related_user_id, related_post_id, message)
  VALUES (
    NEW.invited_user_id,
    'group_invite',
    NEW.invited_by_user_id,
    NEW.group_id,
    group_name || ' への招待が届きました'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for group invite notifications
DROP TRIGGER IF EXISTS on_group_invite_created ON group_invites;
CREATE TRIGGER on_group_invite_created
  AFTER INSERT ON group_invites
  FOR EACH ROW EXECUTE FUNCTION public.create_group_invite_notification();

-- Function to handle group invite acceptance
CREATE OR REPLACE FUNCTION public.handle_group_invite_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- If invite is accepted, add user to group members
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (NEW.group_id, NEW.invited_user_id, 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for group invite acceptance
DROP TRIGGER IF EXISTS on_group_invite_status_change ON group_invites;
CREATE TRIGGER on_group_invite_status_change
  AFTER UPDATE ON group_invites
  FOR EACH ROW EXECUTE FUNCTION public.handle_group_invite_acceptance();

-- Update trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON group_invites;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON group_invites
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

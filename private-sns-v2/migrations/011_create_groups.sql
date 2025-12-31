-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  join_type TEXT NOT NULL DEFAULT 'free' CHECK (join_type IN ('free', 'approval')),
  visibility_type TEXT NOT NULL DEFAULT 'public' CHECK (visibility_type IN ('public', 'private')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100)
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create group_join_requests table
CREATE TABLE IF NOT EXISTS group_join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create group_posts table
CREATE TABLE IF NOT EXISTS group_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT group_content_length CHECK (char_length(content) <= 500)
);

-- Create group_post_images table
CREATE TABLE IF NOT EXISTS group_post_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_post_id UUID NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_group_id ON group_join_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_status ON group_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_user_id ON group_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_created_at ON group_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_post_images_group_post_id ON group_post_images(group_post_id);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_post_images ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Groups are viewable by everyone for public groups" ON groups
  FOR SELECT USING (visibility_type = 'public');

CREATE POLICY "Private groups are viewable by members" ON groups
  FOR SELECT USING (
    visibility_type = 'private' AND
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners and admins can update groups" ON groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Group owners can delete groups" ON groups
  FOR DELETE USING (auth.uid() = owner_id);

-- Group members policies
CREATE POLICY "Group members are viewable by group members" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group admins can view members for invitation purposes" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can join groups (free)" ON group_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.join_type = 'free'
    )
  );

CREATE POLICY "Group owners and admins can invite members" ON group_members
  FOR INSERT WITH CHECK (
    auth.uid() != user_id AND
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
  );

-- 一時的なデバッグ用ポリシー（権限チェックを緩和）
-- CREATE POLICY "Allow all inserts for debugging" ON group_members
--   FOR INSERT WITH CHECK (true);

CREATE POLICY "Group owners and admins can update member roles" ON group_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can leave groups, owners/admins can remove members" ON group_members
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
  );

-- Group join requests policies
CREATE POLICY "Join requests are viewable by group members" ON group_join_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_join_requests.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create join requests" ON group_join_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_join_requests.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group owners and admins can update join requests" ON group_join_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_join_requests.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
  );

-- Group posts policies
CREATE POLICY "Group posts are viewable by group members" ON group_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_posts.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create posts" ON group_posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_posts.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own group posts" ON group_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own group posts" ON group_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Group post images policies
CREATE POLICY "Group post images are viewable by group members" ON group_post_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN group_posts gp ON gp.id = group_post_images.group_post_id
      WHERE gm.group_id = gp.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add images to their own group posts" ON group_post_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_posts
      WHERE group_posts.id = group_post_images.group_post_id
      AND group_posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images from their own group posts" ON group_post_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_posts
      WHERE group_posts.id = group_post_images.group_post_id
      AND group_posts.user_id = auth.uid()
    )
  );

-- Function to automatically add owner as member when group is created
CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically add owner as member
DROP TRIGGER IF EXISTS on_group_created ON groups;
CREATE TRIGGER on_group_created
  AFTER INSERT ON groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_group();

-- Function to update member count
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update member_count in groups table
  UPDATE groups
  SET updated_at = NOW()
  WHERE id = COALESCE(NEW.group_id, OLD.group_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update group updated_at when members change
DROP TRIGGER IF EXISTS on_group_members_change ON group_members;
CREATE TRIGGER on_group_members_change
  AFTER INSERT OR UPDATE OR DELETE ON group_members
  FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

-- Function to update group updated_at when posts are added
DROP TRIGGER IF EXISTS on_group_posts_change ON group_posts;
CREATE TRIGGER on_group_posts_change
  AFTER INSERT OR UPDATE OR DELETE ON group_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

-- Triggers for updated_at on groups
DROP TRIGGER IF EXISTS set_updated_at ON groups;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON group_posts;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON group_posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON group_join_requests;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON group_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

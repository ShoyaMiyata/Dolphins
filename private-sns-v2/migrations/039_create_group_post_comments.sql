-- Create group_post_comments table
CREATE TABLE IF NOT EXISTS group_post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_post_id UUID NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT group_comment_length CHECK (char_length(content) >= 1 AND char_length(content) <= 500)
);

-- Create group_post_comment_images table
CREATE TABLE IF NOT EXISTS group_post_comment_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_post_comment_id UUID NOT NULL REFERENCES group_post_comments(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_post_comments_group_post_id ON group_post_comments(group_post_id);
CREATE INDEX IF NOT EXISTS idx_group_post_comments_user_id ON group_post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_group_post_comments_created_at ON group_post_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_group_post_comment_images_comment_id ON group_post_comment_images(group_post_comment_id);

-- Enable RLS
ALTER TABLE group_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_post_comment_images ENABLE ROW LEVEL SECURITY;

-- Group post comments policies
-- コメントはグループメンバーのみが閲覧可能
CREATE POLICY "Group post comments are viewable by group members" ON group_post_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN group_posts gp ON gp.id = group_post_comments.group_post_id
      WHERE gm.group_id = gp.group_id
      AND gm.user_id = auth.uid()
      AND gm.is_active = true
    )
  );

-- グループメンバーのみがコメントを作成可能
CREATE POLICY "Group members can create comments" ON group_post_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN group_posts gp ON gp.id = group_post_comments.group_post_id
      WHERE gm.group_id = gp.group_id
      AND gm.user_id = auth.uid()
      AND gm.is_active = true
    )
  );

-- 自分のコメントのみ更新可能
CREATE POLICY "Users can update their own comments" ON group_post_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- 自分のコメントのみ削除可能
CREATE POLICY "Users can delete their own comments" ON group_post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Group post comment images policies
-- コメント画像はグループメンバーのみが閲覧可能
CREATE POLICY "Group post comment images are viewable by group members" ON group_post_comment_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN group_posts gp ON gp.id = (
        SELECT group_post_id FROM group_post_comments WHERE id = group_post_comment_images.group_post_comment_id
      )
      WHERE gm.group_id = gp.group_id
      AND gm.user_id = auth.uid()
      AND gm.is_active = true
    )
  );

-- 自分のコメントにのみ画像を追加可能
CREATE POLICY "Users can add images to their own comments" ON group_post_comment_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_post_comments
      WHERE group_post_comments.id = group_post_comment_images.group_post_comment_id
      AND group_post_comments.user_id = auth.uid()
    )
  );

-- 自分のコメント画像のみ削除可能
CREATE POLICY "Users can delete images from their own comments" ON group_post_comment_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_post_comments
      WHERE group_post_comments.id = group_post_comment_images.group_post_comment_id
      AND group_post_comments.user_id = auth.uid()
    )
  );

-- Trigger for updated_at on group_post_comments
DROP TRIGGER IF EXISTS set_updated_at ON group_post_comments;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON group_post_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

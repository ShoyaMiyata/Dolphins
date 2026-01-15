-- Create comment_images table
CREATE TABLE IF NOT EXISTS comment_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comment_images_comment_id ON comment_images(comment_id);

-- Enable RLS
ALTER TABLE comment_images ENABLE ROW LEVEL SECURITY;

-- Comment images policies
-- コメント画像は誰でも閲覧可能（投稿と同様）
CREATE POLICY "Comment images are viewable by everyone" ON comment_images
  FOR SELECT USING (true);

-- 自分のコメントにのみ画像を追加可能
CREATE POLICY "Users can add images to their own comments" ON comment_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM comments
      WHERE comments.id = comment_images.comment_id
      AND comments.user_id = auth.uid()
    )
  );

-- 自分のコメント画像のみ削除可能
CREATE POLICY "Users can delete images from their own comments" ON comment_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM comments
      WHERE comments.id = comment_images.comment_id
      AND comments.user_id = auth.uid()
    )
  );

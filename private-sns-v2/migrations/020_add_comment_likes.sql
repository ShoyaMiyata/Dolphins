-- Add comment likes support to the likes table
-- Make post_id nullable and add comment_id column

ALTER TABLE likes
ADD COLUMN comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- Make post_id nullable
ALTER TABLE likes
ALTER COLUMN post_id DROP NOT NULL;

-- Add constraint to ensure either post_id or comment_id is set, but not both
ALTER TABLE likes
ADD CONSTRAINT likes_target_check
CHECK (
  (post_id IS NOT NULL AND comment_id IS NULL) OR
  (post_id IS NULL AND comment_id IS NOT NULL)
);

-- Update indexes
DROP INDEX IF EXISTS idx_likes_post_id;
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(comment_id) WHERE comment_id IS NOT NULL;

-- Update RLS policies to allow likes on comments
DROP POLICY IF EXISTS "Users can like posts" ON likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON likes;
DROP POLICY IF EXISTS "Users can like posts and comments" ON likes;
DROP POLICY IF EXISTS "Users can unlike posts and comments" ON likes;
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;

CREATE POLICY "Users can like posts and comments" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts and comments" ON likes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Likes are viewable by everyone" ON likes
  FOR SELECT USING (true);

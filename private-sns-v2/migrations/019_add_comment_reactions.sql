-- Add comment reactions support to the reactions table
-- Make post_id nullable and add comment_id column

ALTER TABLE reactions
ADD COLUMN comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- Make post_id nullable
ALTER TABLE reactions
ALTER COLUMN post_id DROP NOT NULL;

-- Add constraint to ensure either post_id or comment_id is set, but not both
ALTER TABLE reactions
ADD CONSTRAINT reactions_target_check
CHECK (
  (post_id IS NOT NULL AND comment_id IS NULL) OR
  (post_id IS NULL AND comment_id IS NOT NULL)
);

-- Update indexes
DROP INDEX IF EXISTS idx_reactions_post_id;
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reactions_comment_id ON reactions(comment_id) WHERE comment_id IS NOT NULL;

-- Update RLS policies to allow reactions on comments
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON reactions;
DROP POLICY IF EXISTS "Users can add reactions" ON reactions;
DROP POLICY IF EXISTS "Users can remove their reactions" ON reactions;

CREATE POLICY "Reactions are viewable by everyone" ON reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can add reactions" ON reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions" ON reactions
  FOR DELETE USING (auth.uid() = user_id);

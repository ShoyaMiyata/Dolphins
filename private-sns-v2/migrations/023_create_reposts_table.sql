-- Create reposts table for post sharing functionality
CREATE TABLE reposts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_reposts_post_id ON reposts(post_id);
CREATE INDEX idx_reposts_user_id ON reposts(user_id);
CREATE INDEX idx_reposts_created_at ON reposts(created_at);

-- Enable RLS
ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Reposts are viewable by everyone" ON reposts
  FOR SELECT USING (true);

CREATE POLICY "Users can repost posts" ON reposts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unrepost posts" ON reposts
  FOR DELETE USING (auth.uid() = user_id);

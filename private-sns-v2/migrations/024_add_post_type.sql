-- Add type and original_post_id to posts table for repost functionality

-- Add type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'type') THEN
        ALTER TABLE posts ADD COLUMN type TEXT DEFAULT 'post' CHECK (type IN ('post', 'repost'));
    END IF;
END $$;

-- Add original_post_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'original_post_id') THEN
        ALTER TABLE posts ADD COLUMN original_post_id UUID;
        ALTER TABLE posts ADD CONSTRAINT fk_posts_original_post_id FOREIGN KEY (original_post_id) REFERENCES posts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for performance (ignore if already exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_original_post_id') THEN
        CREATE INDEX idx_posts_original_post_id ON posts(original_post_id) WHERE original_post_id IS NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_type') THEN
        CREATE INDEX idx_posts_type ON posts(type);
    END IF;
END $$;

-- Note: Existing reposts data will be lost. New reposts will be created as posts with type='repost'
-- Drop the old reposts table since we're now using posts table for reposts
DROP TABLE IF EXISTS reposts CASCADE;

-- Update notifications trigger to work with new repost system
CREATE OR REPLACE FUNCTION public.create_repost_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't create notification if user reposts their own post
  IF NEW.type = 'repost' AND NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.original_post_id) THEN
    INSERT INTO public.notifications (user_id, type, related_user_id, related_post_id)
    VALUES (
      (SELECT user_id FROM posts WHERE id = NEW.original_post_id),
      'repost',
      NEW.user_id,
      NEW.original_post_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger
DROP TRIGGER IF EXISTS on_repost_created ON posts;
CREATE TRIGGER on_repost_created
  AFTER INSERT ON posts
  FOR EACH ROW
  WHEN (NEW.type = 'repost')
  EXECUTE FUNCTION public.create_repost_notification();

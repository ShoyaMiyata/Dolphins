-- Add cover_image_url to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add cover_image_url to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add comment
COMMENT ON COLUMN profiles.cover_image_url IS 'プロフィールのカバー画像URL';
COMMENT ON COLUMN groups.cover_image_url IS 'グループのカバー画像URL';

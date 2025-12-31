-- Add missing created_at column to group_members if it doesn't exist
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing updated_at column to group_members if it doesn't exist
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure created_at column exists in group_join_requests (should already exist from migration 011)
ALTER TABLE group_join_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing updated_at column to group_join_requests if it doesn't exist
ALTER TABLE group_join_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have created_at values if they are NULL
UPDATE group_members SET created_at = joined_at WHERE created_at IS NULL;
UPDATE group_join_requests SET created_at = created_at WHERE created_at IS NULL;

-- Add triggers for updated_at on group_members
DROP TRIGGER IF EXISTS set_updated_at_group_members ON group_members;
CREATE TRIGGER set_updated_at_group_members
  BEFORE UPDATE ON group_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add triggers for updated_at on group_join_requests (should already exist from migration 011)
DROP TRIGGER IF EXISTS set_updated_at_group_join_requests ON group_join_requests;
CREATE TRIGGER set_updated_at_group_join_requests
  BEFORE UPDATE ON group_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

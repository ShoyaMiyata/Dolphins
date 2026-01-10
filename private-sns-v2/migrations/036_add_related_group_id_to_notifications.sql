-- Add related_group_id column to notifications table for group-related notifications

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

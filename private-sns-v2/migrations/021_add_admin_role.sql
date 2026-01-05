-- Add admin role to profiles table
ALTER TABLE profiles
ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create index for role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Update RLS policies if needed (admins can see all profiles)
-- Note: Existing policies should already allow this, but we can add admin-specific logic later

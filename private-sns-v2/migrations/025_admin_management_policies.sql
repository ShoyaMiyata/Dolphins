-- Update RLS policies for admin management
-- Allow admin users to update other users' profiles, including role and last_access_at fields

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new policy allowing users to update their own profile OR admins to update any profile
CREATE POLICY "Users can update their own profile, admins can update any profile" ON profiles
  FOR UPDATE
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

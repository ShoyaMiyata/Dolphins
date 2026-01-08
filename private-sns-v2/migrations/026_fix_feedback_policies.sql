-- Fix RLS policies for feedbacks to allow admin management

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update their own feedbacks" ON feedbacks;
DROP POLICY IF EXISTS "Users can delete their own feedbacks" ON feedbacks;

-- Create new update policy: Users can update own (within 24h), Admins can update any
CREATE POLICY "Users update own (24h) or Admins update any" ON feedbacks
  FOR UPDATE
  USING (
    (auth.uid() = user_id AND created_at > now() - interval '24 hours') OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    (auth.uid() = user_id AND created_at > now() - interval '24 hours') OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create new delete policy: Users can delete own (within 24h), Admins can delete any
CREATE POLICY "Users delete own (24h) or Admins delete any" ON feedbacks
  FOR DELETE
  USING (
    (auth.uid() = user_id AND created_at > now() - interval '24 hours') OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Reload schema cache to be safe
NOTIFY pgrst, 'reload schema';

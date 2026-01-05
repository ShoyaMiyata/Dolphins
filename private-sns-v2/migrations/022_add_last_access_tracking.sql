-- Add last access tracking for admin monitoring
ALTER TABLE profiles
ADD COLUMN last_access_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create function to update last access time
CREATE OR REPLACE FUNCTION update_last_access()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET last_access_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_access_at on auth events
-- This will be triggered when users authenticate
CREATE OR REPLACE FUNCTION update_last_access_on_auth()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET last_access_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: We'll need to call this function from the application when users access the app
-- For now, we'll provide a way for admins to manually update this via the admin panel

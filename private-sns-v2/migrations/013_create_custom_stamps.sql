-- Create custom stamps table
CREATE TABLE custom_stamps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user_id
CREATE INDEX idx_custom_stamps_user_id ON custom_stamps(user_id);

-- Enable RLS
ALTER TABLE custom_stamps ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all custom stamps" ON custom_stamps
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own custom stamps" ON custom_stamps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom stamps" ON custom_stamps
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom stamps" ON custom_stamps
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for custom stamps if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('custom-stamps', 'custom-stamps', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload their own custom stamps" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'custom-stamps' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view custom stamps" ON storage.objects
  FOR SELECT USING (bucket_id = 'custom-stamps');

CREATE POLICY "Users can update their own custom stamps" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'custom-stamps' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own custom stamps" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'custom-stamps' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

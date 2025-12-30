-- ================================================
-- Dolphins Private SNS - Supabase Storage Policies
-- ================================================
-- このSQLをSupabase Dashboard > SQL Editorで実行してください
-- 前提: 'avatars' と 'post-images' バケットが作成済みであること

-- ================================================
-- Avatars Bucket Policies
-- ================================================

-- Allow anyone to read avatar images
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ================================================
-- Post Images Bucket Policies
-- ================================================

-- Allow anyone to read post images
CREATE POLICY "Post images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

-- Allow authenticated users to upload post images
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images'
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own post images
CREATE POLICY "Users can update their own post images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own post images
CREATE POLICY "Users can delete their own post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ================================================
-- Setup Complete!
-- ================================================

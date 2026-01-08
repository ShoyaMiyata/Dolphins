-- Safely add the column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_access_at') THEN
        ALTER TABLE profiles ADD COLUMN last_access_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Reload the schema cache
NOTIFY pgrst, 'reload schema';

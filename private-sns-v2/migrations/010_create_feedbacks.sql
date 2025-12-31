-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own feedbacks" ON public.feedbacks;
DROP POLICY IF EXISTS "Anyone can read feedbacks" ON public.feedbacks;
DROP POLICY IF EXISTS "Users can update their own feedbacks" ON public.feedbacks;
DROP POLICY IF EXISTS "Users can delete their own feedbacks" ON public.feedbacks;

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.feedbacks CASCADE;

-- Create feedbacks table
CREATE TABLE public.feedbacks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT fk_feedbacks_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS feedbacks_user_id_idx ON public.feedbacks(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS feedbacks_created_at_idx ON public.feedbacks(created_at DESC);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS feedbacks_status_idx ON public.feedbacks(status);

-- Enable Row Level Security
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert their own feedback
CREATE POLICY "Users can insert their own feedbacks"
    ON public.feedbacks
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: Anyone can read all feedbacks (for transparency)
CREATE POLICY "Anyone can read feedbacks"
    ON public.feedbacks
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Users can update their own feedbacks (within 24 hours)
CREATE POLICY "Users can update their own feedbacks"
    ON public.feedbacks
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id
        AND created_at > now() - interval '24 hours'
    )
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own feedbacks (within 24 hours)
CREATE POLICY "Users can delete their own feedbacks"
    ON public.feedbacks
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id
        AND created_at > now() - interval '24 hours'
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on update
CREATE TRIGGER handle_feedbacks_updated_at
    BEFORE UPDATE ON public.feedbacks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

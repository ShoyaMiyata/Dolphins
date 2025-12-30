-- Create hangouts table
CREATE TABLE IF NOT EXISTS public.hangouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    date DATE NOT NULL,
    time TIME,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hangout_responses table
CREATE TABLE IF NOT EXISTS public.hangout_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hangout_id UUID NOT NULL REFERENCES public.hangouts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    response TEXT NOT NULL CHECK (response IN ('yes', 'no', 'maybe')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hangout_id, user_id)
);

-- Create indexes
CREATE INDEX idx_hangouts_user_id ON public.hangouts(user_id);
CREATE INDEX idx_hangouts_date ON public.hangouts(date);
CREATE INDEX idx_hangout_responses_hangout_id ON public.hangout_responses(hangout_id);
CREATE INDEX idx_hangout_responses_user_id ON public.hangout_responses(user_id);

-- Enable Row Level Security
ALTER TABLE public.hangouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hangout_responses ENABLE ROW LEVEL SECURITY;

-- Policies for hangouts
CREATE POLICY "Users can view all hangouts"
    ON public.hangouts FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own hangouts"
    ON public.hangouts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hangouts"
    ON public.hangouts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hangouts"
    ON public.hangouts FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for hangout_responses
CREATE POLICY "Users can view all responses"
    ON public.hangout_responses FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own responses"
    ON public.hangout_responses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses"
    ON public.hangout_responses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own responses"
    ON public.hangout_responses FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hangouts_updated_at
    BEFORE UPDATE ON public.hangouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hangout_responses_updated_at
    BEFORE UPDATE ON public.hangout_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

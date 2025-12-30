-- Add visibility_type column to hangouts table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'hangouts'
        AND column_name = 'visibility_type'
    ) THEN
        ALTER TABLE public.hangouts
        ADD COLUMN visibility_type TEXT DEFAULT 'all' CHECK (visibility_type IN ('all', 'selected'));
    END IF;
END $$;

-- Create hangout_visibility table for selected users
CREATE TABLE IF NOT EXISTS public.hangout_visibility (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hangout_id UUID NOT NULL REFERENCES public.hangouts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hangout_id, user_id)
);

-- Create indexes (with existence check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'hangout_visibility'
        AND indexname = 'idx_hangout_visibility_hangout_id'
    ) THEN
        CREATE INDEX idx_hangout_visibility_hangout_id ON public.hangout_visibility(hangout_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'hangout_visibility'
        AND indexname = 'idx_hangout_visibility_user_id'
    ) THEN
        CREATE INDEX idx_hangout_visibility_user_id ON public.hangout_visibility(user_id);
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.hangout_visibility ENABLE ROW LEVEL SECURITY;

-- Policies for hangout_visibility
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'hangout_visibility'
        AND policyname = 'Users can view visibility settings of hangouts they can see'
    ) THEN
        CREATE POLICY "Users can view visibility settings of hangouts they can see"
            ON public.hangout_visibility FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.hangouts
                    WHERE hangouts.id = hangout_visibility.hangout_id
                    AND (
                        hangouts.user_id = auth.uid() OR
                        hangouts.visibility_type = 'all' OR
                        hangout_visibility.user_id = auth.uid()
                    )
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'hangout_visibility'
        AND policyname = 'Hangout creators can manage visibility settings'
    ) THEN
        CREATE POLICY "Hangout creators can manage visibility settings"
            ON public.hangout_visibility FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.hangouts
                    WHERE hangouts.id = hangout_visibility.hangout_id
                    AND hangouts.user_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'hangout_visibility'
        AND policyname = 'Hangout creators can delete visibility settings'
    ) THEN
        CREATE POLICY "Hangout creators can delete visibility settings"
            ON public.hangout_visibility FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM public.hangouts
                    WHERE hangouts.id = hangout_visibility.hangout_id
                    AND hangouts.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Update hangouts SELECT policy to respect visibility settings
-- First, check if the old policy exists and drop it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'hangouts'
        AND policyname = 'Users can view all hangouts'
    ) THEN
        DROP POLICY "Users can view all hangouts" ON public.hangouts;
    END IF;
END $$;

-- Create new policy (will fail if already exists, which is safe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'hangouts'
        AND policyname = 'Users can view hangouts based on visibility'
    ) THEN
        CREATE POLICY "Users can view hangouts based on visibility"
            ON public.hangouts FOR SELECT
            USING (
                auth.uid() = user_id OR
                visibility_type = 'all' OR
                EXISTS (
                    SELECT 1 FROM public.hangout_visibility
                    WHERE hangout_visibility.hangout_id = hangouts.id
                    AND hangout_visibility.user_id = auth.uid()
                )
            );
    END IF;
END $$;

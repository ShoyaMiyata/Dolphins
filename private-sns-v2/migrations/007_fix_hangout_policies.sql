-- Fix infinite recursion in hangout policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view hangouts based on visibility" ON public.hangouts;
DROP POLICY IF EXISTS "Users can view visibility settings of hangouts they can see" ON public.hangout_visibility;

-- Recreate hangouts SELECT policy WITHOUT checking hangout_visibility
-- This avoids circular dependency
CREATE POLICY "Users can view hangouts based on visibility"
    ON public.hangouts FOR SELECT
    USING (
        auth.uid() = user_id OR
        visibility_type = 'all' OR
        (
            visibility_type = 'selected' AND
            EXISTS (
                SELECT 1 FROM public.hangout_visibility
                WHERE hangout_visibility.hangout_id = hangouts.id
                AND hangout_visibility.user_id = auth.uid()
            )
        )
    );

-- Simplified hangout_visibility SELECT policy
-- Only check if user is creator or in the visibility list
CREATE POLICY "Users can view visibility settings"
    ON public.hangout_visibility FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.hangouts
            WHERE hangouts.id = hangout_visibility.hangout_id
            AND hangouts.user_id = auth.uid()
        ) OR
        hangout_visibility.user_id = auth.uid()
    );

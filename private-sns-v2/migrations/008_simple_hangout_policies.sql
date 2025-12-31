-- Complete policy reset for hangouts table

-- Drop ALL existing policies on hangouts
DROP POLICY IF EXISTS "Users can view hangouts based on visibility" ON public.hangouts;
DROP POLICY IF EXISTS "Users can view all hangouts" ON public.hangouts;
DROP POLICY IF EXISTS "Users can create their own hangouts" ON public.hangouts;
DROP POLICY IF EXISTS "Users can update their own hangouts" ON public.hangouts;
DROP POLICY IF EXISTS "Users can delete their own hangouts" ON public.hangouts;
DROP POLICY IF EXISTS "hangouts_select_policy" ON public.hangouts;
DROP POLICY IF EXISTS "hangouts_insert_policy" ON public.hangouts;
DROP POLICY IF EXISTS "hangouts_update_policy" ON public.hangouts;
DROP POLICY IF EXISTS "hangouts_delete_policy" ON public.hangouts;

-- Drop ALL existing policies on hangout_visibility
DROP POLICY IF EXISTS "Users can view visibility settings of hangouts they can see" ON public.hangout_visibility;
DROP POLICY IF EXISTS "Users can view visibility settings" ON public.hangout_visibility;
DROP POLICY IF EXISTS "Hangout creators can manage visibility settings" ON public.hangout_visibility;
DROP POLICY IF EXISTS "Hangout creators can delete visibility settings" ON public.hangout_visibility;
DROP POLICY IF EXISTS "hangout_visibility_select_policy" ON public.hangout_visibility;
DROP POLICY IF EXISTS "hangout_visibility_insert_policy" ON public.hangout_visibility;
DROP POLICY IF EXISTS "hangout_visibility_delete_policy" ON public.hangout_visibility;

-- Create helper function to check visibility (avoids circular reference)
-- MUST be created BEFORE the policies that use it
CREATE OR REPLACE FUNCTION public.hangout_visibility_check(hangout_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.hangout_visibility
        WHERE hangout_id = hangout_id_param
        AND user_id = user_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate hangouts policies (SIMPLE version for debugging)
CREATE POLICY "hangouts_select_policy"
    ON public.hangouts FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "hangouts_insert_policy"
    ON public.hangouts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hangouts_update_policy"
    ON public.hangouts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "hangouts_delete_policy"
    ON public.hangouts FOR DELETE
    USING (auth.uid() = user_id);

-- Recreate hangout_visibility policies (SIMPLE version)
CREATE POLICY "hangout_visibility_select_policy"
    ON public.hangout_visibility FOR SELECT
    USING (
        -- Creator of the hangout can see
        EXISTS (
            SELECT 1 FROM public.hangouts h
            WHERE h.id = hangout_visibility.hangout_id
            AND h.user_id = auth.uid()
        ) OR
        -- The user themselves can see if they're in the list
        user_id = auth.uid()
    );

CREATE POLICY "hangout_visibility_insert_policy"
    ON public.hangout_visibility FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.hangouts h
            WHERE h.id = hangout_visibility.hangout_id
            AND h.user_id = auth.uid()
        )
    );

CREATE POLICY "hangout_visibility_delete_policy"
    ON public.hangout_visibility FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.hangouts h
            WHERE h.id = hangout_visibility.hangout_id
            AND h.user_id = auth.uid()
        )
    );

-- Drop existing hangout_responses policies first
DROP POLICY IF EXISTS "Users can view all responses" ON public.hangout_responses;
DROP POLICY IF EXISTS "Users can create their own responses" ON public.hangout_responses;
DROP POLICY IF EXISTS "Users can update their own responses" ON public.hangout_responses;
DROP POLICY IF EXISTS "Users can delete their own responses" ON public.hangout_responses;
DROP POLICY IF EXISTS "hangout_responses_select_policy" ON public.hangout_responses;
DROP POLICY IF EXISTS "hangout_responses_insert_policy" ON public.hangout_responses;
DROP POLICY IF EXISTS "hangout_responses_update_policy" ON public.hangout_responses;
DROP POLICY IF EXISTS "hangout_responses_delete_policy" ON public.hangout_responses;

-- Recreate hangout_responses policies
CREATE POLICY "hangout_responses_select_policy"
    ON public.hangout_responses FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "hangout_responses_insert_policy"
    ON public.hangout_responses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hangout_responses_update_policy"
    ON public.hangout_responses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "hangout_responses_delete_policy"
    ON public.hangout_responses FOR DELETE
    USING (auth.uid() = user_id);

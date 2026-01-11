-- Add original_group_post_id to posts table
ALTER TABLE public.posts
ADD COLUMN original_group_post_id UUID REFERENCES public.group_posts(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_posts_original_group_post_id ON public.posts(original_group_post_id);

-- Update RLS policies if necessary (assuming public read is already enabled for posts)
-- No changes needed for standard view access if policies are broad enough.

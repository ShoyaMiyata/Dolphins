-- Create group_post_likes table
CREATE TABLE public.group_post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_post_id, user_id)
);

-- Create group_post_reactions table
CREATE TABLE public.group_post_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_post_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.group_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_post_reactions ENABLE ROW LEVEL SECURITY;

-- Policies for group_post_likes
CREATE POLICY "Group interactions are viewable by group members" ON public.group_post_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_posts gp
      JOIN public.group_members gm ON gp.group_id = gm.group_id
      WHERE gp.id = group_post_likes.group_post_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own likes" ON public.group_post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.group_post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for group_post_reactions
CREATE POLICY "Group interactions are viewable by group members" ON public.group_post_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_posts gp
      JOIN public.group_members gm ON gp.group_id = gm.group_id
      WHERE gp.id = group_post_reactions.group_post_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own reactions" ON public.group_post_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON public.group_post_reactions
  FOR DELETE USING (auth.uid() = user_id);

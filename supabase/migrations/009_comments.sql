-- Migration 009: Entry Comments & Discussion
-- Supports 1-level nested discussions on vault entries with college scoping

CREATE TABLE IF NOT EXISTS public.entry_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.entry_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 500),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying of entry comments and threaded replies
CREATE INDEX IF NOT EXISTS idx_entry_comments_entry_id ON public.entry_comments(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_comments_parent ON public.entry_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_entry_comments_user_id ON public.entry_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_entry_comments_created_at ON public.entry_comments(created_at);

-- RLS
ALTER TABLE public.entry_comments ENABLE ROW LEVEL SECURITY;

-- Allow reading comments if user has access to entry's college or entry is platform-wide
DROP POLICY IF EXISTS "Users can read comments in their college" ON public.entry_comments;
CREATE POLICY "Users can read comments in their college"
ON public.entry_comments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.entries e
        LEFT JOIN public.users u ON u.id = auth.uid()
        WHERE e.id = entry_comments.entry_id
        AND (
            e.college_id IS NULL
            OR e.college_id = u.college_id
            OR u.is_super_admin = true
        )
    )
);

-- Allow authenticated users to add comments
DROP POLICY IF EXISTS "Users can insert comments" ON public.entry_comments;
CREATE POLICY "Users can insert comments"
ON public.entry_comments FOR INSERT
WITH CHECK (
    auth.uid() = user_id
);

-- Allow author or admins to update/delete comment
DROP POLICY IF EXISTS "Users can update own comments" ON public.entry_comments;
CREATE POLICY "Users can update own comments"
ON public.entry_comments FOR UPDATE
USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND (u.is_super_admin = true OR u.is_college_admin = true)
    )
);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.entry_comments;
CREATE POLICY "Users can delete own comments"
ON public.entry_comments FOR DELETE
USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND (u.is_super_admin = true OR u.is_college_admin = true)
    )
);

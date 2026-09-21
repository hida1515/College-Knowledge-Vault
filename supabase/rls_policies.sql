-- ============================================================
-- College Knowledge Vault — Row-Level Security Policies
-- Run this SECOND in Supabase SQL Editor (after schema.sql)
-- ============================================================

-- ============================================================
-- Helper: get current user's role from public.users
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viva_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS: users
-- ============================================================

-- Any authenticated user can read any profile
CREATE POLICY "users_select_authenticated"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own row (on first login via trigger)
CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Users can update their own row
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- RLS: tags
-- ============================================================

-- Anyone authenticated can read tags
CREATE POLICY "tags_select_authenticated"
  ON public.tags FOR SELECT
  TO authenticated
  USING (true);

-- Any authenticated user can create tags
CREATE POLICY "tags_insert_authenticated"
  ON public.tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- RLS: entries
-- ============================================================

-- Public: read approved entries that aren't deleted
-- Authors: read their own entries regardless of status
-- Faculty: read all entries
CREATE POLICY "entries_select"
  ON public.entries FOR SELECT
  TO authenticated
  USING (
    (status = 'approved' AND is_deleted = false)
    OR (author_id = auth.uid())
    OR (public.get_user_role() = 'faculty')
  );

-- Only seniors and faculty can create entries
CREATE POLICY "entries_insert"
  ON public.entries FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      public.get_user_role() = 'senior'
      OR public.get_user_role() = 'faculty'
    )
  );

-- Authors can update own entries; faculty can update any entry (for moderation)
CREATE POLICY "entries_update"
  ON public.entries FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR public.get_user_role() = 'faculty'
  )
  WITH CHECK (
    author_id = auth.uid()
    OR public.get_user_role() = 'faculty'
  );

-- Authors can delete own entries; faculty can delete any
CREATE POLICY "entries_delete"
  ON public.entries FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR public.get_user_role() = 'faculty'
  );

-- ============================================================
-- RLS: entry_tags
-- ============================================================

-- Anyone authenticated can read entry_tags
CREATE POLICY "entry_tags_select"
  ON public.entry_tags FOR SELECT
  TO authenticated
  USING (true);

-- Entry author can manage tags on their entries
CREATE POLICY "entry_tags_insert"
  ON public.entry_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.entries
      WHERE id = entry_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "entry_tags_delete"
  ON public.entry_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.entries
      WHERE id = entry_id AND author_id = auth.uid()
    )
  );

-- ============================================================
-- RLS: entry_upvotes
-- ============================================================

-- Anyone authenticated can read upvotes
CREATE POLICY "entry_upvotes_select"
  ON public.entry_upvotes FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own upvotes
CREATE POLICY "entry_upvotes_insert"
  ON public.entry_upvotes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can remove their own upvotes
CREATE POLICY "entry_upvotes_delete"
  ON public.entry_upvotes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- RLS: viva_questions
-- ============================================================

-- Anyone can read viva questions for entries they can see
CREATE POLICY "viva_questions_select"
  ON public.viva_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.entries e
      WHERE e.id = entry_id
      AND (
        (e.status = 'approved' AND e.is_deleted = false)
        OR e.author_id = auth.uid()
        OR public.get_user_role() = 'faculty'
      )
    )
  );

-- Entry author can insert viva questions
CREATE POLICY "viva_questions_insert"
  ON public.viva_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.entries
      WHERE id = entry_id AND author_id = auth.uid()
    )
  );

-- Entry author can update viva questions
CREATE POLICY "viva_questions_update"
  ON public.viva_questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.entries
      WHERE id = entry_id AND author_id = auth.uid()
    )
  );

-- Entry author can delete viva questions
CREATE POLICY "viva_questions_delete"
  ON public.viva_questions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.entries
      WHERE id = entry_id AND author_id = auth.uid()
    )
  );

-- ============================================================
-- RLS: moderation_queue
-- ============================================================

-- Faculty can see all moderation records; submitters can see their own
CREATE POLICY "moderation_queue_select"
  ON public.moderation_queue FOR SELECT
  TO authenticated
  USING (
    submitted_by = auth.uid()
    OR public.get_user_role() = 'faculty'
  );

-- Insert is handled by trigger (SECURITY DEFINER), so allow service role
CREATE POLICY "moderation_queue_insert"
  ON public.moderation_queue FOR INSERT
  TO authenticated
  WITH CHECK (submitted_by = auth.uid());

-- Only faculty can update moderation records (approve/reject)
CREATE POLICY "moderation_queue_update"
  ON public.moderation_queue FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'faculty')
  WITH CHECK (public.get_user_role() = 'faculty');

-- ============================================================
-- RLS: flags
-- ============================================================

-- Faculty can see all flags; reporters can see their own
CREATE POLICY "flags_select"
  ON public.flags FOR SELECT
  TO authenticated
  USING (
    reported_by = auth.uid()
    OR public.get_user_role() = 'faculty'
  );

-- Any authenticated user can create a flag
CREATE POLICY "flags_insert"
  ON public.flags FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = auth.uid());

-- Only faculty can resolve flags
CREATE POLICY "flags_update"
  ON public.flags FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'faculty')
  WITH CHECK (public.get_user_role() = 'faculty');

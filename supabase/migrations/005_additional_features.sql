-- ============================================================
-- Migration 005: Additional Features — Bookmarks, Outdated Marking, and Rich Details
-- ============================================================

-- Step 1: Create bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, entry_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookmarks_own" ON public.bookmarks;
CREATE POLICY "bookmarks_own" ON public.bookmarks
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 2: Create outdated_marks table
CREATE TABLE IF NOT EXISTS public.outdated_marks (
  entry_id uuid REFERENCES public.entries(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entry_id, user_id)
);

ALTER TABLE public.outdated_marks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "outdated_marks_read" ON public.outdated_marks;
CREATE POLICY "outdated_marks_read" ON public.outdated_marks
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "outdated_marks_insert" ON public.outdated_marks;
CREATE POLICY "outdated_marks_insert" ON public.outdated_marks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Step 3: Add detail JSONB columns and outdated tracking to entries table
ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS project_details jsonb,
  ADD COLUMN IF NOT EXISTS viva_details jsonb,
  ADD COLUMN IF NOT EXISTS mistake_details jsonb,
  ADD COLUMN IF NOT EXISTS resource_details jsonb,
  ADD COLUMN IF NOT EXISTS outdated_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_marked_outdated boolean NOT NULL DEFAULT false;

-- Step 4: Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user
  ON public.bookmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_outdated_entry
  ON public.outdated_marks(entry_id);

-- ============================================================
-- Migration 003: Program-Based Seniority Logic
-- College Knowledge Vault
-- ============================================================

-- Add program fields to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS joining_year int,
  ADD COLUMN IF NOT EXISTS program text,
  ADD COLUMN IF NOT EXISTS program_type text
    CHECK (program_type IN ('ug', 'pg', 'phd')),
  ADD COLUMN IF NOT EXISTS program_duration int;

-- Update existing rows if any exist:
-- graduation_year = joining_year + program_duration
UPDATE public.users
SET graduation_year = joining_year + program_duration
WHERE joining_year IS NOT NULL
  AND program_duration IS NOT NULL;

-- Update entries RLS to use new seniority logic
DROP POLICY IF EXISTS "entries_insert_same_college" ON public.entries;

CREATE POLICY "entries_insert_same_college" ON public.entries
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.college_id = college_id
      AND (
        u.is_super_admin = true
        OR (u.role = 'faculty' AND u.is_verified = true)
        OR u.is_college_admin = true
        OR (
          -- Final year check using joining_year + program_duration
          u.joining_year IS NOT NULL
          AND u.program_duration IS NOT NULL
          AND (EXTRACT(YEAR FROM NOW())::int - u.joining_year + 1)
              = u.program_duration
          AND EXTRACT(YEAR FROM NOW())::int
              <= (u.joining_year + u.program_duration)
          AND u.is_senior_revoked = false
        )
      )
    )
  );

-- Migration: 010_fix_entries_select_policy.sql
-- Description: Fix entries SELECT RLS policy to ensure authors can ALWAYS see their own entries.
--
-- Bug: Migration 007_invite_codes.sql nested the `author_id = auth.uid()` check inside
-- the `joined_via_code IS NOT NULL` condition. If a user's joined_via_code was NULL,
-- the college subquery returned NULL, making the entire block false — blocking users
-- from seeing even their own submitted entries in the Dashboard.
--
-- Fix: Move `author_id = auth.uid()` to a top-level OR so it's always evaluated.

-- Drop all conflicting SELECT policies on entries
DROP POLICY IF EXISTS "entries_select" ON public.entries;
DROP POLICY IF EXISTS "entries_select_same_college" ON public.entries;
DROP POLICY IF EXISTS "entries_select_verified_college" ON public.entries;

-- Recreate the correct, comprehensive SELECT policy
CREATE POLICY "entries_select_verified_college" ON public.entries
  FOR SELECT TO authenticated
  USING (
    is_deleted = false
    AND (
      -- 1. Super Admin sees everything
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_super_admin = true)

      -- 2. Authors ALWAYS see their own entries (any status)
      OR author_id = auth.uid()

      -- 3. Approved entries visible to same-college users
      OR (
        status = 'approved'
        AND (
          college_id IS NULL
          OR college_id = (SELECT college_id FROM public.users WHERE id = auth.uid())
        )
      )

      -- 4. College Admin / Faculty see all entries in their college
      OR (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
          AND (
            u.is_super_admin = true
            OR u.is_college_admin = true
            OR (u.role = 'faculty' AND u.is_verified = true)
          )
          AND (u.college_id = entries.college_id OR u.college_id IS NULL OR entries.college_id IS NULL)
        )
      )
    )
  );

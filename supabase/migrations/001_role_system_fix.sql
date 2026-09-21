-- Migration: Role System Fix & Faculty Request Verification
-- Description: Adds is_super_admin, is_senior_revoked, faculty_verified_by, faculty_verified_at,
--              creates faculty_requests table, and updates RLS policies for public.entries & public.moderation_queue.

-- 1. Add new columns to users table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_senior_revoked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS faculty_verified_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS faculty_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS pending_role_request text;

-- 2. Create faculty verification requests table
CREATE TABLE IF NOT EXISTS public.faculty_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  college text NOT NULL,
  department text NOT NULL,
  employee_id text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.users(id),
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE(user_id)
);

-- RLS for faculty_requests
ALTER TABLE public.faculty_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "faculty_requests_own_read" ON public.faculty_requests;
CREATE POLICY "faculty_requests_own_read" ON public.faculty_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "faculty_requests_own_insert" ON public.faculty_requests;
CREATE POLICY "faculty_requests_own_insert" ON public.faculty_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "super_admin_all" ON public.faculty_requests;
CREATE POLICY "super_admin_all" ON public.faculty_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- 3. Update entries RLS to use computed role logic
DROP POLICY IF EXISTS "entries_insert" ON public.entries;
DROP POLICY IF EXISTS "entries_insert_senior_faculty" ON public.entries;
CREATE POLICY "entries_insert_senior_faculty" ON public.entries
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        -- Faculty (verified) can insert
        (u.role = 'faculty' AND u.is_verified = true)
        OR
        -- Auto-senior: graduation year has passed and not revoked
        (u.graduation_year <= EXTRACT(YEAR FROM NOW())::int 
         AND u.is_senior_revoked = false)
        OR
        -- Super admin can insert
        u.is_super_admin = true
      )
    )
  );

-- 4. Update moderation_queue RLS for super admin & verified faculty
DROP POLICY IF EXISTS "modqueue_select" ON public.moderation_queue;
DROP POLICY IF EXISTS "modqueue_select_faculty_admin" ON public.moderation_queue;
CREATE POLICY "modqueue_select_faculty_admin" ON public.moderation_queue
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND (
        (role = 'faculty' AND is_verified = true)
        OR is_super_admin = true
      )
    )
  );

DROP POLICY IF EXISTS "modqueue_update" ON public.moderation_queue;
DROP POLICY IF EXISTS "modqueue_update_faculty_admin" ON public.moderation_queue;
CREATE POLICY "modqueue_update_faculty_admin" ON public.moderation_queue
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND (
        (role = 'faculty' AND is_verified = true)
        OR is_super_admin = true
      )
    )
  );

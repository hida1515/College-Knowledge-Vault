-- Migration: Multi-Tenant College System & College Admin Governance
-- Description: Creates colleges table, college_admin_requests table, adds college_id to users & entries,
--              and updates RLS policies for multi-tenant data isolation.

-- Step 1: Create colleges table
CREATE TABLE IF NOT EXISTS public.colleges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'India',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(name, city)
);

-- Step 2: Create college_admin_requests table
CREATE TABLE IF NOT EXISTS public.college_admin_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  college_id uuid REFERENCES public.colleges(id),
  college_name text NOT NULL,
  college_city text NOT NULL DEFAULT '',
  college_state text NOT NULL DEFAULT '',
  designation text NOT NULL,
  employee_id text,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.users(id),
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE(user_id)
);

-- Step 3: Add college_id & admin columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS college_id uuid REFERENCES public.colleges(id),
  ADD COLUMN IF NOT EXISTS is_college_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS college_admin_verified_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS college_admin_verified_at timestamptz;

-- Step 4: Add college_id to entries table
ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS college_id uuid REFERENCES public.colleges(id);

-- Step 5: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_entries_college
  ON public.entries(college_id)
  WHERE status = 'approved' AND is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_users_college
  ON public.users(college_id);

-- Step 6: Seed default college
INSERT INTO public.colleges (name, city, state) VALUES
  ('Add Your College', 'Your City', 'Your State')
ON CONFLICT DO NOTHING;

-- Step 7: RLS for colleges table
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "colleges_read_all" ON public.colleges;
CREATE POLICY "colleges_read_all" ON public.colleges
  FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "colleges_insert_super_admin" ON public.colleges;
CREATE POLICY "colleges_insert_super_admin" ON public.colleges
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "colleges_update_super_admin" ON public.colleges;
CREATE POLICY "colleges_update_super_admin" ON public.colleges
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Step 8: RLS for college_admin_requests
ALTER TABLE public.college_admin_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "car_own_read" ON public.college_admin_requests;
CREATE POLICY "car_own_read" ON public.college_admin_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "car_super_admin_read" ON public.college_admin_requests;
CREATE POLICY "car_super_admin_read" ON public.college_admin_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "car_insert_own" ON public.college_admin_requests;
CREATE POLICY "car_insert_own" ON public.college_admin_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "car_update_super_admin" ON public.college_admin_requests;
CREATE POLICY "car_update_super_admin" ON public.college_admin_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Step 9: Update entries RLS for college data isolation
DROP POLICY IF EXISTS "entries_select_approved" ON public.entries;
DROP POLICY IF EXISTS "entries_insert_senior_faculty" ON public.entries;
DROP POLICY IF EXISTS "entries_select_same_college" ON public.entries;
DROP POLICY IF EXISTS "entries_insert_same_college" ON public.entries;

-- Multi-tenant isolation: Students/Seniors/Faculty can only see their own college's entries
CREATE POLICY "entries_select_same_college" ON public.entries
  FOR SELECT TO authenticated
  USING (
    -- Super Admin sees all
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_super_admin = true
    )
    OR
    -- Same college isolation
    (
      college_id = (
        SELECT college_id FROM public.users WHERE id = auth.uid()
      )
      AND (
        -- Approved entries: all members of same college can see
        (status = 'approved' AND is_deleted = false)
        OR
        -- Own entries: author sees regardless of status
        author_id = auth.uid()
        OR
        -- College Admin sees all college entries
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
          AND is_college_admin = true
          AND college_id = entries.college_id
        )
        OR
        -- Verified Faculty sees all college entries
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()
          AND role = 'faculty'
          AND is_verified = true
          AND college_id = entries.college_id
        )
      )
    )
  );

-- Only seniors/faculty/admins from same college can submit
CREATE POLICY "entries_insert_same_college" ON public.entries
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.college_id = college_id
      AND (
        u.is_super_admin = true
        OR u.is_college_admin = true
        OR (u.role = 'faculty' AND u.is_verified = true)
        OR (
          u.graduation_year <= EXTRACT(YEAR FROM NOW())::int
          AND u.is_senior_revoked = false
        )
      )
    )
  );

-- Step 10: Update moderation RLS for college isolation
DROP POLICY IF EXISTS "modqueue_select_faculty_admin" ON public.moderation_queue;
DROP POLICY IF EXISTS "modqueue_update_faculty_admin" ON public.moderation_queue;
DROP POLICY IF EXISTS "modqueue_select_college_scoped" ON public.moderation_queue;
DROP POLICY IF EXISTS "modqueue_update_college_scoped" ON public.moderation_queue;

CREATE POLICY "modqueue_select_college_scoped" ON public.moderation_queue
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.is_super_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.entries e
      JOIN public.users u ON u.id = auth.uid()
      WHERE e.id = moderation_queue.entry_id
      AND e.college_id = u.college_id
      AND (
        u.is_college_admin = true
        OR (u.role = 'faculty' AND u.is_verified = true)
      )
    )
  );

CREATE POLICY "modqueue_update_college_scoped" ON public.moderation_queue
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.entries e
      JOIN public.users u ON u.id = auth.uid()
      WHERE e.id = moderation_queue.entry_id
      AND e.college_id = u.college_id
      AND (
        u.is_super_admin = true
        OR u.is_college_admin = true
        OR (u.role = 'faculty' AND u.is_verified = true)
      )
    )
  );

-- Step 11: Update users RLS policy (non-recursive)
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_select_college_scoped" ON public.users;
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;

CREATE POLICY "users_select_authenticated" ON public.users
  FOR SELECT TO authenticated
  USING (true);

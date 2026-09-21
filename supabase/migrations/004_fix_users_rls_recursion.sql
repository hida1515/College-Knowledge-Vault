-- ============================================================
-- Migration 004: Fix Users Table RLS Infinite Recursion
-- Run this in Supabase SQL Editor to resolve:
-- "infinite recursion detected in policy for relation 'users'"
-- ============================================================

-- Step 1: Create SECURITY DEFINER helper functions
-- (SECURITY DEFINER functions bypass RLS when querying public.users,
-- preventing infinite recursion loops)

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.users WHERE id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_college_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT college_id FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_college_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_college_admin FROM public.users WHERE id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_verified_faculty()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (role = 'faculty' AND is_verified = true) FROM public.users WHERE id = auth.uid()),
    false
  );
$$;

-- Step 2: Fix the recursive SELECT policy on public.users
-- Drop any existing conflicting or recursive policies
DROP POLICY IF EXISTS "users_select_college_scoped" ON public.users;
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;

-- Recreate clean, non-recursive SELECT policy for authenticated users
-- (Allows reading profiles so user names, avatars, and college details can be displayed)
CREATE POLICY "users_select_authenticated"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- Ensure user insert & update policies are intact
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Step 3: Update colleges table RLS to use the SECURITY DEFINER function
DROP POLICY IF EXISTS "colleges_insert_super_admin" ON public.colleges;
CREATE POLICY "colleges_insert_super_admin" ON public.colleges
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "colleges_update_super_admin" ON public.colleges;
CREATE POLICY "colleges_update_super_admin" ON public.colleges
  FOR UPDATE TO authenticated
  USING (public.is_super_admin());

-- Step 4: Update college_admin_requests RLS
DROP POLICY IF EXISTS "car_super_admin_read" ON public.college_admin_requests;
CREATE POLICY "car_super_admin_read" ON public.college_admin_requests
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "car_update_super_admin" ON public.college_admin_requests;
CREATE POLICY "car_update_super_admin" ON public.college_admin_requests
  FOR UPDATE TO authenticated
  USING (public.is_super_admin());

-- Step 5: Update faculty_requests RLS
DROP POLICY IF EXISTS "super_admin_all" ON public.faculty_requests;
CREATE POLICY "super_admin_all" ON public.faculty_requests
  FOR ALL TO authenticated
  USING (public.is_super_admin());

-- Step 6: Update entries RLS to use helper functions
DROP POLICY IF EXISTS "entries_select_same_college" ON public.entries;
CREATE POLICY "entries_select_same_college" ON public.entries
  FOR SELECT TO authenticated
  USING (
    -- Super Admin can see all entries
    public.is_super_admin()
    OR
    -- Users can see entries from their own college or their own entries
    (
      college_id = public.get_current_user_college_id()
      AND (
        (status = 'approved' AND is_deleted = false)
        OR author_id = auth.uid()
        OR public.is_current_user_college_admin()
        OR public.is_current_user_verified_faculty()
      )
    )
    OR
    -- Always allow author to view their own entries regardless of college
    author_id = auth.uid()
  );

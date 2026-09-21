-- ============================================================

-- College Knowledge Vault — COMPLETE DATABASE SETUP
-- Run this in your Supabase SQL Editor (New Query -> Run)
-- ============================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'senior', 'faculty');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE entry_type AS ENUM ('project', 'viva', 'mistake', 'resource');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE entry_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE frequency_level AS ENUM ('rare', 'common', 'very_common');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE flag_reason AS ENUM ('spam', 'inappropriate', 'duplicate', 'inaccurate', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Colleges Table (Multi-tenant with Invite Codes)
CREATE TABLE IF NOT EXISTS public.colleges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'India',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.users(id),
  student_invite_code text UNIQUE,
  faculty_invite_code text UNIQUE,
  admin_invite_code text UNIQUE,
  codes_generated_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(name, city)
);

-- 4. Users Table (Extends auth.users with Multi-Tenant & Invite Code tracking)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  role user_role NOT NULL DEFAULT 'student',
  college text NOT NULL DEFAULT '',
  college_id uuid REFERENCES public.colleges(id),
  department text NOT NULL DEFAULT '',
  graduation_year int,
  joining_year int,
  program text,
  program_duration int DEFAULT 4,
  is_verified boolean NOT NULL DEFAULT false,
  is_super_admin boolean NOT NULL DEFAULT false,
  is_college_admin boolean NOT NULL DEFAULT false,
  is_senior_revoked boolean NOT NULL DEFAULT false,
  faculty_verified_by uuid REFERENCES public.users(id),
  faculty_verified_at timestamptz,
  college_admin_verified_by uuid REFERENCES public.users(id),
  college_admin_verified_at timestamptz,
  pending_role_request text,
  joined_via_code text,
  code_type text CHECK (code_type IN ('student', 'faculty', 'college_admin')),
  fcm_token text,
  entry_count int NOT NULL DEFAULT 0,
  total_upvotes_received int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  is_predefined boolean NOT NULL DEFAULT false,
  usage_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Entries Table
CREATE TABLE IF NOT EXISTS public.entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  college_id uuid REFERENCES public.colleges(id),
  title text NOT NULL,
  description text NOT NULL,
  type entry_type NOT NULL,
  status entry_status NOT NULL DEFAULT 'pending',
  subject text NOT NULL DEFAULT '',
  semester int,
  file_url text,
  file_name text,
  file_size int,
  project_details jsonb,
  viva_details jsonb,
  mistake_details jsonb,
  resource_details jsonb,
  outdated_count int NOT NULL DEFAULT 0,
  is_marked_outdated boolean NOT NULL DEFAULT false,
  upvote_count int NOT NULL DEFAULT 0,
  view_count int NOT NULL DEFAULT 0,
  flag_count int NOT NULL DEFAULT 0,
  is_deleted boolean NOT NULL DEFAULT false,
  rejection_reason text,
  approved_by uuid REFERENCES public.users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure existing entries tables also have detail JSONB columns
ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS project_details jsonb,
  ADD COLUMN IF NOT EXISTS viva_details jsonb,
  ADD COLUMN IF NOT EXISTS mistake_details jsonb,
  ADD COLUMN IF NOT EXISTS resource_details jsonb,
  ADD COLUMN IF NOT EXISTS outdated_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_marked_outdated boolean NOT NULL DEFAULT false;

-- 7. Junction & Relation Tables
CREATE TABLE IF NOT EXISTS public.entry_tags (
  entry_id uuid REFERENCES public.entries(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.entry_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason flag_reason NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entry_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.upvotes (
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  entry_id uuid REFERENCES public.entries(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, entry_id)
);

CREATE TABLE IF NOT EXISTS public.outdated_marks (
  entry_id uuid REFERENCES public.entries(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entry_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  entry_id uuid REFERENCES public.entries(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, entry_id)
);

CREATE TABLE IF NOT EXISTS public.viva_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  difficulty difficulty_level NOT NULL DEFAULT 'medium',
  frequency frequency_level NOT NULL DEFAULT 'common',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Verification Request Tables
CREATE TABLE IF NOT EXISTS public.faculty_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  college_id uuid REFERENCES public.colleges(id),
  college text NOT NULL DEFAULT '',
  department text NOT NULL,
  employee_id text,
  designation text,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.users(id),
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE(user_id)
);

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

-- 9. Storage Bucket for PDF Project Reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-reports', 'project-reports', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 10. Triggers & Functions: Auto-create public.users row on Google Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url, is_super_admin)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    (LOWER(new.email) = 'hidagafoor05@gmail.com')
  )
  ON CONFLICT (id) DO UPDATE
  SET is_super_admin = CASE 
    WHEN LOWER(EXCLUDED.email) = 'hidagafoor05@gmail.com' THEN TRUE 
    ELSE public.users.is_super_admin 
  END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 11. Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_admin_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viva_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_flags ENABLE ROW LEVEL SECURITY;

-- Colleges RLS
DROP POLICY IF EXISTS "colleges_read_all" ON public.colleges;
CREATE POLICY "colleges_read_all" ON public.colleges FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "colleges_insert_super_admin" ON public.colleges;
CREATE POLICY "colleges_insert_super_admin" ON public.colleges FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_super_admin = true));

DROP POLICY IF EXISTS "colleges_update_admin" ON public.colleges;
CREATE POLICY "colleges_update_admin" ON public.colleges FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND (is_super_admin = true OR (is_college_admin = true AND college_id = colleges.id))
    )
  );

-- Users RLS
DROP POLICY IF EXISTS "users_read_all" ON public.users;
CREATE POLICY "users_read_all" ON public.users FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users FOR UPDATE TO authenticated
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (is_super_admin = true OR is_college_admin = true)));

-- Entries RLS
DROP POLICY IF EXISTS "entries_select_verified_college" ON public.entries;
CREATE POLICY "entries_select_verified_college" ON public.entries FOR SELECT TO authenticated
  USING (
    is_deleted = false
    AND (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_super_admin = true)
      OR author_id = auth.uid()
      OR (
        status = 'approved'
        AND (
          college_id IS NULL
          OR college_id = (SELECT college_id FROM public.users WHERE id = auth.uid())
        )
      )
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

DROP POLICY IF EXISTS "entries_insert_same_college" ON public.entries;
CREATE POLICY "entries_insert_same_college" ON public.entries FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "entries_update_owner_or_moderator" ON public.entries;
CREATE POLICY "entries_update_owner_or_moderator" ON public.entries FOR UPDATE TO authenticated
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND (u.is_super_admin = true OR u.is_college_admin = true OR (u.role = 'faculty' AND u.is_verified = true))
    )
  );

-- Storage RLS
DROP POLICY IF EXISTS "Public can view project reports" ON storage.objects;
CREATE POLICY "Public can view project reports" ON storage.objects FOR SELECT TO public USING (bucket_id = 'project-reports');

DROP POLICY IF EXISTS "Authenticated users can upload project reports" ON storage.objects;
CREATE POLICY "Authenticated users can upload project reports" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-reports');

DROP POLICY IF EXISTS "Authenticated users can update project reports" ON storage.objects;
CREATE POLICY "Authenticated users can update project reports" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'project-reports') WITH CHECK (bucket_id = 'project-reports');

-- Upvotes & Bookmarks RLS
DROP POLICY IF EXISTS "upvotes_all" ON public.upvotes;
CREATE POLICY "upvotes_all" ON public.upvotes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_all" ON public.bookmarks;
CREATE POLICY "bookmarks_all" ON public.bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Outdated Marks RLS
ALTER TABLE public.outdated_marks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "outdated_marks_read" ON public.outdated_marks;
CREATE POLICY "outdated_marks_read" ON public.outdated_marks FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "outdated_marks_insert" ON public.outdated_marks;
CREATE POLICY "outdated_marks_insert" ON public.outdated_marks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- College Admin Requests RLS
DROP POLICY IF EXISTS "car_insert_own" ON public.college_admin_requests;
CREATE POLICY "car_insert_own" ON public.college_admin_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "car_own_read" ON public.college_admin_requests;
CREATE POLICY "car_own_read" ON public.college_admin_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "car_super_admin_read" ON public.college_admin_requests;
CREATE POLICY "car_super_admin_read" ON public.college_admin_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_super_admin = true)
    OR auth.jwt() ->> 'email' = 'hidagafoor05@gmail.com'
  );

DROP POLICY IF EXISTS "car_update_super_admin" ON public.college_admin_requests;
CREATE POLICY "car_update_super_admin" ON public.college_admin_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_super_admin = true)
    OR auth.jwt() ->> 'email' = 'hidagafoor05@gmail.com'
  );

-- Faculty Requests RLS
DROP POLICY IF EXISTS "faculty_requests_own_insert" ON public.faculty_requests;
CREATE POLICY "faculty_requests_own_insert" ON public.faculty_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "faculty_requests_own_read" ON public.faculty_requests;
CREATE POLICY "faculty_requests_own_read" ON public.faculty_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "faculty_requests_admin_read" ON public.faculty_requests;
CREATE POLICY "faculty_requests_admin_read" ON public.faculty_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        u.is_super_admin = true
        OR (u.is_college_admin = true AND (u.college_id = faculty_requests.college_id OR faculty_requests.college_id IS NULL))
      )
    )
  );

DROP POLICY IF EXISTS "faculty_requests_admin_update" ON public.faculty_requests;
CREATE POLICY "faculty_requests_admin_update" ON public.faculty_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        u.is_super_admin = true
        OR (u.is_college_admin = true AND (u.college_id = faculty_requests.college_id OR faculty_requests.college_id IS NULL))
      )
    )
  );

-- 12. Case-insensitive unique indexes for Invite Codes
CREATE UNIQUE INDEX IF NOT EXISTS idx_colleges_student_code ON public.colleges(UPPER(student_invite_code));
CREATE UNIQUE INDEX IF NOT EXISTS idx_colleges_faculty_code ON public.colleges(UPPER(faculty_invite_code));
CREATE UNIQUE INDEX IF NOT EXISTS idx_colleges_admin_code ON public.colleges(UPPER(admin_invite_code));

-- ============================================================
-- 13. DESIGNATE YOUR GOOGLE ACCOUNT AS SUPER ADMIN
-- ============================================================

-- If you have already signed into Supabase once with hidagafoor05@gmail.com,
-- this inserts/updates your public.users record as Super Admin directly:
INSERT INTO public.users (id, email, display_name, is_super_admin)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)), TRUE
FROM auth.users
WHERE LOWER(email) = 'hidagafoor05@gmail.com'
ON CONFLICT (id) DO UPDATE SET is_super_admin = TRUE;

-- Update if the row already exists:
UPDATE public.users 
SET is_super_admin = TRUE 
WHERE LOWER(email) = 'hidagafoor05@gmail.com';

-- Migration: 007_invite_codes.sql
-- Description: Implement College Invite Code Verification System for secure multi-tenant access control

-- 1. Add invite codes and generation timestamp to colleges table
ALTER TABLE public.colleges
  ADD COLUMN IF NOT EXISTS student_invite_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS faculty_invite_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS admin_invite_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS codes_generated_at timestamptz;

-- 2. Add code tracking columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS joined_via_code text,
  ADD COLUMN IF NOT EXISTS code_type text
    CHECK (code_type IN ('student', 'faculty', 'college_admin'));

-- 3. Populate existing colleges with unique generated codes
-- Format: {4_LETTERS_FROM_NAME}{2_FROM_UUID}-{YEAR|FAC|ADM}-{RANDOM4}
UPDATE public.colleges
SET 
  student_invite_code = 
    UPPER(SUBSTRING(REGEXP_REPLACE(name, '[^A-Za-z]', '', 'g'), 1, 4))
    || UPPER(SUBSTRING(MD5(id::text), 1, 2))
    || '-' || EXTRACT(YEAR FROM NOW())::text 
    || '-' || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 4)),
  faculty_invite_code = 
    UPPER(SUBSTRING(REGEXP_REPLACE(name, '[^A-Za-z]', '', 'g'), 1, 4))
    || UPPER(SUBSTRING(MD5(id::text), 1, 2))
    || '-FAC-' || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 4)),
  admin_invite_code = 
    UPPER(SUBSTRING(REGEXP_REPLACE(name, '[^A-Za-z]', '', 'g'), 1, 4))
    || UPPER(SUBSTRING(MD5(id::text), 1, 2))
    || '-ADM-' || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 4)),
  codes_generated_at = NOW()
WHERE student_invite_code IS NULL;

-- 4. Case-insensitive unique indexes for fast code lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_colleges_student_code
  ON public.colleges(UPPER(student_invite_code));

CREATE UNIQUE INDEX IF NOT EXISTS idx_colleges_faculty_code
  ON public.colleges(UPPER(faculty_invite_code));

CREATE UNIQUE INDEX IF NOT EXISTS idx_colleges_admin_code
  ON public.colleges(UPPER(admin_invite_code));

-- 5. RLS: Only verified (code-joined) users see their college entries
DROP POLICY IF EXISTS "entries_select_same_college" ON public.entries;
DROP POLICY IF EXISTS "entries_select_verified_college" ON public.entries;

CREATE POLICY "entries_select_verified_college" ON public.entries
  FOR SELECT TO authenticated
  USING (
    is_deleted = false
    AND (
      -- Super Admin sees all entries
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND is_super_admin = true
      )
      -- Authors ALWAYS see their own entries (any status)
      OR author_id = auth.uid()
      -- Approved entries visible to same-college users
      OR (
        status = 'approved'
        AND (
          college_id IS NULL
          OR college_id = (SELECT college_id FROM public.users WHERE id = auth.uid())
        )
      )
      -- College Admin / Faculty see all entries in their college
      OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND (
          u.is_college_admin = true
          OR (u.role = 'faculty' AND u.is_verified = true)
        )
        AND (u.college_id = entries.college_id OR u.college_id IS NULL OR entries.college_id IS NULL)
      )
    )
  );

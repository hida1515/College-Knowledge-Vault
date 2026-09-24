-- ============================================================================
-- COLLEGE KNOWLEDGE VAULT — COMPLETE DATABASE RESET SCRIPT
-- ============================================================================
-- Run this script in:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run
--
-- What this does:
-- 1. Wipes all user submissions (entries, viva questions, tags, attachments)
-- 2. Wipes all engagement data (upvotes, bookmarks, comments, flags, outdated marks)
-- 3. Wipes all verification & administrative requests (faculty, college admin)
-- 4. Wipes all college invite codes & usage records
-- 5. Wipes all registered user accounts from public.users and auth.users
-- 6. Wipes all uploaded media files from Supabase Storage buckets
-- 7. Re-seeds default predefined tags and starter college so the app is 100% ready
-- ============================================================================

-- Step 1: Clear foreign key references that might block cascade
DO $$
BEGIN
  UPDATE public.colleges SET created_by = NULL;
  UPDATE public.users SET faculty_verified_by = NULL, college_admin_verified_by = NULL;
  UPDATE public.entries SET approved_by = NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Step 2: Truncate all application data tables
TRUNCATE TABLE 
  public.entry_comments,
  public.bookmarks,
  public.upvotes,
  public.outdated_marks,
  public.entry_flags,
  public.entry_tags,
  public.viva_questions,
  public.entries,
  public.faculty_requests,
  public.college_admin_requests,
  public.users,
  public.colleges
CASCADE;

-- Step 3: Clean up any legacy or auxiliary tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entry_upvotes') THEN
    TRUNCATE TABLE public.entry_upvotes CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'moderation_queue') THEN
    TRUNCATE TABLE public.moderation_queue CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flags') THEN
    TRUNCATE TABLE public.flags CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'comments') THEN
    TRUNCATE TABLE public.comments CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invite_code_uses') THEN
    TRUNCATE TABLE public.invite_code_uses CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'college_memberships') THEN
    TRUNCATE TABLE public.college_memberships CASCADE;
  END IF;
END $$;

-- Step 4: Delete all Supabase Auth records (resets all user logins, sessions, and tokens)
DELETE FROM auth.users;

-- Step 5: Clean up all uploaded media files from Supabase Storage
DELETE FROM storage.objects WHERE bucket_id IN ('entry-attachments', 'profile-avatars', 'attachments', 'avatars');

-- Step 6: Re-seed default predefined tags
DELETE FROM public.tags WHERE is_predefined = false;
INSERT INTO public.tags (name, is_predefined) VALUES
  ('Flutter', true),
  ('Dart', true),
  ('React Native', true),
  ('React', true),
  ('Node.js', true),
  ('Express', true),
  ('MongoDB', true),
  ('Firebase', true),
  ('Supabase', true),
  ('Python', true),
  ('Django', true),
  ('FastAPI', true),
  ('Java', true),
  ('Spring Boot', true),
  ('Kotlin', true),
  ('MySQL', true),
  ('PostgreSQL', true),
  ('TypeScript', true),
  ('JavaScript', true),
  ('Machine Learning', true),
  ('Data Structures', true),
  ('Algorithms', true),
  ('Computer Networks', true),
  ('Operating Systems', true),
  ('DBMS', true),
  ('Web Development', true),
  ('Android', true),
  ('iOS', true)
ON CONFLICT (name) DO NOTHING;

-- Step 7: Re-seed default college so new users have a college to select/join
INSERT INTO public.colleges (name, city, state, country, is_active) VALUES
  ('Model Engineering College', 'Kochi', 'Kerala', 'India', true)
ON CONFLICT (name, city) DO NOTHING;

-- Verification query (shows 0 for all cleared tables)
SELECT 
  (SELECT COUNT(*) FROM auth.users) AS auth_users_count,
  (SELECT COUNT(*) FROM public.users) AS users_count,
  (SELECT COUNT(*) FROM public.entries) AS entries_count,
  (SELECT COUNT(*) FROM public.colleges) AS colleges_count,
  (SELECT COUNT(*) FROM public.tags) AS tags_count;

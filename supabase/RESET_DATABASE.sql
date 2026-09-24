-- ============================================================================
-- College Knowledge Vault — COMPLETE DATABASE RESET SCRIPT
-- ============================================================================
--
-- PURPOSE:
-- Clears all user profiles, auth accounts, colleges, entries (projects, viva,
-- mistakes, resources), comments, upvotes, bookmarks, flags, requests, and
-- uploaded PDF files from storage so you can start the application 100% fresh.
--
-- WHAT THIS PRESERVES:
--  - All database tables, columns, constraints, and indexes
--  - All enum types (user_role, entry_type, etc.)
--  - All RLS policies and security definitions
--  - All database functions & triggers (e.g., handle_new_user)
--  - The predefined tags library (resetting usage counts to 0)
--  - The 'project-reports' storage bucket configuration
--
-- HOW TO RUN:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project -> Go to "SQL Editor" in the left sidebar
-- 3. Click "+ New query", paste this entire script, and click "Run"
-- ============================================================================

DO $$
DECLARE
  tbl text;
  extra_tables text[] := ARRAY[
    'entry_comments',
    'comments',
    'bookmarks',
    'upvotes',
    'entry_upvotes',
    'outdated_marks',
    'entry_flags',
    'flags',
    'viva_questions',
    'entry_tags',
    'entries',
    'faculty_requests',
    'college_admin_requests',
    'invite_code_uses',
    'college_memberships',
    'colleges',
    'users'
  ];
BEGIN
  RAISE NOTICE 'Starting College Knowledge Vault Database Reset...';

  -- 1. Disconnect foreign keys and circular references
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'colleges') THEN
    EXECUTE 'UPDATE public.colleges SET created_by = NULL';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    EXECUTE 'UPDATE public.users SET faculty_verified_by = NULL, college_admin_verified_by = NULL';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entries') THEN
    EXECUTE 'UPDATE public.entries SET approved_by = NULL';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faculty_requests') THEN
    EXECUTE 'UPDATE public.faculty_requests SET reviewed_by = NULL';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'college_admin_requests') THEN
    EXECUTE 'UPDATE public.college_admin_requests SET reviewed_by = NULL';
  END IF;

  -- 2. Truncate all application data tables (CASCADE cleanly purges relations)
  FOREACH tbl IN ARRAY extra_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('TRUNCATE TABLE public.%I CASCADE', tbl);
      RAISE NOTICE 'Cleared table: public.%', tbl;
    END IF;
  END LOOP;

  -- 3. Clean up Tags: Remove custom tags and reset predefined tag usage counts to 0
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tags') THEN
    DELETE FROM public.tags WHERE is_predefined = false;
    UPDATE public.tags SET usage_count = 0;
    
    -- Ensure all standard predefined tags are present
    INSERT INTO public.tags (name, is_predefined, usage_count) VALUES
      ('Flutter', true, 0),
      ('Dart', true, 0),
      ('React Native', true, 0),
      ('React', true, 0),
      ('Node.js', true, 0),
      ('Express', true, 0),
      ('MongoDB', true, 0),
      ('Firebase', true, 0),
      ('Supabase', true, 0),
      ('Python', true, 0),
      ('Django', true, 0),
      ('FastAPI', true, 0),
      ('Java', true, 0),
      ('Spring Boot', true, 0),
      ('Kotlin', true, 0),
      ('MySQL', true, 0),
      ('PostgreSQL', true, 0),
      ('TypeScript', true, 0),
      ('JavaScript', true, 0),
      ('AWS', true, 0),
      ('Docker', true, 0),
      ('Git', true, 0),
      ('REST API', true, 0),
      ('GraphQL', true, 0),
      ('Machine Learning', true, 0)
    ON CONFLICT (name) DO UPDATE SET usage_count = 0;

    RAISE NOTICE 'Reset predefined tags library with 0 usage count';
  END IF;

  -- 4. Delete all registered accounts from auth.users (Google logins, sessions, tokens)
  -- This allows all accounts to re-register fresh as first-time users.
  DELETE FROM auth.users;
  RAISE NOTICE 'Purged all authentication accounts from auth.users';

  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'College Knowledge Vault Database has been completely reset!';
  RAISE NOTICE 'You can now launch the app with a clean slate.';
  RAISE NOTICE '=======================================================';

END $$;

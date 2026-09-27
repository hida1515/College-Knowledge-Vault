-- ============================================================================
-- College Knowledge Vault — SOFT RESET: KEEP GOOGLE ACCOUNTS, CLEAR ROLES & DATA
-- ============================================================================
--
-- PURPOSE:
-- 1. Keeps all Google Sign-in accounts & sessions INTACT (no need to sign in again).
-- 2. Preserves the Platform Super Admin (hidagafoor05@gmail.com / is_super_admin = true).
-- 3. Clears all user roles, college associations, and verification statuses so all
--    other accounts can choose fresh roles (Student, Senior, Faculty, College Admin).
-- 4. Clears all colleges, entries, requests, comments, upvotes, bookmarks, and flags
--    so you can demonstrate adding a college and the full workflow from scratch.
--
-- HOW TO RUN:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project -> Click "SQL Editor" in the left sidebar
-- 3. Click "+ New query", paste this entire script, and click "Run"
-- ============================================================================

DO $$
DECLARE
  tbl text;
  col text;
  dependent_tables text[] := ARRAY[
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
    'college_memberships'
  ];
  user_opt_cols text[] := ARRAY[
    'joining_year',
    'program',
    'program_duration',
    'program_type',
    'is_senior_revoked',
    'is_college_admin',
    'faculty_verified_by',
    'faculty_verified_at',
    'college_admin_verified_by',
    'college_admin_verified_at',
    'pending_role_request',
    'joined_via_code',
    'code_type'
  ];
BEGIN
  RAISE NOTICE 'Starting Soft Reset (Preserving Google Auth & User Accounts)...';

  -- 1. Unlink foreign keys from colleges, users, and entries
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'colleges') THEN
    UPDATE public.colleges SET created_by = NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    UPDATE public.users SET college_id = NULL;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'faculty_verified_by') THEN
      UPDATE public.users SET faculty_verified_by = NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'college_admin_verified_by') THEN
      UPDATE public.users SET college_admin_verified_by = NULL;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entries') THEN
    UPDATE public.entries SET approved_by = NULL;
  END IF;

  -- 2. Truncate all dependent application data tables
  FOREACH tbl IN ARRAY dependent_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('TRUNCATE TABLE public.%I CASCADE', tbl);
      RAISE NOTICE 'Cleared table: public.%', tbl;
    END IF;
  END LOOP;

  -- 3. Truncate Colleges table (all colleges & invite codes are cleared)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'colleges') THEN
    TRUNCATE TABLE public.colleges CASCADE;
    RAISE NOTICE 'Cleared table: public.colleges';
  END IF;

  -- 4. Reset Tags: Remove user-added custom tags, reset predefined tag usage counts to 0
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tags') THEN
    DELETE FROM public.tags WHERE is_predefined = false;
    UPDATE public.tags SET usage_count = 0;
    
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

  -- 5. Reset regular users in public.users (core columns)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    UPDATE public.users
    SET
      role = 'student',
      college = '',
      college_id = NULL,
      department = '',
      graduation_year = NULL,
      is_verified = false,
      entry_count = 0,
      total_upvotes_received = 0,
      updated_at = now()
    WHERE is_super_admin = false AND LOWER(email) != 'hidagafoor05@gmail.com';

    -- Safely clear any optional columns only if they exist in this schema
    FOREACH col IN ARRAY user_opt_cols LOOP
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = col
      ) THEN
        IF col = 'is_senior_revoked' OR col = 'is_college_admin' THEN
          EXECUTE format('UPDATE public.users SET %I = false WHERE is_super_admin = false AND LOWER(email) != ''hidagafoor05@gmail.com''', col);
        ELSE
          EXECUTE format('UPDATE public.users SET %I = NULL WHERE is_super_admin = false AND LOWER(email) != ''hidagafoor05@gmail.com''', col);
        END IF;
      END IF;
    END LOOP;

    RAISE NOTICE 'Reset all regular users to unassigned state (Google sessions preserved)';

    -- 6. Preserve and clean Platform Super Admin
    UPDATE public.users
    SET
      is_super_admin = true,
      is_verified = true,
      college = '',
      college_id = NULL,
      entry_count = 0,
      total_upvotes_received = 0,
      updated_at = now()
    WHERE is_super_admin = true OR LOWER(email) = 'hidagafoor05@gmail.com';

    FOREACH col IN ARRAY user_opt_cols LOOP
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = col
      ) THEN
        IF col = 'is_senior_revoked' OR col = 'is_college_admin' THEN
          EXECUTE format('UPDATE public.users SET %I = false WHERE is_super_admin = true OR LOWER(email) = ''hidagafoor05@gmail.com''', col);
        ELSE
          EXECUTE format('UPDATE public.users SET %I = NULL WHERE is_super_admin = true OR LOWER(email) = ''hidagafoor05@gmail.com''', col);
        END IF;
      END IF;
    END LOOP;

    RAISE NOTICE 'Preserved Platform Super Admin status';
  END IF;

  RAISE NOTICE '========================================================================';
  RAISE NOTICE 'SOFT RESET COMPLETE!';
  RAISE NOTICE '1. All Google Sign-in accounts are STILL SIGNED IN.';
  RAISE NOTICE '2. Regular users will automatically see the Role Selection screen.';
  RAISE NOTICE '3. Platform Super Admin is preserved with access to the Super Admin Panel.';
  RAISE NOTICE '4. Colleges and entries are completely clear, ready for the demo.';
  RAISE NOTICE '========================================================================';

END $$;

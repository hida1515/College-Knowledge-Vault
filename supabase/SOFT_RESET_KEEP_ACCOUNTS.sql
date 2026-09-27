-- ============================================================================
-- College Knowledge Vault — SOFT RESET (Keep Google Accounts, Wipe Roles)
-- ============================================================================
--
-- PURPOSE:
-- Clears all colleges, entries, requests, and user role/profile data
-- BUT keeps every Google sign-in account intact so nobody needs to log in again.
-- The Super Admin (hidagafoor05@gmail.com) is left completely untouched.
--
-- AFTER RUNNING THIS:
--  ✅ All Google accounts still work (no re-login needed)
--  ✅ Super Admin keeps full access
--  ✅ Every OTHER user goes back to the Role Selection screen
--  ✅ All colleges, entries, bookmarks, comments, etc. are wiped clean
--  ✅ Predefined tags are preserved with usage_count = 0
--
-- HOW TO RUN:
-- 1. Open Supabase Dashboard → SQL Editor → + New query
-- 2. Paste this entire script and click "Run"
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Starting Soft Reset (keeping Google accounts)...';

  -- ──────────────────────────────────────────────
  -- 1. Break circular foreign key references
  -- ──────────────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'colleges') THEN
    UPDATE public.colleges SET created_by = NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    UPDATE public.users SET faculty_verified_by = NULL, college_admin_verified_by = NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entries') THEN
    UPDATE public.entries SET approved_by = NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faculty_requests') THEN
    UPDATE public.faculty_requests SET reviewed_by = NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'college_admin_requests') THEN
    UPDATE public.college_admin_requests SET reviewed_by = NULL;
  END IF;

  -- ──────────────────────────────────────────────
  -- 2. Truncate all content tables (entries, comments, bookmarks, etc.)
  --    These tables reference users, so they must be cleared first.
  -- ──────────────────────────────────────────────
  -- Comments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entry_comments') THEN
    TRUNCATE TABLE public.entry_comments CASCADE;
    RAISE NOTICE '  Cleared: entry_comments';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
    TRUNCATE TABLE public.comments CASCADE;
    RAISE NOTICE '  Cleared: comments';
  END IF;

  -- Bookmarks & Upvotes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookmarks') THEN
    TRUNCATE TABLE public.bookmarks CASCADE;
    RAISE NOTICE '  Cleared: bookmarks';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'upvotes') THEN
    TRUNCATE TABLE public.upvotes CASCADE;
    RAISE NOTICE '  Cleared: upvotes';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entry_upvotes') THEN
    TRUNCATE TABLE public.entry_upvotes CASCADE;
    RAISE NOTICE '  Cleared: entry_upvotes';
  END IF;

  -- Flags & Outdated marks
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'outdated_marks') THEN
    TRUNCATE TABLE public.outdated_marks CASCADE;
    RAISE NOTICE '  Cleared: outdated_marks';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entry_flags') THEN
    TRUNCATE TABLE public.entry_flags CASCADE;
    RAISE NOTICE '  Cleared: entry_flags';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flags') THEN
    TRUNCATE TABLE public.flags CASCADE;
    RAISE NOTICE '  Cleared: flags';
  END IF;

  -- Viva questions & Entry tags
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'viva_questions') THEN
    TRUNCATE TABLE public.viva_questions CASCADE;
    RAISE NOTICE '  Cleared: viva_questions';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entry_tags') THEN
    TRUNCATE TABLE public.entry_tags CASCADE;
    RAISE NOTICE '  Cleared: entry_tags';
  END IF;

  -- Entries
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entries') THEN
    TRUNCATE TABLE public.entries CASCADE;
    RAISE NOTICE '  Cleared: entries';
  END IF;

  -- Verification requests
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faculty_requests') THEN
    TRUNCATE TABLE public.faculty_requests CASCADE;
    RAISE NOTICE '  Cleared: faculty_requests';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'college_admin_requests') THEN
    TRUNCATE TABLE public.college_admin_requests CASCADE;
    RAISE NOTICE '  Cleared: college_admin_requests';
  END IF;

  -- Invite code uses & memberships
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invite_code_uses') THEN
    TRUNCATE TABLE public.invite_code_uses CASCADE;
    RAISE NOTICE '  Cleared: invite_code_uses';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'college_memberships') THEN
    TRUNCATE TABLE public.college_memberships CASCADE;
    RAISE NOTICE '  Cleared: college_memberships';
  END IF;

  -- Colleges
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'colleges') THEN
    TRUNCATE TABLE public.colleges CASCADE;
    RAISE NOTICE '  Cleared: colleges';
  END IF;

  -- ──────────────────────────────────────────────
  -- 3. Reset ALL non-super-admin users back to fresh state
  --    (They keep their id, email, display_name, avatar_url)
  --    (Super Admin is NOT touched at all)
  -- ──────────────────────────────────────────────
  UPDATE public.users
  SET
    role              = 'student',
    college           = '',
    college_id        = NULL,
    department        = '',
    graduation_year   = NULL,
    joining_year      = NULL,
    program           = NULL,
    program_type      = NULL,
    program_duration  = 4,
    is_verified       = false,
    is_college_admin  = false,
    is_senior_revoked = false,
    faculty_verified_by      = NULL,
    faculty_verified_at      = NULL,
    college_admin_verified_by = NULL,
    college_admin_verified_at = NULL,
    pending_role_request     = NULL,
    joined_via_code          = NULL,
    code_type                = NULL,
    entry_count              = 0,
    total_upvotes_received   = 0,
    updated_at               = now()
  WHERE is_super_admin = false;

  RAISE NOTICE 'Reset all non-super-admin user profiles to fresh state';

  -- ──────────────────────────────────────────────
  -- 4. Reset tags (remove custom, reset usage counts)
  -- ──────────────────────────────────────────────
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

    RAISE NOTICE 'Reset predefined tags with 0 usage count';
  END IF;

  -- ──────────────────────────────────────────────
  -- 5. Done!
  -- ──────────────────────────────────────────────
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'SOFT RESET COMPLETE!';
  RAISE NOTICE '  - All Google accounts preserved (no re-login needed)';
  RAISE NOTICE '  - Super Admin (hidagafoor05@gmail.com) untouched';
  RAISE NOTICE '  - All other users will see Role Selection on next open';
  RAISE NOTICE '  - All colleges, entries, requests wiped clean';
  RAISE NOTICE '==========================================================';

END $$;

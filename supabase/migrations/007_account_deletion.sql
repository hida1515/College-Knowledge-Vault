-- ============================================================================
-- Migration 007: Complete Account Deletion
-- DPDP Act 2023 & Google Play Account Deletion Policy Compliance
-- ============================================================================

-- Fix 1: Ensure roll_number column does not exist on entries
ALTER TABLE public.entries 
  DROP COLUMN IF EXISTS roll_number;

-- Fix 2: Secure Account Deletion RPC function (Completely purges user and auth record)
CREATE OR REPLACE FUNCTION public.delete_user_account(
  user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Verify caller is deleting their own account or is super admin
  IF auth.uid() != user_id AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Caller can only delete their own account';
  END IF;

  -- 1. Clear any foreign key references where this user is an approver, reviewer, or creator
  UPDATE public.colleges SET created_by = NULL WHERE created_by = user_id;
  UPDATE public.users SET faculty_verified_by = NULL WHERE faculty_verified_by = user_id;
  UPDATE public.users SET college_admin_verified_by = NULL WHERE college_admin_verified_by = user_id;
  UPDATE public.entries SET approved_by = NULL WHERE approved_by = user_id;
  UPDATE public.faculty_requests SET reviewed_by = NULL WHERE reviewed_by = user_id;
  UPDATE public.college_admin_requests SET reviewed_by = NULL WHERE reviewed_by = user_id;

  -- 2. Delete user's bookmarks, upvotes, requests, code uses, memberships, comments, and entries
  DELETE FROM public.bookmarks WHERE user_id = user_id;
  DELETE FROM public.upvotes WHERE user_id = user_id;
  DELETE FROM public.entry_flags WHERE user_id = user_id;
  DELETE FROM public.outdated_marks WHERE user_id = user_id;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entry_upvotes') THEN
    DELETE FROM public.entry_upvotes WHERE user_id = user_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invite_code_uses') THEN
    DELETE FROM public.invite_code_uses WHERE user_id = user_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'college_memberships') THEN
    DELETE FROM public.college_memberships WHERE user_id = user_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
    DELETE FROM public.comments WHERE user_id = user_id;
  END IF;

  DELETE FROM public.faculty_requests WHERE user_id = user_id;
  DELETE FROM public.college_admin_requests WHERE user_id = user_id;
  DELETE FROM public.entries WHERE author_id = user_id;

  -- 3. Delete completely from public.users
  DELETE FROM public.users WHERE id = user_id;

  -- 4. Delete completely from auth.users (so user can re-register fresh with the same email)
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_account(uuid) TO authenticated;

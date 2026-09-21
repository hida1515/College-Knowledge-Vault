-- ============================================================================
-- Migration 007: Account Deletion & Roll Number Dropping
-- DPDP Act 2023 & Google Play Account Deletion Policy Compliance
-- ============================================================================

-- Fix 1: Ensure roll_number column does not exist on entries
ALTER TABLE public.entries 
  DROP COLUMN IF EXISTS roll_number;

-- Fix 3: Secure Account Deletion RPC function
CREATE OR REPLACE FUNCTION public.delete_user_account(
  user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify caller is deleting their own account
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller can only delete their own account';
  END IF;

  -- 1. Anonymize personal data in users table
  UPDATE public.users SET
    email = 'deleted-' || user_id || '@deleted.com',
    display_name = 'Deleted User',
    avatar_url = null,
    fcm_token = null
  WHERE id = user_id;

  -- 2. Delete personal user records
  DELETE FROM public.bookmarks WHERE user_id = user_id;
  DELETE FROM public.entry_upvotes WHERE user_id = user_id;
  DELETE FROM public.invite_code_uses WHERE user_id = user_id;
  DELETE FROM public.faculty_requests WHERE user_id = user_id;
  DELETE FROM public.college_admin_requests WHERE user_id = user_id;

  -- 3. Soft delete all submitted entries (content preserved anonymously)
  UPDATE public.entries SET is_deleted = true
  WHERE author_id = user_id;

  -- 4. Delete from auth.users
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

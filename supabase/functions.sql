-- ============================================================
-- College Knowledge Vault — Database Functions & Triggers
-- Run this THIRD in Supabase SQL Editor (after rls_policies.sql)
-- ============================================================

-- ============================================================
-- Function: handle_new_user
-- Auto-creates a public.users row when a new auth.users row is inserted
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', NULL)
  );
  RETURN NEW;
END;
$$;

-- Trigger: on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Function: handle_updated_at
-- Auto-updates the updated_at column on any row change
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to tables with updated_at column
CREATE OR REPLACE TRIGGER set_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_entries
  BEFORE UPDATE ON public.entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Function: auto_create_moderation_record
-- Auto-creates a moderation_queue row when a new entry is inserted
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_create_moderation_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.moderation_queue (entry_id, submitted_by, status)
  VALUES (NEW.id, NEW.author_id, 'pending');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_entry_created
  AFTER INSERT ON public.entries
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_moderation_record();

-- ============================================================
-- Function: update_upvote_count
-- Syncs entries.upvote_count when upvotes are added/removed
-- Also syncs users.total_upvotes_received for the entry author
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_upvote_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment entry upvote count
    UPDATE public.entries
    SET upvote_count = upvote_count + 1
    WHERE id = NEW.entry_id
    RETURNING author_id INTO v_author_id;

    -- Increment author's total upvotes received
    IF v_author_id IS NOT NULL THEN
      UPDATE public.users
      SET total_upvotes_received = total_upvotes_received + 1
      WHERE id = v_author_id;
    END IF;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement entry upvote count
    UPDATE public.entries
    SET upvote_count = GREATEST(upvote_count - 1, 0)
    WHERE id = OLD.entry_id
    RETURNING author_id INTO v_author_id;

    -- Decrement author's total upvotes received
    IF v_author_id IS NOT NULL THEN
      UPDATE public.users
      SET total_upvotes_received = GREATEST(total_upvotes_received - 1, 0)
      WHERE id = v_author_id;
    END IF;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER on_upvote_changed
  AFTER INSERT OR DELETE ON public.entry_upvotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_upvote_count();

-- ============================================================
-- Function: update_tag_usage_count
-- Syncs tags.usage_count when entry_tags are added/removed
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_tag_usage_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tags
    SET usage_count = usage_count + 1
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tags
    SET usage_count = GREATEST(usage_count - 1, 0)
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER on_entry_tag_changed
  AFTER INSERT OR DELETE ON public.entry_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tag_usage_count();

-- ============================================================
-- Function: update_user_entry_count
-- Syncs users.entry_count when entries are added/removed
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_user_entry_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users
    SET entry_count = entry_count + 1
    WHERE id = NEW.author_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.users
    SET entry_count = GREATEST(entry_count - 1, 0)
    WHERE id = OLD.author_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER on_entry_count_changed
  AFTER INSERT OR DELETE ON public.entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_entry_count();

-- ============================================================
-- Function: update_flag_count
-- Syncs entries.flag_count when flags are added/resolved
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_flag_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.entries
    SET flag_count = flag_count + 1
    WHERE id = NEW.entry_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If flag was just resolved, decrement
    IF NEW.is_resolved = true AND OLD.is_resolved = false THEN
      UPDATE public.entries
      SET flag_count = GREATEST(flag_count - 1, 0)
      WHERE id = NEW.entry_id;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER on_flag_changed
  AFTER INSERT OR UPDATE ON public.flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_flag_count();

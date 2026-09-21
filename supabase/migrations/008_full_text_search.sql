-- ============================================================================
-- Migration 008: Full Text & Unified Vault Search
-- Allows searching across entry titles, descriptions, viva questions, and tags
-- with match source identification and snippet extraction
-- ============================================================================

CREATE OR REPLACE FUNCTION public.search_vault_entries(
  search_query text,
  p_college_id uuid,
  p_entry_type text DEFAULT NULL,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  type text,
  status text,
  college_id uuid,
  author_id uuid,
  upvote_count int,
  view_count int,
  created_at timestamptz,
  match_source text,
  match_snippet text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  
  -- 1. Match on entry title / description
  SELECT DISTINCT ON (e.id)
    e.id,
    e.title,
    e.description,
    e.type::text,
    e.status::text,
    e.college_id,
    e.author_id,
    COALESCE(e.upvote_count, 0)::int AS upvote_count,
    COALESCE(e.view_count, 0)::int AS view_count,
    e.created_at,
    'entry'::text AS match_source,
    e.title AS match_snippet
  FROM public.entries e
  WHERE 
    e.status = 'approved'
    AND e.is_deleted = false
    AND (
      e.college_id = p_college_id
      OR e.college_id IS NULL
    )
    AND (p_entry_type IS NULL OR e.type::text = p_entry_type)
    AND (
      e.title ILIKE '%' || search_query || '%'
      OR e.description ILIKE '%' || search_query || '%'
    )
  
  UNION
  
  -- 2. Match on viva questions & answers
  SELECT DISTINCT ON (e.id)
    e.id,
    e.title,
    e.description,
    e.type::text,
    e.status::text,
    e.college_id,
    e.author_id,
    COALESCE(e.upvote_count, 0)::int AS upvote_count,
    COALESCE(e.view_count, 0)::int AS view_count,
    e.created_at,
    'viva_question'::text AS match_source,
    vq.question AS match_snippet
  FROM public.viva_questions vq
  JOIN public.entries e ON e.id = vq.entry_id
  WHERE
    e.status = 'approved'
    AND e.is_deleted = false
    AND (
      e.college_id = p_college_id
      OR e.college_id IS NULL
    )
    AND (p_entry_type IS NULL OR e.type::text = p_entry_type)
    AND (
      vq.question ILIKE '%' || search_query || '%'
      OR vq.answer ILIKE '%' || search_query || '%'
    )
  
  UNION
  
  -- 3. Match on tags
  SELECT DISTINCT ON (e.id)
    e.id,
    e.title,
    e.description,
    e.type::text,
    e.status::text,
    e.college_id,
    e.author_id,
    COALESCE(e.upvote_count, 0)::int AS upvote_count,
    COALESCE(e.view_count, 0)::int AS view_count,
    e.created_at,
    'tag'::text AS match_source,
    t.name AS match_snippet
  FROM public.entry_tags et
  JOIN public.tags t ON t.id = et.tag_id
  JOIN public.entries e ON e.id = et.entry_id
  WHERE
    e.status = 'approved'
    AND e.is_deleted = false
    AND (
      e.college_id = p_college_id
      OR e.college_id IS NULL
    )
    AND (p_entry_type IS NULL OR e.type::text = p_entry_type)
    AND t.name ILIKE '%' || search_query || '%'
  
  ORDER BY created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

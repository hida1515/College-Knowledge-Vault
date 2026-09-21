-- ============================================================
-- College Knowledge Vault — Database Schema
-- Run this FIRST in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Custom Enums
-- ============================================================

CREATE TYPE user_role AS ENUM ('student', 'senior', 'faculty');
CREATE TYPE entry_type AS ENUM ('project', 'viva', 'mistake', 'resource');
CREATE TYPE entry_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE frequency_level AS ENUM ('rare', 'common', 'very_common');
CREATE TYPE flag_reason AS ENUM
  ('spam', 'inappropriate', 'duplicate', 'inaccurate', 'other');

-- ============================================================
-- Table: users (extends auth.users)
-- ============================================================

CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  role user_role NOT NULL DEFAULT 'student',
  college text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  graduation_year int,
  is_verified boolean NOT NULL DEFAULT false,
  fcm_token text,
  entry_count int NOT NULL DEFAULT 0,
  total_upvotes_received int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Table: tags
-- ============================================================

CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  is_predefined boolean NOT NULL DEFAULT false,
  usage_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Table: entries
-- ============================================================

CREATE TABLE public.entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  type entry_type NOT NULL,
  status entry_status NOT NULL DEFAULT 'pending',
  subject text NOT NULL DEFAULT '',
  semester int,
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

-- ============================================================
-- Table: entry_tags (junction)
-- ============================================================

CREATE TABLE public.entry_tags (
  entry_id uuid REFERENCES public.entries(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);

-- ============================================================
-- Table: entry_upvotes (junction)
-- ============================================================

CREATE TABLE public.entry_upvotes (
  entry_id uuid REFERENCES public.entries(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entry_id, user_id)
);

-- ============================================================
-- Table: viva_questions
-- ============================================================

CREATE TABLE public.viva_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text,
  difficulty difficulty_level NOT NULL DEFAULT 'medium',
  frequency frequency_level NOT NULL DEFAULT 'common',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Table: moderation_queue
-- ============================================================

CREATE TABLE public.moderation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES public.users(id),
  reviewed_by uuid REFERENCES public.users(id),
  status entry_status NOT NULL DEFAULT 'pending',
  review_note text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

-- ============================================================
-- Table: flags
-- ============================================================

CREATE TABLE public.flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES public.users(id),
  reason flag_reason NOT NULL,
  description text,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE(entry_id, reported_by)
);

-- ============================================================
-- Performance Indexes
-- ============================================================

CREATE INDEX idx_entries_status ON public.entries(status)
  WHERE is_deleted = false;
CREATE INDEX idx_entries_author ON public.entries(author_id);
CREATE INDEX idx_entries_type ON public.entries(type)
  WHERE status = 'approved' AND is_deleted = false;
CREATE INDEX idx_entries_created ON public.entries(created_at DESC)
  WHERE status = 'approved' AND is_deleted = false;
CREATE INDEX idx_modqueue_status ON public.moderation_queue(status)
  WHERE is_deleted = false;
CREATE INDEX idx_flags_entry ON public.flags(entry_id)
  WHERE is_resolved = false;

-- ============================================================
-- Seed Predefined Tags
-- ============================================================

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
  ('AWS', true),
  ('Docker', true),
  ('Git', true),
  ('REST API', true),
  ('GraphQL', true),
  ('Machine Learning', true);

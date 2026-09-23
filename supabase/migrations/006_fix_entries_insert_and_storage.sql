-- ============================================================
-- Migration 006: Fix Entries Insert RLS & Setup Storage Bucket
-- College Knowledge Vault
-- Run this in Supabase SQL Editor to resolve:
-- 1. "new row violates row-level security policy for table 'entries'"
-- 2. "Network request failed" / Storage error when uploading project reports
-- ============================================================

-- ============================================================
-- Step 1: Storage Bucket for Project Reports
-- ============================================================

-- Create 'project-reports' bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-reports', 'project-reports', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies
-- Allow anyone to view/read project reports
DROP POLICY IF EXISTS "Public can view project reports" ON storage.objects;
CREATE POLICY "Public can view project reports"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'project-reports');

-- Allow authenticated users to upload project reports
DROP POLICY IF EXISTS "Authenticated users can upload project reports" ON storage.objects;
CREATE POLICY "Authenticated users can upload project reports"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-reports');

-- Allow authenticated users to update their own uploads
DROP POLICY IF EXISTS "Users can update own project reports" ON storage.objects;
CREATE POLICY "Users can update own project reports"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'project-reports' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own uploads
DROP POLICY IF EXISTS "Users can delete own project reports" ON storage.objects;
CREATE POLICY "Users can delete own project reports"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'project-reports' AND (auth.uid())::text = (storage.foldername(name))[1]);


-- ============================================================
-- Step 2: Fix Entries Insert RLS Policy
-- ============================================================

-- Drop all previous conflicting insert policies
DROP POLICY IF EXISTS "entries_insert" ON public.entries;
DROP POLICY IF EXISTS "entries_insert_senior_faculty" ON public.entries;
DROP POLICY IF EXISTS "entries_insert_same_college" ON public.entries;

-- Create comprehensive, robust INSERT policy
CREATE POLICY "entries_insert_same_college" ON public.entries
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Author must be the currently authenticated user and not have privileges revoked
    author_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.is_senior_revoked = false
      )
    )
  );

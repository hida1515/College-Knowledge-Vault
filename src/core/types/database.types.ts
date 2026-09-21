/**
 * Database Types — Supabase Schema
 * College Knowledge Vault
 *
 * Hand-crafted TypeScript types matching the PostgreSQL schema.
 * Provides full type safety on all Supabase queries.
 */

// ============================================================
// PostgreSQL Enum Types
// ============================================================

export type DbUserRole = 'student' | 'senior' | 'faculty';
export type DbEntryType = 'project' | 'viva' | 'mistake' | 'resource';
export type DbEntryStatus = 'pending' | 'approved' | 'rejected';
export type DbDifficultyLevel = 'easy' | 'medium' | 'hard';
export type DbFrequencyLevel = 'rare' | 'common' | 'very_common';
export type DbFlagReason = 'spam' | 'inappropriate' | 'duplicate' | 'inaccurate' | 'other';

// ============================================================
// Table Row Types
// ============================================================

export interface DbCollege {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  is_active: boolean;
  student_invite_code?: string | null;
  faculty_invite_code?: string | null;
  admin_invite_code?: string | null;
  codes_generated_at?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCollegeAdminRequest {
  id: string;
  user_id: string;
  college_id: string | null;
  college_name: string;
  college_city: string;
  college_state: string;
  designation: string;
  employee_id: string | null;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface DbUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: DbUserRole;
  college: string;
  college_id: string | null;
  department: string;
  graduation_year: number | null;
  joining_year: number | null;
  program: string | null;
  program_type: 'ug' | 'pg' | 'phd' | null;
  program_duration: number | null;
  is_verified: boolean;
  is_super_admin: boolean;
  is_college_admin: boolean;
  is_senior_revoked: boolean;
  faculty_verified_by: string | null;
  faculty_verified_at: string | null;
  college_admin_verified_by: string | null;
  college_admin_verified_at: string | null;
  pending_role_request: string | null;
  fcm_token: string | null;
  entry_count: number;
  total_upvotes_received: number;
  joined_via_code?: string | null;
  code_type?: 'student' | 'faculty' | 'college_admin' | null;
  created_at: string;
  updated_at: string;
}

export interface DbFacultyRequest {
  id: string;
  user_id: string;
  college: string;
  department: string;
  employee_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface DbTag {
  id: string;
  name: string;
  is_predefined: boolean;
  usage_count: number;
  created_at: string;
}

export interface DbEntry {
  id: string;
  author_id: string;
  college_id: string | null;
  title: string;
  description: string;
  type: DbEntryType;
  status: DbEntryStatus;
  subject: string;
  semester: number | null;
  upvote_count: number;
  view_count: number;
  flag_count: number;
  is_deleted: boolean;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbEntryTag {
  entry_id: string;
  tag_id: string;
}

export interface DbEntryUpvote {
  entry_id: string;
  user_id: string;
  created_at: string;
}

export interface DbVivaQuestion {
  id: string;
  entry_id: string;
  question: string;
  answer: string | null;
  difficulty: DbDifficultyLevel;
  frequency: DbFrequencyLevel;
  created_at: string;
}

export interface DbModerationRecord {
  id: string;
  entry_id: string;
  submitted_by: string;
  reviewed_by: string | null;
  status: DbEntryStatus;
  review_note: string | null;
  is_deleted: boolean;
  created_at: string;
  reviewed_at: string | null;
}

export interface DbFlag {
  id: string;
  entry_id: string;
  reported_by: string;
  reason: DbFlagReason;
  description: string | null;
  is_resolved: boolean;
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
}

// ============================================================
// Insert Types (omit server-generated fields)
// ============================================================

export type DbUserInsert = Omit<DbUser, 'created_at' | 'updated_at' | 'entry_count' | 'total_upvotes_received'>;

export type DbEntryInsert = Omit<DbEntry, 'id' | 'created_at' | 'updated_at' | 'upvote_count' | 'view_count' | 'flag_count' | 'is_deleted' | 'approved_by' | 'approved_at'>;

export type DbVivaQuestionInsert = Omit<DbVivaQuestion, 'id' | 'created_at'>;

export type DbFlagInsert = Omit<DbFlag, 'id' | 'created_at' | 'is_resolved' | 'resolved_by' | 'resolved_at'>;

// ============================================================
// Update Types
// ============================================================

export type DbUserUpdate = Partial<DbUser>;
export type DbEntryUpdate = Partial<DbEntry>;

// ============================================================
// Supabase Database Type
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: DbUser;
        Insert: DbUserInsert;
        Update: DbUserUpdate;
        Relationships: [];
      };
      tags: {
        Row: DbTag;
        Insert: Omit<DbTag, 'id' | 'created_at' | 'usage_count'>;
        Update: Partial<DbTag>;
        Relationships: [];
      };
      entries: {
        Row: DbEntry;
        Insert: DbEntryInsert;
        Update: DbEntryUpdate;
        Relationships: [];
      };
      entry_tags: {
        Row: DbEntryTag;
        Insert: DbEntryTag;
        Update: Partial<DbEntryTag>;
        Relationships: [];
      };
      entry_upvotes: {
        Row: DbEntryUpvote;
        Insert: Omit<DbEntryUpvote, 'created_at'>;
        Update: Partial<DbEntryUpvote>;
        Relationships: [];
      };
      viva_questions: {
        Row: DbVivaQuestion;
        Insert: DbVivaQuestionInsert;
        Update: Partial<DbVivaQuestion>;
        Relationships: [];
      };
      moderation_queue: {
        Row: DbModerationRecord;
        Insert: Omit<DbModerationRecord, 'id' | 'created_at' | 'reviewed_by' | 'reviewed_at' | 'review_note' | 'is_deleted'>;
        Update: Partial<DbModerationRecord>;
        Relationships: [];
      };
      flags: {
        Row: DbFlag;
        Insert: DbFlagInsert;
        Update: Partial<DbFlag>;
        Relationships: [];
      };
      faculty_requests: {
        Row: DbFacultyRequest;
        Insert: Omit<DbFacultyRequest, 'id' | 'created_at' | 'status' | 'reviewed_by' | 'reviewed_at' | 'review_note'>;
        Update: Partial<DbFacultyRequest>;
        Relationships: [];
      };
      colleges: {
        Row: DbCollege;
        Insert: Omit<DbCollege, 'id' | 'created_at' | 'updated_at' | 'is_active'>;
        Update: Partial<DbCollege>;
        Relationships: [];
      };
      college_admin_requests: {
        Row: DbCollegeAdminRequest;
        Insert: Omit<DbCollegeAdminRequest, 'id' | 'created_at' | 'status' | 'reviewed_by' | 'reviewed_at' | 'review_note'>;
        Update: Partial<DbCollegeAdminRequest>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_role: {
        Args: Record<string, never>;
        Returns: DbUserRole;
      };
    };
    Enums: {
      user_role: DbUserRole;
      entry_type: DbEntryType;
      entry_status: DbEntryStatus;
      difficulty_level: DbDifficultyLevel;
      frequency_level: DbFrequencyLevel;
      flag_reason: DbFlagReason;
    };
    CompositeTypes: Record<string, never>;
  };
}

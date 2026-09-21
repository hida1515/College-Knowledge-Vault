/**
 * User Types & Multi-Tenant College Models
 * College Knowledge Vault
 *
 * Updated for Program-Based Seniority & Multi-Tenant College System.
 */

import type { Session as SupabaseSession } from '@supabase/supabase-js';

export enum UserRole {
  Student = 'student',
  Senior = 'senior',
  Faculty = 'faculty',
}

export enum EffectiveRole {
  SuperAdmin = 'super_admin',
  CollegeAdmin = 'college_admin',
  Faculty = 'faculty',
  PendingFaculty = 'pending_faculty',
  Senior = 'senior',
  Student = 'student',
}

export interface AcademicStanding {
  currentProgramYear: number | null;
  isFinalYear: boolean;
  isAlumni: boolean;
  graduationYear: number | null;
  accessLevel: 'senior' | 'student' | 'alumni';
  accessMessage: string;
  accessColor: string;
}

export interface College {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  isActive: boolean;
  studentInviteCode?: string | null;
  facultyInviteCode?: string | null;
  adminInviteCode?: string | null;
  codesGeneratedAt?: string | null;
  createdBy?: string | null;
  createdAt?: string;
}

export interface CollegeAdminRequest {
  id: string;
  userId: string;
  userDisplayName?: string;
  userEmail?: string;
  collegeId: string | null;
  collegeName: string;
  collegeCity: string;
  collegeState: string;
  designation: string;
  employeeId: string | null;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  college: string;
  collegeId: string | null;
  collegeName: string | null;
  department: string;
  graduationYear: number | null;
  joiningYear: number | null;
  program: string | null;
  programType: 'ug' | 'pg' | 'phd' | null;
  programDuration: number | null;
  isVerified: boolean;
  isSuperAdmin: boolean;
  isCollegeAdmin: boolean;
  isSeniorRevoked: boolean;
  facultyVerifiedBy: string | null;
  facultyVerifiedAt: string | null;
  collegeAdminVerifiedBy: string | null;
  collegeAdminVerifiedAt: string | null;
  pendingRoleRequest: string | null;
  fcmToken: string | null;
  entryCount: number;
  totalUpvotesReceived: number;
  joinedViaCode?: string | null;
  codeType?: 'student' | 'faculty' | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  totalEntries: number;
  totalUpvotes: number;
  totalViews: number;
}

/** Re-export Supabase's Session type for use throughout the app */
export type Session = SupabaseSession;

/**
 * Maps a database row (snake_case) to the app User model (camelCase).
 */
export function mapDbUserToUser(dbUser: {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
  college: string;
  college_id?: string | null;
  college_name?: string | null;
  department: string;
  graduation_year: number | null;
  joining_year?: number | null;
  program?: string | null;
  program_type?: 'ug' | 'pg' | 'phd' | null;
  program_duration?: number | null;
  is_verified?: boolean;
  is_super_admin?: boolean;
  is_college_admin?: boolean;
  is_senior_revoked?: boolean;
  faculty_verified_by?: string | null;
  faculty_verified_at?: string | null;
  college_admin_verified_by?: string | null;
  college_admin_verified_at?: string | null;
  pending_role_request?: string | null;
  fcm_token?: string | null;
  entry_count?: number;
  total_upvotes_received?: number;
  joined_via_code?: string | null;
  code_type?: 'student' | 'faculty' | 'college_admin' | null;
  created_at: string;
  updated_at: string;
}): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    displayName: dbUser.display_name,
    avatarUrl: dbUser.avatar_url,
    role: dbUser.role as UserRole,
    college: dbUser.college || dbUser.college_name || '',
    collegeId: dbUser.college_id ?? null,
    collegeName: dbUser.college_name || dbUser.college || null,
    department: dbUser.department,
    graduationYear: dbUser.graduation_year ?? null,
    joiningYear: dbUser.joining_year ?? null,
    program: dbUser.program ?? null,
    programType: dbUser.program_type ?? null,
    programDuration: dbUser.program_duration ?? null,
    isVerified: Boolean(dbUser.is_verified),
    isSuperAdmin: Boolean(dbUser.is_super_admin),
    isCollegeAdmin: Boolean(dbUser.is_college_admin),
    isSeniorRevoked: Boolean(dbUser.is_senior_revoked),
    facultyVerifiedBy: dbUser.faculty_verified_by ?? null,
    facultyVerifiedAt: dbUser.faculty_verified_at ?? null,
    collegeAdminVerifiedBy: dbUser.college_admin_verified_by ?? null,
    collegeAdminVerifiedAt: dbUser.college_admin_verified_at ?? null,
    pendingRoleRequest: dbUser.pending_role_request ?? null,
    fcmToken: dbUser.fcm_token ?? null,
    entryCount: dbUser.entry_count ?? 0,
    totalUpvotesReceived: dbUser.total_upvotes_received ?? 0,
    joinedViaCode: dbUser.joined_via_code ?? null,
    codeType: (dbUser.code_type === 'student' || dbUser.code_type === 'faculty') ? dbUser.code_type : null,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  };
}

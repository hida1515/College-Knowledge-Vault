/**
 * Profile & Analytics Service
 * College Knowledge Vault
 *
 * Provides metrics, statistics, and role-specific analytics:
 * - Upvotes computation
 * - Faculty moderation stats
 * - College analytics (College Admin)
 * - Platform metrics (Super Admin)
 * - Faculty request cancellation
 * - Contributor leaderboard & activity
 */

import { supabase } from './supabase';
import { isSenior } from '../utils/roleChecker';
import { mapDbUserToUser } from '../types/user.types';
import { DbUser } from '../types/database.types';

export interface FacultyModerationStats {
  approved: number;
  rejected: number;
  pending: number;
}

export interface CollegeStats {
  totalStudents: number;
  totalSeniors: number;
  verifiedFaculty: number;
  pendingFaculty: number;
  approvedEntries: number;
  pendingEntries: number;
}

export interface PlatformStats {
  totalColleges: number;
  totalUsers: number;
  totalEntries: number;
  pendingAdminRequests: number;
}

export interface ContributorItem {
  id: string;
  displayName: string;
  avatarUrl?: string;
  entryCount: number;
  upvoteCount: number;
}

export interface ActivityItem {
  id: string;
  type: 'entry_approved' | 'entry_submitted' | 'faculty_verified';
  title: string;
  timestamp: string;
  actorName: string;
}

/**
 * Computes the total upvote count on all approved entries authored by this user.
 */
export async function getUserUpvoteCount(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('entries')
      .select('upvote_count')
      .eq('author_id', userId)
      .eq('status', 'approved');

    if (error || !data) return 0;
    return data.reduce((acc, row) => acc + (row.upvote_count || 0), 0);
  } catch {
    return 0;
  }
}

/**
 * Retrieves moderation statistics for a verified faculty member.
 */
export async function getFacultyModerationStats(
  facultyId: string,
  collegeId: string,
): Promise<FacultyModerationStats> {
  try {
    const [approvedRes, rejectedRes, pendingRes] = await Promise.all([
      supabase
        .from('entries')
        .select('id', { count: 'exact', head: true })
        .eq('approved_by', facultyId)
        .eq('status', 'approved'),
      supabase
        .from('entries')
        .select('id', { count: 'exact', head: true })
        .eq('approved_by', facultyId)
        .eq('status', 'rejected'),
      supabase
        .from('entries')
        .select('id', { count: 'exact', head: true })
        .eq('college_id', collegeId)
        .eq('status', 'pending'),
    ]);

    return {
      approved: approvedRes.count ?? 0,
      rejected: rejectedRes.count ?? 0,
      pending: pendingRes.count ?? 0,
    };
  } catch {
    return { approved: 0, rejected: 0, pending: 0 };
  }
}

/**
 * Retrieves college-wide statistics scoped strictly to collegeId for College Admins.
 */
export async function getCollegeStats(collegeId: string): Promise<CollegeStats> {
  try {
    const [usersRes, entriesRes] = await Promise.all([
      supabase
        .from('users')
        .select('*')
        .eq('college_id', collegeId),
      supabase
        .from('entries')
        .select('status')
        .eq('college_id', collegeId),
    ]);

    const users = (usersRes.data || []).map((u) => mapDbUserToUser(u as DbUser));
    let totalStudents = 0;
    let totalSeniors = 0;
    let verifiedFaculty = 0;
    let pendingFaculty = 0;

    for (const u of users) {
      if (u.role === 'faculty') {
        if (u.isVerified) {
          verifiedFaculty++;
        } else {
          pendingFaculty++;
        }
      } else if (u.role === 'student') {
        if (isSenior(u)) {
          totalSeniors++;
        } else {
          totalStudents++;
        }
      }
    }

    let approvedEntries = 0;
    let pendingEntries = 0;
    for (const e of entriesRes.data || []) {
      if (e.status === 'approved') approvedEntries++;
      if (e.status === 'pending') pendingEntries++;
    }

    return {
      totalStudents,
      totalSeniors,
      verifiedFaculty,
      pendingFaculty,
      approvedEntries,
      pendingEntries,
    };
  } catch {
    return {
      totalStudents: 0,
      totalSeniors: 0,
      verifiedFaculty: 0,
      pendingFaculty: 0,
      approvedEntries: 0,
      pendingEntries: 0,
    };
  }
}

/**
 * Retrieves platform-wide metrics for Super Admins.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    const [collegesRes, usersRes, entriesRes, adminReqRes] = await Promise.all([
      supabase.from('colleges').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('entries').select('id', { count: 'exact', head: true }),
      supabase.from('college_admin_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    return {
      totalColleges: collegesRes.count ?? 0,
      totalUsers: usersRes.count ?? 0,
      totalEntries: entriesRes.count ?? 0,
      pendingAdminRequests: adminReqRes.count ?? 0,
    };
  } catch {
    return {
      totalColleges: 0,
      totalUsers: 0,
      totalEntries: 0,
      pendingAdminRequests: 0,
    };
  }
}

/**
 * Cancels a pending faculty request:
 * - Deletes the row from faculty_requests
 * - Resets users.role to 'student', is_verified to false, pending_role_request to null
 */
export async function cancelFacultyRequest(userId: string): Promise<void> {
  const { error: delError } = await supabase
    .from('faculty_requests')
    .delete()
    .eq('user_id', userId);

  if (delError) {
    throw new Error(`Failed to cancel request: ${delError.message}`);
  }

  const { error: userError } = await supabase
    .from('users')
    .update({
      role: 'student',
      is_verified: false,
      pending_role_request: null,
    })
    .eq('id', userId);

  if (userError) {
    throw new Error(`Failed to reset user role: ${userError.message}`);
  }
}

/**
 * Fetches top contributors for a college.
 */
export async function getTopContributors(
  collegeId: string,
  limit = 5,
): Promise<ContributorItem[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, display_name, avatar_url, entry_count, total_upvotes_received')
      .eq('college_id', collegeId)
      .order('total_upvotes_received', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((u) => ({
      id: u.id,
      displayName: u.display_name || 'Contributor',
      avatarUrl: u.avatar_url || undefined,
      entryCount: u.entry_count || 0,
      upvoteCount: u.total_upvotes_received || 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetches recent activity for a college.
 */
export async function getRecentActivity(
  collegeId: string,
  limit = 10,
): Promise<ActivityItem[]> {
  try {
    const { data, error } = await supabase
      .from('entries')
      .select(`
        id,
        title,
        status,
        created_at,
        updated_at,
        users:author_id (display_name)
      `)
      .eq('college_id', collegeId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return (data as any[]).map((row) => ({
      id: row.id,
      type: row.status === 'approved' ? 'entry_approved' : 'entry_submitted',
      title: row.title,
      timestamp: row.created_at,
      actorName: row.users?.display_name || 'Student',
    }));
  } catch {
    return [];
  }
}

export interface UpdateUserProfilePayload {
  displayName: string;
  department: string;
  program?: string | null;
  programDuration?: number | null;
  joiningYear?: number | null;
}

/**
 * Updates a user's editable profile fields and recalculates graduation year.
 */
export async function updateUserProfile(
  userId: string,
  updates: UpdateUserProfilePayload,
): Promise<any> {
  const graduationYear =
    updates.joiningYear && updates.programDuration
      ? updates.joiningYear + updates.programDuration
      : null;

  const dbPayload: Record<string, any> = {
    display_name: updates.displayName.trim(),
    department: updates.department.trim(),
    updated_at: new Date().toISOString(),
  };

  if (updates.program !== undefined) dbPayload.program = updates.program;
  if (updates.programDuration !== undefined) dbPayload.program_duration = updates.programDuration;
  if (updates.joiningYear !== undefined) {
    dbPayload.joining_year = updates.joiningYear;
    dbPayload.graduation_year = graduationYear;
  }

  const { data, error } = await supabase
    .from('users')
    .update(dbPayload)
    .eq('id', userId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update user profile.');
  }

  return mapDbUserToUser(data as DbUser);
}

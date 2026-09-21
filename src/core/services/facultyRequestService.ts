/**
 * Faculty Request & Admin Service
 * College Knowledge Vault
 *
 * Provides backend routines for faculty verification requests,
 * super admin moderation, and user permission management.
 */

import { supabase } from './supabase';
import { notifyFacultyRequestApproved } from './notificationService';
import { UserProfile, mapDbUserToUser } from '../types/user.types';
import { DbUser } from '../types/database.types';

export interface FacultyRequestItem {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  college: string;
  department: string;
  employeeId: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote: string | null;
  createdAt: string;
}

/**
 * Submits a new faculty verification request.
 */
export async function submitFacultyRequest(params: {
  userId: string;
  college: string;
  department: string;
  designation?: string;
  employeeId?: string;
  note?: string;
}): Promise<void> {
  const { userId, college, department, designation, employeeId, note } = params;

  // Insert into faculty_requests table
  const { error: reqError } = await supabase.from('faculty_requests').insert({
    user_id: userId,
    college: college.trim(),
    department: department.trim(),
    employee_id: employeeId?.trim() || null,
    review_note: (note?.trim() || '') + (designation ? ` [Designation: ${designation.trim()}]` : ''),
    status: 'pending',
  });

  if (reqError) {
    if (reqError.code === '23505' || reqError.message.includes('unique')) {
      throw new Error('Faculty verification request already submitted');
    }
    throw new Error(`Failed to submit faculty request: ${reqError.message}`);
  }

  // Update user's role to faculty (pending verification) and pending_role_request
  const { error: userError } = await supabase
    .from('users')
    .update({
      role: 'faculty',
      pending_role_request: 'faculty',
    })
    .eq('id', userId);

  if (userError) {
    throw new Error(`Failed to update user status: ${userError.message}`);
  }
}

interface FacultyRequestRow {
  id: string;
  user_id: string;
  college: string;
  department: string;
  employee_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  review_note: string | null;
  created_at: string;
  users?: {
    display_name?: string;
    email?: string;
  } | null;
}

/**
 * Fetches all pending faculty verification requests.
 * Super admin only.
 */
export async function getFacultyRequests(): Promise<FacultyRequestItem[]> {
  const { data, error } = await supabase
    .from('faculty_requests')
    .select(`
      id,
      user_id,
      college,
      department,
      employee_id,
      status,
      review_note,
      created_at,
      users:user_id (display_name, email)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch faculty requests: ${error.message}`);
  }

  const rows = (data || []) as unknown as FacultyRequestRow[];

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    userDisplayName: row.users?.display_name || 'Unknown User',
    userEmail: row.users?.email || '',
    college: row.college,
    department: row.department,
    employeeId: row.employee_id,
    status: row.status,
    reviewNote: row.review_note,
    createdAt: row.created_at,
  }));
}

/**
 * Approves a faculty verification request and grants verified Faculty access.
 */
export async function approveFacultyRequest(
  requestId: string,
  targetUserId: string,
  adminId: string,
): Promise<void> {
  const now = new Date().toISOString();

  // 1. Update request status
  const { error: reqError } = await supabase
    .from('faculty_requests')
    .update({
      status: 'approved',
      reviewed_by: adminId,
      reviewed_at: now,
    })
    .eq('id', requestId);

  if (reqError) {
    throw new Error(`Failed to update request: ${reqError.message}`);
  }

  // 2. Update user profile to verified faculty
  const { error: userError } = await supabase
    .from('users')
    .update({
      role: 'faculty',
      is_verified: true,
      faculty_verified_by: adminId,
      faculty_verified_at: now,
      pending_role_request: null,
    })
    .eq('id', targetUserId);

  if (userError) {
    throw new Error(`Failed to update user profile: ${userError.message}`);
  }

  // 3. Notify applicant via push notification
  supabase
    .from('faculty_requests')
    .select('college')
    .eq('id', requestId)
    .single()
    .then(({ data: reqData }) => {
      notifyFacultyRequestApproved(targetUserId, reqData?.college || 'your institution').catch((e) => {
        console.warn('Failed to send faculty approval notification:', e);
      });
    });
}

/**
 * Rejects a faculty verification request.
 */
export async function rejectFacultyRequest(
  requestId: string,
  targetUserId: string,
  adminId: string,
  note: string,
): Promise<void> {
  const now = new Date().toISOString();

  // 1. Update request status
  const { error: reqError } = await supabase
    .from('faculty_requests')
    .update({
      status: 'rejected',
      reviewed_by: adminId,
      reviewed_at: now,
      review_note: note.trim(),
    })
    .eq('id', requestId);

  if (reqError) {
    throw new Error(`Failed to reject request: ${reqError.message}`);
  }

  // 2. Clear pending_role_request on user
  const { error: userError } = await supabase
    .from('users')
    .update({
      pending_role_request: null,
    })
    .eq('id', targetUserId);

  if (userError) {
    throw new Error(`Failed to update user profile: ${userError.message}`);
  }
}

/**
 * Revokes verified Faculty status for a user.
 */
export async function revokeFacultyVerification(
  targetUserId: string,
  _adminId: string,
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      is_verified: false,
      faculty_verified_by: null,
      faculty_verified_at: null,
    })
    .eq('id', targetUserId);

  if (error) {
    throw new Error(`Failed to revoke faculty verification: ${error.message}`);
  }
}

/**
 * Revokes Senior status for a user (prevents entry submissions).
 */
export async function revokeSeniorAccess(
  targetUserId: string,
  _adminId: string,
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_senior_revoked: true })
    .eq('id', targetUserId);

  if (error) {
    throw new Error(`Failed to revoke senior access: ${error.message}`);
  }
}

/**
 * Restores Senior status for a user.
 */
export async function restoreSeniorAccess(
  targetUserId: string,
  _adminId: string,
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_senior_revoked: false })
    .eq('id', targetUserId);

  if (error) {
    throw new Error(`Failed to restore senior access: ${error.message}`);
  }
}

/**
 * Promotes a user to Super Admin.
 */
export async function promoteToSuperAdmin(
  targetUserId: string,
  _adminId: string,
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_super_admin: true })
    .eq('id', targetUserId);

  if (error) {
    throw new Error(`Failed to promote user to super admin: ${error.message}`);
  }
}

/**
 * Fetches all users for Super Admin management.
 */
export async function getAllUsersForAdmin(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  return (data || []).map((row: DbUser) => {
    const baseUser = mapDbUserToUser(row);
    return {
      ...baseUser,
      totalEntries: baseUser.entryCount,
      totalUpvotes: baseUser.totalUpvotesReceived,
      totalViews: 0,
    };
  });
}

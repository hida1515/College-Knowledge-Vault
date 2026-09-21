/**
 * College & Governance Service
 * College Knowledge Vault
 *
 * Provides multi-tenant college search, creation, and College Admin governance APIs.
 */

import { supabase } from './supabase';
import { College, CollegeAdminRequest, UserProfile, mapDbUserToUser } from '../types/user.types';
import { DbUser } from '../types/database.types';

export type { College, CollegeAdminRequest };

interface CollegeAdminRequestRow {
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
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  users?: {
    display_name?: string;
    email?: string;
  } | null;
}

/**
 * Fetches all active colleges ordered by name.
 */
export async function getColleges(): Promise<College[]> {
  const { data, error } = await supabase
    .from('colleges')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch colleges: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    state: row.state,
    country: row.country,
    isActive: row.is_active,
    studentInviteCode: row.student_invite_code ?? null,
    facultyInviteCode: row.faculty_invite_code ?? null,
    adminInviteCode: row.admin_invite_code ?? null,
    codesGeneratedAt: row.codes_generated_at ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }));
}

/**
 * Searches active colleges by name.
 */
export async function searchColleges(query: string): Promise<College[]> {
  if (!query.trim()) {
    return getColleges();
  }

  const { data, error } = await supabase
    .from('colleges')
    .select('*')
    .eq('is_active', true)
    .ilike('name', `%${query.trim()}%`)
    .order('name', { ascending: true })
    .limit(20);

  if (error) {
    throw new Error(`Failed to search colleges: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    state: row.state,
    country: row.country,
    isActive: row.is_active,
    studentInviteCode: row.student_invite_code ?? null,
    facultyInviteCode: row.faculty_invite_code ?? null,
    adminInviteCode: row.admin_invite_code ?? null,
    codesGeneratedAt: row.codes_generated_at ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }));
}

/**
 * Creates a new college record.
 */
export async function createCollege(params: {
  name: string;
  city: string;
  state: string;
  createdBy?: string;
}): Promise<College> {
  const { name, city, state, createdBy } = params;

  const { data, error } = await supabase
    .from('colleges')
    .insert({
      name: name.trim(),
      city: city.trim(),
      state: state.trim(),
      created_by: createdBy || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create college: ${error.message}`);
  }

  return {
    id: data.id,
    name: data.name,
    city: data.city,
    state: data.state,
    country: data.country,
    isActive: data.is_active,
    studentInviteCode: data.student_invite_code ?? null,
    facultyInviteCode: data.faculty_invite_code ?? null,
    adminInviteCode: data.admin_invite_code ?? null,
    codesGeneratedAt: data.codes_generated_at ?? null,
    createdBy: data.created_by,
    createdAt: data.created_at,
  };
}

/**
 * Submits a request to become a College Admin.
 */
export async function submitCollegeAdminRequest(params: {
  userId: string;
  collegeId: string | null;
  collegeName: string;
  collegeCity: string;
  collegeState: string;
  designation: string;
  employeeId?: string;
  reason: string;
}): Promise<void> {
  const {
    userId,
    collegeId,
    collegeName,
    collegeCity,
    collegeState,
    designation,
    employeeId,
    reason,
  } = params;

  const { error: reqError } = await supabase
    .from('college_admin_requests')
    .insert({
      user_id: userId,
      college_id: collegeId ?? null,
      college_name: (collegeName || '').trim(),
      college_city: (collegeCity || '').trim(),
      college_state: (collegeState || '').trim(),
      designation: (designation || '').trim(),
      employee_id: employeeId ? employeeId.trim() : null,
      reason: (reason || '').trim(),
      status: 'pending',
    });

  if (reqError) {
    if (reqError.code === '23505' || reqError.message.includes('unique')) {
      throw new Error('College Admin request already submitted');
    }
    throw new Error(`Failed to submit College Admin request: ${reqError.message}`);
  }

  // Set pending_role_request on user profile
  await supabase
    .from('users')
    .update({ pending_role_request: 'college_admin' })
    .eq('id', userId);
}

/**
 * Fetches all pending College Admin requests (Super Admin only).
 */
export async function getCollegeAdminRequests(): Promise<CollegeAdminRequest[]> {
  const { data, error } = await supabase
    .from('college_admin_requests')
    .select(`
      id,
      user_id,
      college_id,
      college_name,
      college_city,
      college_state,
      designation,
      employee_id,
      reason,
      status,
      review_note,
      created_at,
      reviewed_at,
      users:user_id (display_name, email)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    // Robust fallback: query plain columns if relational join failed
    const { data: plainData, error: plainError } = await supabase
      .from('college_admin_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (plainError) {
      throw new Error(`Failed to fetch College Admin requests: ${plainError.message}`);
    }

    const userIds = Array.from(new Set((plainData || []).map((r) => r.user_id)));
    const userMap: Record<string, { display_name?: string; email?: string }> = {};

    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, display_name, email')
        .in('id', userIds);

      for (const u of usersData || []) {
        userMap[u.id] = { display_name: u.display_name, email: u.email };
      }
    }

    return (plainData || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      userDisplayName: userMap[row.user_id]?.display_name || 'Unknown User',
      userEmail: userMap[row.user_id]?.email || '',
      collegeId: row.college_id,
      collegeName: row.college_name,
      collegeCity: row.college_city,
      collegeState: row.college_state,
      designation: row.designation,
      employeeId: row.employee_id,
      reason: row.reason,
      status: row.status,
      reviewedBy: null,
      reviewNote: row.review_note,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
    }));
  }

  const rows = (data || []) as unknown as CollegeAdminRequestRow[];

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    userDisplayName: row.users?.display_name || 'Unknown User',
    userEmail: row.users?.email || '',
    collegeId: row.college_id,
    collegeName: row.college_name,
    collegeCity: row.college_city,
    collegeState: row.college_state,
    designation: row.designation,
    employeeId: row.employee_id,
    reason: row.reason,
    status: row.status,
    reviewedBy: null,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  }));
}

/**
 * Approves a College Admin request.
 * Creates the college if it was requested as a new college.
 */
export async function approveCollegeAdminRequest(
  request: CollegeAdminRequest,
  adminId: string,
): Promise<void> {
  const now = new Date().toISOString();
  let targetCollegeId = request.collegeId;

  // 1. If no collegeId exists, create the new college
  if (!targetCollegeId) {
    const newCollege = await createCollege({
      name: request.collegeName,
      city: request.collegeCity,
      state: request.collegeState,
      createdBy: adminId,
    });
    targetCollegeId = newCollege.id;
  }

  // 2. Update request status
  const { error: reqError } = await supabase
    .from('college_admin_requests')
    .update({
      college_id: targetCollegeId,
      status: 'approved',
      reviewed_by: adminId,
      reviewed_at: now,
    })
    .eq('id', request.id);

  if (reqError) {
    throw new Error(`Failed to update request: ${reqError.message}`);
  }

  // 3. Update user as College Admin for this college
  const { error: userError } = await supabase
    .from('users')
    .update({
      college: request.collegeName,
      college_id: targetCollegeId,
      is_college_admin: true,
      college_admin_verified_by: adminId,
      college_admin_verified_at: now,
      pending_role_request: null,
    })
    .eq('id', request.userId);

  if (userError) {
    throw new Error(`Failed to update user profile: ${userError.message}`);
  }
}

/**
 * Rejects a College Admin request.
 */
export async function rejectCollegeAdminRequest(
  requestId: string,
  targetUserId: string,
  adminId: string,
  note: string,
): Promise<void> {
  const now = new Date().toISOString();

  const { error: reqError } = await supabase
    .from('college_admin_requests')
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

  await supabase
    .from('users')
    .update({ pending_role_request: null })
    .eq('id', targetUserId);
}

/**
 * Fetches all users from a specific college (College Admin only).
 */
export async function getCollegeUsers(collegeId: string): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('college_id', collegeId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch college users: ${error.message}`);
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

/**
 * Fetches all colleges including inactive ones (Super Admin only).
 */
export async function getAllCollegesForAdmin(): Promise<College[]> {
  const { data, error } = await supabase
    .from('colleges')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch colleges: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    state: row.state,
    country: row.country,
    isActive: row.is_active,
    studentInviteCode: row.student_invite_code ?? null,
    facultyInviteCode: row.faculty_invite_code ?? null,
    adminInviteCode: row.admin_invite_code ?? null,
    codesGeneratedAt: row.codes_generated_at ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }));
}

/**
 * Toggles the active status of a college.
 */
export async function toggleCollegeActiveStatus(
  collegeId: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('colleges')
    .update({ is_active: isActive })
    .eq('id', collegeId);

  if (error) {
    throw new Error(`Failed to update college status: ${error.message}`);
  }
}

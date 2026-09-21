/**
 * Invite Code Service
 * College Knowledge Vault
 *
 * Provides validation, generation, and persistence for college invite codes.
 * Ensures verified multi-tenant college joining.
 */

import { supabase } from './supabase';
import { College } from '../types/user.types';

export type InviteCodeType = 'student' | 'faculty';

export interface ValidateInviteCodeResult {
  isValid: boolean;
  college: College | null;
  codeType: InviteCodeType | null;
  errorMessage: string | null;
}

export interface GeneratedCodes {
  studentCode: string;
  facultyCode: string;
  adminCode?: string;
}

/**
 * Helper to generate a single invite code based on college name, ID, and code type.
 * Format: {4_LETTERS_FROM_NAME}{2_FROM_UUID}-{YEAR|FAC}-{RANDOM4}
 */
export function generateCode(
  collegeName: string,
  collegeId: string,
  type: 'student' | 'faculty',
): string {
  let nameLetters = (collegeName || '')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 4)
    .toUpperCase();
  if (nameLetters.length < 4) {
    nameLetters = (nameLetters + 'COLL').slice(0, 4);
  }

  let uuidChars = (collegeId || '')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase();
  if (uuidChars.length < 2) {
    uuidChars = '01';
  }

  const prefix = `${nameLetters}${uuidChars}`;
  const year = new Date().getFullYear().toString();
  const random = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()
    .padEnd(4, 'X');

  if (type === 'faculty') {
    return `${prefix}-FAC-${random}`;
  }
  return `${prefix}-${year}-${random}`;
}

/**
 * Validates an entered invite code case-insensitively.
 * Finds the corresponding college and returns its code type ('student' | 'faculty' | 'college_admin').
 */
export async function validateInviteCode(code: string): Promise<ValidateInviteCodeResult> {
  const cleanCode = (code || '').trim().toUpperCase();

  if (!cleanCode) {
    return {
      isValid: false,
      college: null,
      codeType: null,
      errorMessage: 'Please enter an invite code.',
    };
  }

  try {
    // Query colleges table checking student and faculty invite code columns
    const { data, error } = await supabase
      .from('colleges')
      .select('*')
      .or(
        `student_invite_code.ilike.${cleanCode},faculty_invite_code.ilike.${cleanCode}`,
      )
      .limit(1);

    if (error) {
      return {
        isValid: false,
        college: null,
        codeType: null,
        errorMessage: 'Database error while verifying invite code.',
      };
    }

    if (!data || data.length === 0) {
      return {
        isValid: false,
        college: null,
        codeType: null,
        errorMessage: 'Invalid invite code. Please check with your College Admin.',
      };
    }

    const row = data[0];

    // Check if college is active
    if (!row.is_active) {
      return {
        isValid: false,
        college: null,
        codeType: null,
        errorMessage: 'This college is not active on the platform.',
      };
    }

    const college: College = {
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
    };

    let codeType: InviteCodeType = 'student';
    if (row.faculty_invite_code && row.faculty_invite_code.toUpperCase() === cleanCode) {
      codeType = 'faculty';
    }

    return {
      isValid: true,
      college,
      codeType,
      errorMessage: null,
    };
  } catch (err: any) {
    return {
      isValid: false,
      college: null,
      codeType: null,
      errorMessage: err?.message || 'Failed to validate invite code.',
    };
  }
}

/**
 * Generates fresh unique invite codes for a college and persists them in the database.
 * Supports updating all codes or an individual code ('student' | 'faculty').
 */
export async function generateNewCodes(
  collegeId: string,
  targetType: 'all' | 'student' | 'faculty' = 'all',
): Promise<GeneratedCodes> {
  const { data: college, error: fetchError } = await supabase
    .from('colleges')
    .select('*')
    .eq('id', collegeId)
    .single();

  if (fetchError || !college) {
    throw new Error(`College not found: ${fetchError?.message || collegeId}`);
  }

  let studentCode = college.student_invite_code;
  let facultyCode = college.faculty_invite_code;

  const updatePayload: Record<string, any> = {
    codes_generated_at: new Date().toISOString(),
  };

  if (targetType === 'all' || targetType === 'student') {
    studentCode = generateCode(college.name, college.id, 'student');
    updatePayload.student_invite_code = studentCode;
  }

  if (targetType === 'all' || targetType === 'faculty') {
    facultyCode = generateCode(college.name, college.id, 'faculty');
    updatePayload.faculty_invite_code = facultyCode;
  }

  const { error: updateError } = await supabase
    .from('colleges')
    .update(updatePayload)
    .eq('id', collegeId);

  if (updateError) {
    throw new Error(`Failed to update invite codes: ${updateError.message}`);
  }

  return {
    studentCode,
    facultyCode,
  };
}

/**
 * Records the invite code and code type on the user profile upon successful verification.
 */
export async function recordUserCode(
  userId: string,
  code: string,
  codeType: InviteCodeType,
): Promise<void> {
  const cleanCode = (code || '').trim().toUpperCase();

  const { data, error } = await supabase
    .from('users')
    .update({
      joined_via_code: cleanCode,
      code_type: codeType,
    })
    .eq('id', userId)
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to record invite code: ${error?.message || 'User not found'}`);
  }
}

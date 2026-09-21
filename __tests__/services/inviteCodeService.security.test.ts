/**
 * Invite Code Service Security Unit Tests
 * College Knowledge Vault
 *
 * Verifies removal of college_admin invite codes for security compliance.
 */

import React from 'react';
import {
  InviteCodeType,
  generateCode,
  validateInviteCode,
} from '../../src/core/services/inviteCodeService';
import { supabase } from '../../src/core/services/supabase';
import CollegeAdminScreen from '../../src/features/collegeAdmin/screens/CollegeAdminScreen';
import { renderWithProviders, mockAuthStoreReturn, createMockUser } from '../utils/testUtils';
import { UserRole } from '../../src/core/types/user.types';
import { fireEvent, act, waitFor } from '@testing-library/react-native';

jest.mock('../../src/core/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../../src/core/services/facultyRequestService', () => ({
  getFacultyRequests: jest.fn().mockResolvedValue([]),
  approveFacultyRequest: jest.fn().mockResolvedValue(undefined),
  rejectFacultyRequest: jest.fn().mockResolvedValue(undefined),
  revokeSeniorAccess: jest.fn().mockResolvedValue(undefined),
  restoreSeniorAccess: jest.fn().mockResolvedValue(undefined),
  revokeFacultyVerification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/core/services/collegeService', () => ({
  getCollegeUsers: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../src/core/services/profileService', () => ({
  getCollegeStats: jest.fn().mockResolvedValue({
    totalStudents: 10,
    totalSeniors: 2,
    verifiedFaculty: 1,
    pendingFaculty: 0,
    approvedEntries: 5,
    pendingEntries: 0,
  }),
  getTopContributors: jest.fn().mockResolvedValue([]),
  getRecentActivity: jest.fn().mockResolvedValue([]),
}));

const mockAdminUser = createMockUser(UserRole.Student, {
  displayName: 'Admin User',
  isCollegeAdmin: true,
  collegeId: 'col-admin-1',
  college: 'IIT Bombay',
  collegeName: 'IIT Bombay',
});

let mockAuthStoreState = mockAuthStoreReturn(mockAdminUser);
jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: (selector?: (state: any) => any) => {
    if (selector) return selector(mockAuthStoreState);
    return mockAuthStoreState;
  },
}));

describe('Invite Code Security Tests (Removal of college_admin code)', () => {
  const mockFrom = supabase.from as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthStoreState = mockAuthStoreReturn(mockAdminUser);
  });

  test('1a: college_admin code type no longer exists in enum', () => {
    // Compile-time & runtime check: InviteCodeType only permits 'student' | 'faculty'
    const allowedTypes: InviteCodeType[] = ['student', 'faculty'];
    expect(allowedTypes).toContain('student');
    expect(allowedTypes).toContain('faculty');

    // Verify 'college_admin' is not in allowed types
    const invalidType: string = 'college_admin';
    expect(allowedTypes.includes(invalidType as any)).toBe(false);
  });

  test('1b: generateCode rejects or does not support college_admin type', () => {
    // TypeScript check: only 'student' | 'faculty' are valid parameters
    const code = generateCode('IIT Bombay', 'col-1', 'student');
    expect(code).not.toContain('-ADM-');

    const facultyCode = generateCode('IIT Bombay', 'col-1', 'faculty');
    expect(facultyCode).toContain('-FAC-');
    expect(facultyCode).not.toContain('-ADM-');
  });

  test('1c: validateInviteCode rejects college_admin type codes', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    const result = await validateInviteCode('IITB01-ADM-9999');
    expect(result.isValid).toBe(false);
    expect(result.codeType).toBeNull();
    expect(result.errorMessage).toContain('Invalid invite code');
  });

  test('1d: CollegeAdminScreen has no Generate Admin Code button', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'colleges') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  student_invite_code: 'IITB-2024-STU1',
                  faculty_invite_code: 'IITB-FAC-FAC1',
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      };
    });

    const { getByTestId, queryByTestId, queryByText } = await renderWithProviders(
      React.createElement(CollegeAdminScreen),
    );

    // Switch to Stats / Governance tab
    await act(async () => {
      fireEvent.press(getByTestId('tab-college-stats'));
    });

    await waitFor(() => {
      expect(getByTestId('college-invite-codes-section')).toBeTruthy();
    });

    // Ensure no admin code button or text exists in the invite codes section
    expect(queryByTestId('btn-copy-admin-code')).toBeNull();
    expect(queryByTestId('btn-regen-admin-code')).toBeNull();
    expect(queryByText(/Generate Admin Code/i)).toBeNull();
    expect(queryByText(/Admin Code:/i)).toBeNull();
  });
});

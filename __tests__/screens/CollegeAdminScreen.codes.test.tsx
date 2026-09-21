/**
 * CollegeAdminScreen Invite Codes Unit Tests
 * College Knowledge Vault
 */

import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CollegeAdminScreen from '../../src/features/collegeAdmin/screens/CollegeAdminScreen';
import { renderWithProviders, mockAuthStoreReturn, createMockUser } from '../utils/testUtils';
import { UserRole } from '../../src/core/types/user.types';
import * as inviteCodeService from '../../src/core/services/inviteCodeService';

// Mock Clipboard
const mockSetString = jest.fn();
jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: (...args: any[]) => mockSetString(...args),
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
  useAuthStore: (...args: unknown[]) => {
    const selector = args[0] as ((mockState: unknown) => unknown) | undefined;
    if (typeof selector === 'function') {
      return selector(mockAuthStoreState);
    }
    return mockAuthStoreState;
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
    totalStudents: 100,
    totalSeniors: 20,
    verifiedFaculty: 10,
    pendingFaculty: 0,
    approvedEntries: 50,
    pendingEntries: 2,
  }),
  getTopContributors: jest.fn().mockResolvedValue([]),
  getRecentActivity: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../src/core/services/inviteCodeService');

const mockSupabaseFrom = jest.fn();
jest.mock('../../src/core/services/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  },
}));

describe('CollegeAdminScreen — Invite Codes Management', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthStoreState = mockAuthStoreReturn(mockAdminUser);
    alertSpy = jest.spyOn(Alert, 'alert');

    mockSupabaseFrom.mockImplementation((table: string) => {
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
            data: [{ type: 'project' }],
            error: null,
          }),
        }),
      };
    });

    (inviteCodeService.generateNewCodes as jest.Mock).mockResolvedValue({
      studentCode: 'IITB-2024-NEW1',
      facultyCode: 'IITB-FAC-NEW2',
    });
  });

  describe('TEST GROUP 1: Code Display & Actions in Stats Tab', () => {
    test('1a: college admin sees student and faculty invite codes', async () => {
      const { getByTestId } = await renderWithProviders(<CollegeAdminScreen />);

      // Switch to Stats / Governance tab
      await act(async () => {
        fireEvent.press(getByTestId('tab-college-stats'));
      });

      await waitFor(() => {
        expect(getByTestId('college-invite-codes-section')).toBeTruthy();
        expect(getByTestId('text-college-student-code')).toBeTruthy();
        expect(getByTestId('text-college-faculty-code')).toBeTruthy();
      });

      expect(getByTestId('text-college-student-code').props.children).toBe('IITB-2024-STU1');
      expect(getByTestId('text-college-faculty-code').props.children).toBe('IITB-FAC-FAC1');
    });

    test('1b: copy button copies student code to clipboard', async () => {
      const { getByTestId } = await renderWithProviders(<CollegeAdminScreen />);

      await act(async () => {
        fireEvent.press(getByTestId('tab-college-stats'));
      });

      await waitFor(() => {
        expect(getByTestId('btn-copy-student-code')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-copy-student-code'));
      });

      expect(mockSetString).toHaveBeenCalledWith('IITB-2024-STU1');
      expect(alertSpy).toHaveBeenCalledWith(
        'Copied',
        expect.stringContaining('IITB-2024-STU1'),
      );
    });

    test('1c: copy button copies faculty code to clipboard', async () => {
      const { getByTestId } = await renderWithProviders(<CollegeAdminScreen />);

      await act(async () => {
        fireEvent.press(getByTestId('tab-college-stats'));
      });

      await waitFor(() => {
        expect(getByTestId('btn-copy-faculty-code')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-copy-faculty-code'));
      });

      expect(mockSetString).toHaveBeenCalledWith('IITB-FAC-FAC1');
      expect(alertSpy).toHaveBeenCalledWith(
        'Copied',
        expect.stringContaining('IITB-FAC-FAC1'),
      );
    });

    test('1d: clicking regenerate student code shows confirmation and regenerates', async () => {
      const { getByTestId } = await renderWithProviders(<CollegeAdminScreen />);

      await act(async () => {
        fireEvent.press(getByTestId('tab-college-stats'));
      });

      await waitFor(() => {
        expect(getByTestId('btn-regen-student-code')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-regen-student-code'));
      });

      expect(alertSpy).toHaveBeenCalledWith(
        'Regenerate Student Code',
        expect.stringContaining('Students with old code can still join'),
        expect.any(Array),
      );

      // Confirm
      const alertButtons = alertSpy.mock.calls[alertSpy.mock.calls.length - 1][2];
      const confirmButton = alertButtons.find((btn: any) => btn.text === 'Confirm Regenerate');

      await act(async () => {
        await confirmButton.onPress();
      });

      expect(inviteCodeService.generateNewCodes).toHaveBeenCalledWith('col-admin-1', 'student');
      expect(alertSpy).toHaveBeenCalledWith(
        'Success',
        expect.stringContaining('IITB-2024-NEW1'),
      );
    });

    test('1e: clicking regenerate faculty code shows confirmation and regenerates', async () => {
      const { getByTestId } = await renderWithProviders(<CollegeAdminScreen />);

      await act(async () => {
        fireEvent.press(getByTestId('tab-college-stats'));
      });

      await waitFor(() => {
        expect(getByTestId('btn-regen-faculty-code')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-regen-faculty-code'));
      });

      expect(alertSpy).toHaveBeenCalledWith(
        'Regenerate Faculty Code',
        expect.stringContaining('Students with old code can still join'),
        expect.any(Array),
      );

      const alertButtons = alertSpy.mock.calls[alertSpy.mock.calls.length - 1][2];
      const confirmButton = alertButtons.find((btn: any) => btn.text === 'Confirm Regenerate');

      await act(async () => {
        await confirmButton.onPress();
      });

      expect(inviteCodeService.generateNewCodes).toHaveBeenCalledWith('col-admin-1', 'faculty');
      expect(alertSpy).toHaveBeenCalledWith(
        'Success',
        expect.stringContaining('IITB-FAC-NEW2'),
      );
    });
  });
});

/**
 * SuperAdminScreen Invite Codes Unit Tests
 * College Knowledge Vault
 */

import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SuperAdminScreen from '../../src/features/superAdmin/screens/SuperAdminScreen';
import { renderWithProviders, mockAuthStoreReturn, createMockUser } from '../utils/testUtils';
import { UserRole } from '../../src/core/types/user.types';
import * as collegeService from '../../src/core/services/collegeService';
import * as profileService from '../../src/core/services/profileService';
import * as inviteCodeService from '../../src/core/services/inviteCodeService';

// Mock Clipboard
const mockSetString = jest.fn();
jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: (...args: any[]) => mockSetString(...args),
}));

const mockSuperAdminUser = createMockUser(UserRole.Student, {
  displayName: 'Root Administrator',
  isSuperAdmin: true,
});

let mockAuthStoreState = mockAuthStoreReturn(mockSuperAdminUser);

jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: (...args: unknown[]) => {
    const selector = args[0] as ((mockState: unknown) => unknown) | undefined;
    if (typeof selector === 'function') {
      return selector(mockAuthStoreState);
    }
    return mockAuthStoreState;
  },
}));

jest.mock('../../src/core/services/collegeService');
jest.mock('../../src/core/services/profileService');
jest.mock('../../src/core/services/inviteCodeService');

const mockSupabaseFrom = jest.fn();
jest.mock('../../src/core/services/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  },
}));

describe('SuperAdminScreen — Invite Codes Management', () => {
  let alertSpy: jest.SpyInstance;

  const mockCollegeWithCodes = {
    id: 'col-codes-1',
    name: 'Tech University',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    isActive: true,
    studentInviteCode: 'TECH12-2024-ABCD',
    facultyInviteCode: 'TECH12-FAC-EFGH',
    adminInviteCode: 'TECH12-ADM-IJKL',
  };

  const mockCollegeWithoutCodes = {
    id: 'col-nocodes-2',
    name: 'Old College',
    city: 'Mysore',
    state: 'Karnataka',
    country: 'India',
    isActive: true,
    studentInviteCode: null,
    facultyInviteCode: null,
    adminInviteCode: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthStoreState = mockAuthStoreReturn(mockSuperAdminUser);
    alertSpy = jest.spyOn(Alert, 'alert');

    (collegeService.getCollegeAdminRequests as jest.Mock).mockResolvedValue([]);
    (collegeService.getAllCollegesForAdmin as jest.Mock).mockResolvedValue([
      mockCollegeWithCodes,
      mockCollegeWithoutCodes,
    ]);
    (profileService.getPlatformStats as jest.Mock).mockResolvedValue({
      totalColleges: 2,
      totalUsers: 100,
      totalEntries: 200,
      pendingAdminRequests: 0,
    });

    mockSupabaseFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    }));

    (inviteCodeService.generateNewCodes as jest.Mock).mockResolvedValue({
      studentCode: 'TECH12-2024-NEW1',
      facultyCode: 'TECH12-FAC-NEW2',
      adminCode: 'TECH12-ADM-NEW3',
    });
  });

  describe('TEST GROUP 1: Code Display & Copying', () => {
    test('1a: renders student, faculty, and admin invite codes', async () => {
      const { getByTestId } = await renderWithProviders(<SuperAdminScreen />);

      // Switch to Colleges tab (tab-colleges)
      await act(async () => {
        fireEvent.press(getByTestId('tab-colleges'));
      });

      await waitFor(() => {
        expect(getByTestId('student-code-col-codes-1')).toBeTruthy();
        expect(getByTestId('faculty-code-col-codes-1')).toBeTruthy();
        expect(getByTestId('admin-code-col-codes-1')).toBeTruthy();
      });

      expect(getByTestId('student-code-col-codes-1').props.children).toBe('TECH12-2024-ABCD');
      expect(getByTestId('faculty-code-col-codes-1').props.children).toBe('TECH12-FAC-EFGH');
      expect(getByTestId('admin-code-col-codes-1').props.children).toBe('TECH12-ADM-IJKL');
    });

    test('1b: displays Not Generated when codes are missing', async () => {
      const { getByTestId } = await renderWithProviders(<SuperAdminScreen />);

      await act(async () => {
        fireEvent.press(getByTestId('tab-colleges'));
      });

      await waitFor(() => {
        expect(getByTestId('student-code-col-nocodes-2')).toBeTruthy();
      });

      expect(getByTestId('student-code-col-nocodes-2').props.children).toBe('Not Generated');
      expect(getByTestId('faculty-code-col-nocodes-2').props.children).toBe('Not Generated');
      expect(getByTestId('admin-code-col-nocodes-2').props.children).toBe('Not Generated');
    });

    test('1c: copy button copies code to clipboard and alerts', async () => {
      const { getByTestId } = await renderWithProviders(<SuperAdminScreen />);

      await act(async () => {
        fireEvent.press(getByTestId('tab-colleges'));
      });

      await waitFor(() => {
        expect(getByTestId('btn-copy-student-col-codes-1')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-copy-student-col-codes-1'));
      });

      expect(mockSetString).toHaveBeenCalledWith('TECH12-2024-ABCD');
      expect(alertSpy).toHaveBeenCalledWith(
        'Copied',
        expect.stringContaining('TECH12-2024-ABCD'),
      );
    });
  });

  describe('TEST GROUP 2: Code Regeneration', () => {
    test('2a: clicking regenerate student code shows confirmation alert', async () => {
      const { getByTestId } = await renderWithProviders(<SuperAdminScreen />);

      await act(async () => {
        fireEvent.press(getByTestId('tab-colleges'));
      });

      await waitFor(() => {
        expect(getByTestId('btn-regen-student-col-codes-1')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-regen-student-col-codes-1'));
      });

      expect(alertSpy).toHaveBeenCalledWith(
        'Regenerate Invite Codes',
        expect.stringContaining('Regenerating codes will invalidate'),
        expect.any(Array),
      );
    });

    test('2b: confirming regeneration calls generateNewCodes for target type', async () => {
      const { getByTestId } = await renderWithProviders(<SuperAdminScreen />);

      await act(async () => {
        fireEvent.press(getByTestId('tab-colleges'));
      });

      await waitFor(() => {
        expect(getByTestId('btn-regen-faculty-col-codes-1')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-regen-faculty-col-codes-1'));
      });

      // Find the confirm button callback in alert args
      const alertButtons = alertSpy.mock.calls[alertSpy.mock.calls.length - 1][2];
      const confirmButton = alertButtons.find((btn: any) => btn.text === 'Confirm');

      await act(async () => {
        await confirmButton.onPress();
      });

      expect(inviteCodeService.generateNewCodes).toHaveBeenCalledWith('col-codes-1', 'faculty');
      expect(alertSpy).toHaveBeenCalledWith(
        'Codes Regenerated',
        expect.stringContaining('Tech University'),
      );
    });

    test('2c: regenerate all button calls generateNewCodes with all', async () => {
      const { getByTestId } = await renderWithProviders(<SuperAdminScreen />);

      await act(async () => {
        fireEvent.press(getByTestId('tab-colleges'));
      });

      await waitFor(() => {
        expect(getByTestId('btn-regen-all-col-codes-1')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-regen-all-col-codes-1'));
      });

      const alertButtons = alertSpy.mock.calls[alertSpy.mock.calls.length - 1][2];
      const confirmButton = alertButtons.find((btn: any) => btn.text === 'Confirm');

      await act(async () => {
        await confirmButton.onPress();
      });

      expect(inviteCodeService.generateNewCodes).toHaveBeenCalledWith('col-codes-1', 'all');
    });
  });
});

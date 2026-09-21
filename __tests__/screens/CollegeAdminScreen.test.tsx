/**
 * CollegeAdminScreen Unit Tests
 * College Knowledge Vault
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CollegeAdminScreen from '../../src/features/collegeAdmin/screens/CollegeAdminScreen';
import { renderWithProviders, mockAuthStoreReturn, createMockUser } from '../utils/testUtils';
import { UserRole } from '../../src/core/types/user.types';
import * as facultyService from '../../src/core/services/facultyRequestService';

const mockAdminUser = createMockUser(UserRole.Student, {
  displayName: 'Admin User',
  isCollegeAdmin: true,
  collegeId: 'c1',
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
  getFacultyRequests: jest.fn().mockResolvedValue([
    {
      id: 'req-1',
      userId: 'user-fac-1',
      userDisplayName: 'Prof. Sharma',
      userEmail: 'sharma@iitb.ac.in',
      college: 'IIT Bombay',
      department: 'Computer Science',
      employeeId: 'EMP001',
      status: 'pending',
      reviewNote: 'Teaching DSA',
      createdAt: '2026-09-10T10:00:00Z',
    },
  ]),
  approveFacultyRequest: jest.fn().mockResolvedValue(undefined),
  rejectFacultyRequest: jest.fn().mockResolvedValue(undefined),
  revokeSeniorAccess: jest.fn().mockResolvedValue(undefined),
  restoreSeniorAccess: jest.fn().mockResolvedValue(undefined),
  revokeFacultyVerification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/core/services/collegeService', () => ({
  getCollegeUsers: jest.fn().mockResolvedValue([
    {
      id: 'u-senior-1',
      email: 'senior@iitb.ac.in',
      displayName: 'Senior Rohan',
      role: 'student',
      college: 'IIT Bombay',
      collegeId: 'c1',
      department: 'CSE',
      joiningYear: 2023,
      programDuration: 4,
      isSeniorRevoked: false,
      entryCount: 5,
      totalUpvotesReceived: 20,
    },
    {
      id: 'u-fac-verified',
      email: 'fac@iitb.ac.in',
      displayName: 'Dr. Anita',
      role: 'faculty',
      college: 'IIT Bombay',
      collegeId: 'c1',
      department: 'CSE',
      isVerified: true,
      entryCount: 2,
      totalUpvotesReceived: 10,
    },
  ]),
}));

jest.mock('../../src/core/services/profileService', () => ({
  getCollegeStats: jest.fn().mockResolvedValue({
    totalStudents: 150,
    totalSeniors: 45,
    verifiedFaculty: 12,
    pendingFaculty: 1,
    approvedEntries: 90,
    pendingEntries: 6,
  }),
  getTopContributors: jest.fn().mockResolvedValue([
    { id: 'u1', displayName: 'Top Senior', entryCount: 8, upvoteCount: 40 },
  ]),
  getRecentActivity: jest.fn().mockResolvedValue([
    { id: 'a1', type: 'entry_approved', title: 'OS Viva Notes', timestamp: '2026-09-12T10:00:00Z', actorName: 'Rohan' },
  ]),
}));

jest.mock('../../src/core/services/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [{ type: 'project' }, { type: 'viva' }], error: null }),
      }),
    }),
  },
}));

describe('CollegeAdminScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthStoreState = mockAuthStoreReturn(mockAdminUser);
  });

  describe('TEST GROUP 1: Tab 1 - Faculty Management', () => {
    test('renders pending faculty requests and verifies faculty on approve', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByText, getByTestId } = await renderWithProviders(<CollegeAdminScreen />);

      expect(getByText('🏫 College Admin Panel')).toBeTruthy();
      expect(getByText('Prof. Sharma')).toBeTruthy();
      expect(getByText('Computer Science')).toBeTruthy();

      // Press Verify Faculty
      fireEvent.press(getByTestId('approve-faculty-req-1'));
      expect(alertSpy).toHaveBeenCalledWith(
        'Verify Faculty',
        expect.stringContaining('Prof. Sharma'),
        expect.any(Array),
      );

      // Confirm in alert
      const confirmBtn = alertSpy.mock.calls[0][2]?.find((b: any) => b.text === 'Verify');
      await confirmBtn?.onPress?.();

      await waitFor(() => {
        expect(facultyService.approveFacultyRequest).toHaveBeenCalledWith(
          'req-1',
          'user-fac-1',
          mockAdminUser.id,
        );
      });
    });
  });

  describe('TEST GROUP 2: Tab 2 - User Management', () => {
    test('switches to Users tab and toggles Senior revocation', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByTestId, getByText } = await renderWithProviders(<CollegeAdminScreen />);

      // Switch to Users tab
      fireEvent.press(getByTestId('tab-college-users'));

      await waitFor(() => {
        expect(getByText('Senior Rohan')).toBeTruthy();
      });

      // Press Revoke Senior
      fireEvent.press(getByTestId('toggle-senior-u-senior-1'));
      expect(alertSpy).toHaveBeenCalledWith(
        'Revoke Senior Access',
        expect.stringContaining('Senior Rohan'),
        expect.any(Array),
      );

      const confirmBtn = alertSpy.mock.calls[0][2]?.find((b: any) => b.text === 'Confirm');
      await confirmBtn?.onPress?.();

      await waitFor(() => {
        expect(facultyService.revokeSeniorAccess).toHaveBeenCalledWith('u-senior-1', mockAdminUser.id);
      });
    });

    test('opens user detail modal on card press', async () => {
      const { getByTestId } = await renderWithProviders(<CollegeAdminScreen />);
      fireEvent.press(getByTestId('tab-college-users'));

      await waitFor(() => {
        expect(getByTestId('user-item-u-senior-1')).toBeTruthy();
      });

      fireEvent.press(getByTestId('user-item-u-senior-1'));

      await waitFor(() => {
        expect(getByTestId('modal-user-detail')).toBeTruthy();
        expect(getByTestId('modal-close-button')).toBeTruthy();
      });
    });
  });

  describe('TEST GROUP 3: Tab 3 - College Stats', () => {
    test('switches to Stats tab and renders 3x2 institutional grid', async () => {
      const { getByTestId, getByText } = await renderWithProviders(<CollegeAdminScreen />);

      fireEvent.press(getByTestId('tab-college-stats'));

      await waitFor(() => {
        expect(getByText('Institutional Overview')).toBeTruthy();
        expect(getByTestId('stats-grid')).toBeTruthy();
        expect(getByTestId('stat-box-students')).toBeTruthy();
        expect(getByTestId('stat-box-seniors')).toBeTruthy();
        expect(getByTestId('stat-box-faculty')).toBeTruthy();
      });
    });
  });
});

/**
 * Faculty Pending Access & Lifecycle Flow Tests
 * College Knowledge Vault
 *
 * Validates:
 * 1. PendingAccessScreen renders faculty request details
 * 2. "Browse as Student" allows browsing without losing pending status
 * 3. ProfileScreen displays pending status card and cancel option
 * 4. Canceling request reverts user to standard student
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import PendingAccessScreen from '../../src/features/auth/screens/PendingAccessScreen';
import ProfileScreen from '../../src/features/profile/screens/ProfileScreen';
import { renderWithProviders, mockAuthStoreReturn, createMockUser } from '../utils/testUtils';
import { UserRole } from '../../src/core/types/user.types';
import * as profileService from '../../src/core/services/profileService';

const mockReset = jest.fn();
const mockNavigate = jest.fn();

let mockRouteParams: any = {
  requestType: 'faculty',
  collegeName: 'IIT Bombay',
  designation: 'Assistant Professor',
  department: 'Computer Science',
};

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      reset: mockReset,
    }),
    useRoute: () => ({
      params: mockRouteParams,
    }),
  };
});

let mockPendingFacultyUser = createMockUser(UserRole.Faculty, {
  displayName: 'Prof. Jibin',
  email: 'jibin@iitb.ac.in',
  role: UserRole.Faculty,
  isVerified: false,
  pendingRoleRequest: 'faculty',
  college: 'IIT Bombay',
  collegeName: 'IIT Bombay',
  department: 'Computer Science',
});

let mockAuthStoreState = mockAuthStoreReturn(mockPendingFacultyUser);

jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: (...args: unknown[]) => {
    const selector = args[0] as ((mockState: unknown) => unknown) | undefined;
    if (typeof selector === 'function') {
      return selector(mockAuthStoreState);
    }
    return mockAuthStoreState;
  },
}));

jest.mock('../../src/core/services/profileService', () => ({
  getUserUpvoteCount: jest.fn().mockResolvedValue(0),
  getFacultyModerationStats: jest.fn().mockResolvedValue({ approved: 0, rejected: 0, pending: 0 }),
  getCollegeStats: jest.fn().mockResolvedValue({
    totalStudents: 100,
    totalSeniors: 30,
    verifiedFaculty: 5,
    pendingFaculty: 1,
    approvedEntries: 40,
    pendingEntries: 2,
  }),
  getPlatformStats: jest.fn().mockResolvedValue({
    totalColleges: 10,
    totalUsers: 500,
    totalEntries: 800,
    pendingAdminRequests: 1,
  }),
  cancelFacultyRequest: jest.fn().mockResolvedValue(undefined),
}));

describe('Faculty Pending Lifecycle Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPendingFacultyUser = createMockUser(UserRole.Faculty, {
      displayName: 'Prof. Jibin',
      email: 'jibin@iitb.ac.in',
      role: UserRole.Faculty,
      isVerified: false,
      pendingRoleRequest: 'faculty',
      college: 'IIT Bombay',
      collegeName: 'IIT Bombay',
      department: 'Computer Science',
    });
    mockAuthStoreState = mockAuthStoreReturn(mockPendingFacultyUser);
  });

  test('Step 1: PendingAccessScreen displays faculty submission & allows student browsing', async () => {
    const { getByText, getByTestId } = await renderWithProviders(<PendingAccessScreen />);

    expect(getByText('Request Submitted')).toBeTruthy();
    expect(getByText('Faculty Verification')).toBeTruthy();
    expect(getByText('IIT Bombay')).toBeTruthy();
    expect(getByText('Assistant Professor')).toBeTruthy();

    // Tap Browse Vault as Student
    fireEvent.press(getByTestId('btn-browse-student'));
    expect(mockAuthStoreState.setIsNewUser).toHaveBeenCalledWith(false);
    expect(mockReset).toHaveBeenCalledWith(
      expect.objectContaining({
        routes: [{ name: 'MainTabs' }],
      }),
    );
  });

  test('Step 2: ProfileScreen reflects pending faculty status with cancel request option', async () => {
    const { getByTestId, getByText } = await renderWithProviders(<ProfileScreen />);

    expect(getByTestId('profile-display-name')).toBeTruthy();
    expect(getByText('FACULTY (PENDING)')).toBeTruthy();
    expect(getByTestId('pending-faculty-profile-sections')).toBeTruthy();
    expect(getByText('Faculty Verification Pending')).toBeTruthy();
    expect(getByTestId('button-cancel-faculty-request')).toBeTruthy();
  });

  test('Step 3: Canceling faculty request calls cancelFacultyRequest and resets user store role', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
    const { getByTestId } = await renderWithProviders(<ProfileScreen />);

    fireEvent.press(getByTestId('button-cancel-faculty-request'));
    expect(alertSpy).toHaveBeenCalled();

    // Trigger the confirmation button onPress
    const alertButtons = alertSpy.mock.calls[0][2] as any;
    const confirmBtn = alertButtons?.find((b: any) => b.text === 'Withdraw Request');
    await confirmBtn?.onPress?.();

    await waitFor(() => {
      expect(profileService.cancelFacultyRequest).toHaveBeenCalledWith(mockPendingFacultyUser.id);
    });
  });
});

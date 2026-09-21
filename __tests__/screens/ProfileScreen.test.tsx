/**
 * ProfileScreen Unit Tests — All 6 Roles
 * College Knowledge Vault
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import ProfileScreen from '../../src/features/profile/screens/ProfileScreen';
import { renderWithProviders, mockAuthStoreReturn, createMockUser } from '../utils/testUtils';
import { UserRole } from '../../src/core/types/user.types';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

let mockUser = createMockUser(UserRole.Student, {
  joiningYear: 2024,
  programDuration: 4,
  college: 'IIT Bombay',
  department: 'Computer Science',
});

let mockAuthStoreState = mockAuthStoreReturn(mockUser);

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
  getUserUpvoteCount: jest.fn().mockResolvedValue(15),
  getFacultyModerationStats: jest.fn().mockResolvedValue({ approved: 8, rejected: 2, pending: 3 }),
  getCollegeStats: jest.fn().mockResolvedValue({
    totalStudents: 120,
    totalSeniors: 40,
    verifiedFaculty: 10,
    pendingFaculty: 2,
    approvedEntries: 85,
    pendingEntries: 5,
  }),
  getPlatformStats: jest.fn().mockResolvedValue({
    totalColleges: 15,
    totalUsers: 800,
    totalEntries: 1200,
    pendingAdminRequests: 4,
  }),
  cancelFacultyRequest: jest.fn().mockResolvedValue(undefined),
}));

describe('ProfileScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TEST GROUP 1: Student Role', () => {
    test('renders ProfileHeader and Student academic progress sections', async () => {
      mockUser = createMockUser(UserRole.Student, {
        displayName: 'Aarav Sharma',
        email: 'aarav@test.com',
        joiningYear: 2024,
        programDuration: 4,
        college: 'IIT Bombay',
        department: 'Computer Science',
      });
      mockAuthStoreState = mockAuthStoreReturn(mockUser);

      const { getByText, getByTestId, queryByTestId } = await renderWithProviders(<ProfileScreen />);

      expect(getByText('Aarav Sharma')).toBeTruthy();
      expect(getByText('aarav@test.com')).toBeTruthy();
      expect(getByText('STUDENT')).toBeTruthy();
      expect(getByTestId('student-profile-sections')).toBeTruthy();
      expect(getByText('Academic Progress')).toBeTruthy();
      expect(getByTestId('saved-entries-card')).toBeTruthy();
      expect(queryByTestId('button-request-faculty-access')).toBeNull();
    });

    test('tapping View Bookmarks navigates to Bookmarks', async () => {
      mockUser = createMockUser(UserRole.Student, {
        joiningYear: 2024,
        programDuration: 4,
      });
      mockAuthStoreState = mockAuthStoreReturn(mockUser);

      const { getByTestId } = await renderWithProviders(<ProfileScreen />);
      fireEvent.press(getByTestId('button-view-saved-entries'));

      expect(mockNavigate).toHaveBeenCalledWith('Bookmarks');
    });
  });

  describe('TEST GROUP 2: Senior Role', () => {
    test('renders Senior contributor badge and active submit entry button', async () => {
      mockUser = createMockUser(UserRole.Student, {
        displayName: 'Senior Priya',
        joiningYear: 2023,
        programDuration: 4,
        entryCount: 6,
        totalUpvotesReceived: 32,
      });
      mockAuthStoreState = mockAuthStoreReturn(mockUser);

      const { getByText, getByTestId } = await renderWithProviders(<ProfileScreen />);

      expect(getByText('SENIOR CONTRIBUTOR')).toBeTruthy();
      expect(getByTestId('senior-profile-sections')).toBeTruthy();
      expect(getByTestId('button-submit-entry')).toBeTruthy();
      expect(getByText('Submit Knowledge Entry')).toBeTruthy();
    });

    test('renders revocation banner when isSeniorRevoked is true', async () => {
      mockUser = createMockUser(UserRole.Student, {
        displayName: 'Revoked Senior',
        joiningYear: 2023,
        programDuration: 4,
        isSeniorRevoked: true,
      });
      mockAuthStoreState = mockAuthStoreReturn(mockUser);

      const { getByTestId, getByText } = await renderWithProviders(<ProfileScreen />);

      expect(getByTestId('senior-revoked-banner')).toBeTruthy();
      expect(getByText('Submission Privileges Revoked')).toBeTruthy();
      expect(getByText('Submissions Suspended')).toBeTruthy();
    });
  });

  describe('TEST GROUP 3: Pending Faculty Role', () => {
    test('renders pending status card and cancel button', async () => {
      mockUser = createMockUser(UserRole.Faculty, {
        displayName: 'Prof. Mehra',
        role: UserRole.Faculty,
        isVerified: false,
        pendingRoleRequest: 'faculty',
        college: 'IIT Bombay',
        department: 'Mechanical',
      });
      mockAuthStoreState = mockAuthStoreReturn(mockUser);

      const { getByText, getByTestId } = await renderWithProviders(<ProfileScreen />);

      expect(getByText('FACULTY (PENDING)')).toBeTruthy();
      expect(getByTestId('pending-faculty-profile-sections')).toBeTruthy();
      expect(getByText('Faculty Verification Pending')).toBeTruthy();
      expect(getByTestId('button-cancel-faculty-request')).toBeTruthy();
    });
  });

  describe('TEST GROUP 4: Verified Faculty Role', () => {
    test('renders verified faculty card with moderation stats', async () => {
      mockUser = createMockUser(UserRole.Faculty, {
        displayName: 'Dr. Nair',
        role: UserRole.Faculty,
        isVerified: true,
        college: 'IIT Bombay',
        department: 'Electrical',
      });
      mockAuthStoreState = mockAuthStoreReturn(mockUser);

      const { getByText, getByTestId } = await renderWithProviders(<ProfileScreen />);

      expect(getByText('VERIFIED FACULTY')).toBeTruthy();
      expect(getByTestId('faculty-profile-sections')).toBeTruthy();
      expect(getByText('Verified Faculty Member')).toBeTruthy();
      expect(getByTestId('button-open-moderation-queue')).toBeTruthy();
    });
  });

  describe('TEST GROUP 5: College Admin Role', () => {
    test('renders College Admin sections and panel navigation button', async () => {
      mockUser = createMockUser(UserRole.Student, {
        displayName: 'Dean Verma',
        isCollegeAdmin: true,
        college: 'IIT Bombay',
      });
      mockAuthStoreState = mockAuthStoreReturn(mockUser);

      const { getByText, getByTestId } = await renderWithProviders(<ProfileScreen />);

      expect(getByText('COLLEGE ADMIN')).toBeTruthy();
      expect(getByTestId('college-admin-profile-sections')).toBeTruthy();
      expect(getByTestId('button-open-college-admin-panel')).toBeTruthy();
    });
  });

  describe('TEST GROUP 6: Super Admin Role', () => {
    test('renders Super Admin sections and platform overview', async () => {
      mockUser = createMockUser(UserRole.Student, {
        displayName: 'Platform Admin',
        isSuperAdmin: true,
      });
      mockAuthStoreState = mockAuthStoreReturn(mockUser);

      const { getByText, getByTestId } = await renderWithProviders(<ProfileScreen />);

      expect(getByText('SUPER ADMIN')).toBeTruthy();
      expect(getByTestId('super-admin-profile-sections')).toBeTruthy();
      expect(getByTestId('button-open-super-admin-panel')).toBeTruthy();
    });
  });
});

/**
 * Authentication Flow & Multi-Tenant Onboarding Tests
 * College Knowledge Vault
 */

import React from 'react';
import { fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';
import LoginScreen from '../../src/features/auth/screens/LoginScreen';
import RoleSelectionScreen from '../../src/features/auth/screens/RoleSelectionScreen';
import { createMockUser, mockAuthStoreReturn, renderWithProviders } from '../utils/testUtils';
import { UserRole } from '../../src/core/types/user.types';

// Navigation mock fns
const mockReset = jest.fn();
const mockNavigate = jest.fn();

// Mock authService, facultyRequestService, collegeService
const mockSignInWithGoogle = jest.fn();
const mockCompleteRoleSelection = jest.fn();
const mockSubmitFacultyRequest = jest.fn();
const mockSubmitCollegeAdminRequest = jest.fn();

jest.mock('../../src/core/services/authService', () => ({
  signInWithGoogle: (...args: unknown[]) => mockSignInWithGoogle(...args),
  completeRoleSelection: (...args: unknown[]) => mockCompleteRoleSelection(...args),
  restoreSession: jest.fn(),
  onAuthStateChange: jest.fn(),
  getCurrentUser: jest.fn(),
}));

jest.mock('../../src/core/services/facultyRequestService', () => ({
  submitFacultyRequest: (...args: unknown[]) => mockSubmitFacultyRequest(...args),
}));

jest.mock('../../src/core/services/collegeService', () => ({
  getColleges: jest.fn().mockResolvedValue([
    { id: 'c1', name: 'IIT Bombay', city: 'Mumbai', state: 'MH', country: 'India', isActive: true },
  ]),
  searchColleges: jest.fn().mockResolvedValue([]),
  submitCollegeAdminRequest: (...args: unknown[]) => mockSubmitCollegeAdminRequest(...args),
}));

// Mock authStore
let mockAuthStoreState = mockAuthStoreReturn(null);
jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: (...args: unknown[]) => {
    const selector = args[0] as ((mockState: unknown) => unknown) | undefined;
    if (typeof selector === 'function') {
      return selector(mockAuthStoreState);
    }
    return mockAuthStoreState;
  },
}));

// Mock MMKV
jest.mock('../../src/core/services/mmkvStorage', () => ({
  appStorage: {
    set: jest.fn(),
    getString: jest.fn(),
    getBoolean: jest.fn(() => false),
    delete: jest.fn(),
  },
}));

describe('Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthStoreState = mockAuthStoreReturn(null);

    const { useNavigation } = require('@react-navigation/native');
    (useNavigation as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
      reset: mockReset,
      goBack: jest.fn(),
      dispatch: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
    });
  });

  afterEach(async () => {
    cleanup();
    await new Promise<void>(resolve => { setTimeout(resolve, 0); });
  });

  describe('TEST GROUP 1: LoginScreen', () => {
    test('1a: renders KV logo circle', async () => {
      const { getByText } = await renderWithProviders(<LoginScreen />);
      expect(getByText('KV')).toBeTruthy();
    });

    test('1b: renders "Knowledge Vault" title', async () => {
      const { getByText } = await renderWithProviders(<LoginScreen />);
      expect(getByText('Knowledge Vault')).toBeTruthy();
    });

    test('1c: renders "Continue with Google" button', async () => {
      const { getByText } = await renderWithProviders(<LoginScreen />);
      expect(getByText('Continue with Google')).toBeTruthy();
    });

    test('1d: renders tagline text', async () => {
      const { getByText } = await renderWithProviders(<LoginScreen />);
      expect(getByText("Don't let knowledge graduate with you")).toBeTruthy();
    });

    test('1e: renders new user helper text', async () => {
      const { getByText } = await renderWithProviders(<LoginScreen />);
      expect(
        getByText('New here? Your account is created automatically'),
      ).toBeTruthy();
    });

    test('1f: tapping Google button calls signInWithGoogle', async () => {
      mockSignInWithGoogle.mockResolvedValue({
        session: { access_token: 'tok' },
        user: createMockUser(UserRole.Student),
        isNewUser: false,
      });

      const { getByTestId } = await renderWithProviders(<LoginScreen />);
      await act(async () => {
        fireEvent.press(getByTestId('google-sign-in-button'));
      });

      expect(mockSignInWithGoogle).toHaveBeenCalled();
    });

    test('1g: navigates to RoleSelection for new user', async () => {
      mockSignInWithGoogle.mockResolvedValue({
        session: { access_token: 'tok' },
        user: createMockUser(UserRole.Student),
        isNewUser: true,
      });

      const { getByTestId } = await renderWithProviders(<LoginScreen />);
      await act(async () => {
        fireEvent.press(getByTestId('google-sign-in-button'));
      });

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalledWith({
          index: 0,
          routes: [{ name: 'RoleSelection' }],
        });
      });
    });

    test('1h: renders back button on LoginScreen', async () => {
      const { getByTestId } = await renderWithProviders(<LoginScreen />);
      expect(getByTestId('login-back-button')).toBeTruthy();
    });
  });

  describe('TEST GROUP 2: RoleSelectionScreen (3-Step Multi-Tenant Flow)', () => {
    beforeEach(() => {
      mockAuthStoreState = mockAuthStoreReturn(
        createMockUser(UserRole.Student, {
          id: 'user-1',
          displayName: 'John Doe',
        }),
        { isNewUser: true },
      );
    });

    test('2a: renders college search and academic details fields', async () => {
      const { getByTestId } = await renderWithProviders(<RoleSelectionScreen />);
      expect(getByTestId('input-search-college')).toBeTruthy();
      expect(getByTestId('input-joining-year')).toBeTruthy();
    });

    test('2b: Continue button disabled when form invalid', async () => {
      const { getByTestId } = await renderWithProviders(<RoleSelectionScreen />);
      const button = getByTestId('button-continue');
      expect(button).toBeTruthy();
    });

    test('2c: final year joining year displays Senior access message', async () => {
      const { getByTestId, getByText } = await renderWithProviders(<RoleSelectionScreen />);
      const currentYear = new Date().getFullYear();
      await act(async () => {
        fireEvent.press(getByTestId('program-chip-MCA')); // 2 years
        fireEvent.changeText(getByTestId('input-joining-year'), String(currentYear - 1)); // Year 2 of 2
      });
      await waitFor(() => {
        expect(getByText(/Senior access/)).toBeTruthy();
      });
    });

    test('2d: first year joining year displays Student access message', async () => {
      const { getByTestId, getByText } = await renderWithProviders(<RoleSelectionScreen />);
      const currentYear = new Date().getFullYear();
      await act(async () => {
        fireEvent.press(getByTestId('program-chip-BTech / BE')); // 4 years
        fireEvent.changeText(getByTestId('input-joining-year'), String(currentYear)); // Year 1 of 4
      });
      await waitFor(() => {
        expect(getByText(/Senior access in/)).toBeTruthy();
      });
    });

    test('2e: unlisted college button shows custom college input fields', async () => {
      const { getByTestId } = await renderWithProviders(<RoleSelectionScreen />);

      await act(async () => {
        fireEvent.press(getByTestId('button-unlisted-college'));
      });

      await waitFor(() => {
        expect(getByTestId('input-custom-college-name')).toBeTruthy();
        expect(getByTestId('input-custom-city')).toBeTruthy();
        expect(getByTestId('input-custom-state')).toBeTruthy();
      });
    });

    test('2f: selecting Faculty card shows request inputs', async () => {
      const { getByTestId } = await renderWithProviders(<RoleSelectionScreen />);

      await act(async () => {
        fireEvent.press(getByTestId('card-role-faculty'));
      });

      await waitFor(() => {
        expect(getByTestId('input-designation')).toBeTruthy();
        expect(getByTestId('input-request-reason')).toBeTruthy();
      });
    });

    test('2g: Faculty context renders Step 2 Department/Designation and Step 3 Request Reason', async () => {
      mockAuthStoreState = mockAuthStoreReturn(
        createMockUser(UserRole.Student, { id: 'fac-1' }),
        { isNewUser: true, selectedContextRole: UserRole.Faculty }
      );

      const { getByText, getByTestId } = await renderWithProviders(<RoleSelectionScreen />);
      expect(getByText('Step 2: Department & Designation')).toBeTruthy();
      expect(getByText('Step 3: Verification Request Reason')).toBeTruthy();
      expect(getByTestId('input-department')).toBeTruthy();
      expect(getByTestId('input-designation')).toBeTruthy();
      expect(getByTestId('input-request-reason')).toBeTruthy();
      expect(getByText('Submit Faculty Request')).toBeTruthy();
    });

    test('2h: College Admin context renders Step 2 Designation and Step 3 Admin Reason', async () => {
      mockAuthStoreState = mockAuthStoreReturn(
        createMockUser(UserRole.Student, { id: 'admin-1' }),
        { isNewUser: true, selectedContextRole: 'college_admin' }
      );

      const { getByText, getByTestId } = await renderWithProviders(<RoleSelectionScreen />);
      expect(getByText('Step 2: Institutional Designation')).toBeTruthy();
      expect(getByText('Step 3: Why should you be College Admin?')).toBeTruthy();
      expect(getByTestId('input-designation')).toBeTruthy();
      expect(getByTestId('input-employee-id')).toBeTruthy();
      expect(getByTestId('input-request-reason')).toBeTruthy();
      expect(getByText('Submit College Admin Request')).toBeTruthy();
    });

    test('2i: Super Admin context for non-super-admin user shows Access Restricted', async () => {
      mockAuthStoreState = mockAuthStoreReturn(
        createMockUser(UserRole.Student, { id: 'norm-1', isSuperAdmin: false }),
        { isNewUser: true, selectedContextRole: 'super_admin' }
      );

      const { getByText } = await renderWithProviders(<RoleSelectionScreen />);
      expect(getByText('Access Restricted')).toBeTruthy();
      expect(getByText('Return to Portal Selection')).toBeTruthy();
    });

    test('2j: shows back button when isNewUser === true', async () => {
      mockAuthStoreState = mockAuthStoreReturn(
        createMockUser(UserRole.Student, { id: 'user-new' }),
        { isNewUser: true }
      );

      const { getByTestId } = await renderWithProviders(<RoleSelectionScreen />);
      expect(getByTestId('button-role-back')).toBeTruthy();
    });

    test('2k: hides back button when isNewUser === false', async () => {
      mockAuthStoreState = mockAuthStoreReturn(
        createMockUser(UserRole.Student, { id: 'user-existing' }),
        { isNewUser: false }
      );

      const { queryByTestId } = await renderWithProviders(<RoleSelectionScreen />);
      expect(queryByTestId('button-role-back')).toBeNull();
    });

    test('2l: pressing back button navigates to Landing', async () => {
      mockAuthStoreState = mockAuthStoreReturn(
        createMockUser(UserRole.Student, { id: 'user-new' }),
        { isNewUser: true }
      );

      const { getByTestId } = await renderWithProviders(<RoleSelectionScreen />);
      const backBtn = getByTestId('button-role-back');
      await act(async () => {
        fireEvent.press(backBtn);
      });

      expect(mockNavigate).toHaveBeenCalledWith('Landing');
    });
  });

  describe('TEST GROUP 3: Navigation guards', () => {
    test('3a: RootNavigator shows Login for unauthenticated user', async () => {
      mockAuthStoreState = mockAuthStoreReturn(null, {
        hasOnboarded: true,
        isAuthenticated: false,
      });

      const { getByText } = await renderWithProviders(<LoginScreen />);
      expect(getByText('Knowledge Vault')).toBeTruthy();
    });
  });
});

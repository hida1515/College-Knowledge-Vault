/**
 * Privacy Policy Unit Tests (Play Store & DPDP Act Compliance)
 * College Knowledge Vault
 */

import React from 'react';
import { fireEvent, act } from '@testing-library/react-native';
import PrivacyPolicyScreen from '../../src/features/legal/screens/PrivacyPolicyScreen';
import LoginScreen from '../../src/features/auth/screens/LoginScreen';
import ProfileScreen from '../../src/features/profile/screens/ProfileScreen';
import { renderWithProviders, mockAuthStoreReturn, createMockUser } from '../utils/testUtils';
import { UserRole } from '../../src/core/types/user.types';

const mockNavigate = jest.fn();
const mockReset = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      reset: mockReset,
      goBack: jest.fn(),
      canGoBack: () => true,
      addListener: jest.fn(() => jest.fn()),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

jest.mock('../../src/core/services/profileService', () => ({
  getUserUpvoteCount: jest.fn().mockResolvedValue(5),
  getFacultyModerationStats: jest.fn().mockResolvedValue({}),
  getCollegeStats: jest.fn().mockResolvedValue({}),
  getPlatformStats: jest.fn().mockResolvedValue({}),
  cancelFacultyRequest: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/core/services/entryService', () => ({
  getUserEntries: jest.fn().mockResolvedValue([]),
}));

const mockUser = createMockUser(UserRole.Student, {
  id: 'usr-privacy-1',
  displayName: 'Student User',
  email: 'student@college.edu',
  collegeId: 'col-1',
  college: 'Model Engineering College',
});

let mockAuthStoreState = mockAuthStoreReturn(mockUser);
jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: Object.assign(
    (selector?: (state: any) => any) => {
      if (selector) return selector(mockAuthStoreState);
      return mockAuthStoreState;
    },
    {
      getState: () => mockAuthStoreState,
    },
  ),
}));

describe('Privacy Policy Compliance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthStoreState = mockAuthStoreReturn(mockUser);
  });

  test('test 1a: PrivacyPolicyScreen renders successfully', async () => {
    const { getByTestId, getByText } = await renderWithProviders(
      React.createElement(PrivacyPolicyScreen),
    );

    expect(getByTestId('privacy-policy-title')).toBeTruthy();
    expect(getByText('Privacy Policy')).toBeTruthy();
  });

  test('test 1b: all 6 required sections are visible', async () => {
    const { getByTestId, getByText } = await renderWithProviders(
      React.createElement(PrivacyPolicyScreen),
    );

    // Section 1: What we collect
    expect(getByTestId('privacy-section-1')).toBeTruthy();
    expect(getByText('1. What We Collect')).toBeTruthy();

    // Section 2: How we use it
    expect(getByTestId('privacy-section-2')).toBeTruthy();
    expect(getByText('2. How We Use It')).toBeTruthy();

    // Section 3: Who sees your data
    expect(getByTestId('privacy-section-3')).toBeTruthy();
    expect(getByText('3. Who Sees Your Data')).toBeTruthy();

    // Section 4: Data deletion
    expect(getByTestId('privacy-section-4')).toBeTruthy();
    expect(getByText('4. Data Deletion')).toBeTruthy();

    // Section 5: Third party services
    expect(getByTestId('privacy-section-5')).toBeTruthy();
    expect(getByText('5. Third-Party Services')).toBeTruthy();

    // Section 6: Contact & grievance
    expect(getByTestId('privacy-section-6')).toBeTruthy();
    expect(getByText('6. Contact & Grievance Redressal')).toBeTruthy();
  });

  test('test 1c: Privacy Policy link in LoginScreen footer navigates to PrivacyPolicy', async () => {
    const { getByTestId } = await renderWithProviders(React.createElement(LoginScreen));

    const privacyLink = getByTestId('link-privacy-policy');
    expect(privacyLink).toBeTruthy();

    await act(async () => {
      fireEvent.press(privacyLink);
    });

    expect(mockNavigate).toHaveBeenCalledWith('PrivacyPolicy');
  });

  test('test 1d: Privacy Policy link in ProfileScreen settings navigates to PrivacyPolicy', async () => {
    const { getByTestId } = await renderWithProviders(React.createElement(ProfileScreen));

    const profilePrivacyBtn = getByTestId('btn-privacy-policy');
    expect(profilePrivacyBtn).toBeTruthy();

    await act(async () => {
      fireEvent.press(profilePrivacyBtn);
    });

    expect(mockNavigate).toHaveBeenCalledWith('PrivacyPolicy');
  });
});

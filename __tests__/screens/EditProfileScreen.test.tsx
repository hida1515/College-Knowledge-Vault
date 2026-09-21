/**
 * EditProfileScreen Unit Tests
 * College Knowledge Vault
 */

import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import EditProfileScreen from '../../src/features/profile/screens/EditProfileScreen';
import { renderWithProviders, mockAuthStoreReturn, createMockUser } from '../utils/testUtils';
import { UserRole } from '../../src/core/types/user.types';
import * as profileService from '../../src/core/services/profileService';

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      goBack: mockGoBack,
      navigate: jest.fn(),
    }),
  };
});

const mockUser = createMockUser(UserRole.Student, {
  id: 'usr-edit-1',
  displayName: 'Original Student',
  email: 'student@college.edu',
  college: 'Model Engineering College',
  collegeName: 'Model Engineering College',
  department: 'Computer Science',
  program: 'B.Tech',
  programDuration: 4,
  joiningYear: 2021,
});

let mockAuthStoreState = mockAuthStoreReturn(mockUser);
jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: (selector?: (state: any) => any) => {
    if (selector) return selector(mockAuthStoreState);
    return mockAuthStoreState;
  },
}));

describe('EditProfileScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert');
    mockAuthStoreState = mockAuthStoreReturn(mockUser);
  });

  test('test 1a: renders editable fields with existing values', async () => {
    const { getByTestId } = await renderWithProviders(<EditProfileScreen />);

    expect(getByTestId('input-edit-display-name').props.value).toBe('Original Student');
    expect(getByTestId('input-edit-department').props.value).toBe('Computer Science');
    expect(getByTestId('input-edit-joining-year').props.value).toBe('2021');
    expect(getByTestId('btn-save-profile')).toBeTruthy();
  });

  test('test 1b: email field is disabled and read-only', async () => {
    const { getByTestId, queryByTestId } = await renderWithProviders(<EditProfileScreen />);

    expect(getByTestId('text-readonly-email').props.children).toBe('student@college.edu');
    expect(queryByTestId('input-edit-email')).toBeNull();
  });

  test('test 1c: college field is disabled and read-only', async () => {
    const { getByTestId, queryByTestId } = await renderWithProviders(<EditProfileScreen />);

    expect(getByTestId('text-readonly-college').props.children).toBe('Model Engineering College');
    expect(queryByTestId('input-edit-college')).toBeNull();
  });

  test('test 1d: changing joining year shows warning dialog', async () => {
    const { getByTestId } = await renderWithProviders(<EditProfileScreen />);

    // Change year from 2021 to 2022
    await act(async () => {
      fireEvent.changeText(getByTestId('input-edit-joining-year'), '2022');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-save-profile'));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Seniority Recalculation',
      expect.stringContaining('Changing your joining year will recalculate your access level'),
      expect.any(Array),
    );
  });

  test('test 1e: save calls updateUserProfile with correct data when confirmed', async () => {
    const spyUpdate = jest.spyOn(profileService, 'updateUserProfile').mockResolvedValue({
      ...mockUser,
      displayName: 'Updated Name',
      department: 'Electrical Engineering',
      joiningYear: 2022,
      graduationYear: 2026,
    } as any);

    const { getByTestId } = await renderWithProviders(<EditProfileScreen />);

    // Change values
    await act(async () => {
      fireEvent.changeText(getByTestId('input-edit-display-name'), 'Updated Name');
      fireEvent.changeText(getByTestId('input-edit-department'), 'Electrical Engineering');
      fireEvent.changeText(getByTestId('input-edit-joining-year'), '2022');
    });

    // Press save -> triggers warning
    await act(async () => {
      fireEvent.press(getByTestId('btn-save-profile'));
    });

    // Accept warning
    const alertCall = alertSpy.mock.calls.find(
      (c) => c[0] === 'Seniority Recalculation',
    );
    expect(alertCall).toBeTruthy();
    const understandBtn = alertCall[2].find((b: any) => b.text === 'I Understand');
    expect(understandBtn).toBeTruthy();

    await act(async () => {
      understandBtn.onPress();
    });

    await waitFor(() => {
      expect(spyUpdate).toHaveBeenCalledWith('usr-edit-1', {
        displayName: 'Updated Name',
        department: 'Electrical Engineering',
        program: 'B.Tech',
        programDuration: 4,
        joiningYear: 2022,
      });
      expect(mockAuthStoreState.setUser).toHaveBeenCalled();
    });
  });

  test('test 1f: success toast / alert shown after save', async () => {
    jest.spyOn(profileService, 'updateUserProfile').mockResolvedValue({
      ...mockUser,
      displayName: 'Simple Update',
    } as any);

    const { getByTestId } = await renderWithProviders(<EditProfileScreen />);

    // Change only display name (no joining year change, so no warning)
    await act(async () => {
      fireEvent.changeText(getByTestId('input-edit-display-name'), 'Simple Update');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-save-profile'));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Profile Updated',
        'Your profile details have been successfully updated.',
        expect.any(Array),
      );
    });
  });
});

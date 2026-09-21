import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DashboardScreen from '../../src/features/dashboard/screens/DashboardScreen';
import * as useEntriesHooks from '../../src/core/hooks/useEntries';
import * as authStore from '../../src/core/store/authStore';
import { UserRole } from '../../src/core/types/user.types';

jest.mock('../../src/core/hooks/useEntries');
jest.mock('../../src/core/store/authStore');

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('DashboardScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TEST GROUP 1: Rendering', () => {
    test('1a & 1b: renders 4 stat cards with counts from useUserStats', async () => {
      (authStore.useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: { id: 'u1', displayName: 'Senior User', role: UserRole.Senior },
      });

      (useEntriesHooks.useUserEntries as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        refetch: jest.fn(),
      });

      (useEntriesHooks.useUserStats as jest.Mock).mockReturnValue({
        data: { total: 10, approved: 6, pending: 3, rejected: 1 },
        isLoading: false,
        refetch: jest.fn(),
      });

      const { getByText } = await render(<DashboardScreen />);

      expect(getByText('My Contributions')).toBeTruthy();
      expect(getByText('10')).toBeTruthy();
      expect(getByText('6')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();
      expect(getByText('1')).toBeTruthy();
    });

    test('1c: shows FAB for senior role and navigates on press', async () => {
      (authStore.useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: { id: 'u1', displayName: 'Senior User', role: UserRole.Senior },
      });

      (useEntriesHooks.useUserEntries as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        refetch: jest.fn(),
      });

      (useEntriesHooks.useUserStats as jest.Mock).mockReturnValue({
        data: { total: 0, approved: 0, pending: 0, rejected: 0 },
        isLoading: false,
        refetch: jest.fn(),
      });

      const { getByTestId } = await render(<DashboardScreen />);

      const fab = getByTestId('dashboard-fab-button');
      expect(fab).toBeTruthy();

      fireEvent.press(fab);
      expect(mockNavigate).toHaveBeenCalledWith('SubmitTab', {
        screen: 'SubmitStep1Type',
      });
    });

    test('1d: hides FAB for student role', async () => {
      (authStore.useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: { id: 'u2', displayName: 'Student User', role: UserRole.Student },
      });

      (useEntriesHooks.useUserEntries as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        refetch: jest.fn(),
      });

      (useEntriesHooks.useUserStats as jest.Mock).mockReturnValue({
        data: { total: 0, approved: 0, pending: 0, rejected: 0 },
        isLoading: false,
        refetch: jest.fn(),
      });

      const { queryByTestId } = await render(<DashboardScreen />);
      expect(queryByTestId('dashboard-fab-button')).toBeNull();
    });

    test('1e: shows empty state when no entries', async () => {
      (authStore.useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: { id: 'u1', displayName: 'Senior User', role: UserRole.Senior },
      });

      (useEntriesHooks.useUserEntries as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        refetch: jest.fn(),
      });

      (useEntriesHooks.useUserStats as jest.Mock).mockReturnValue({
        data: { total: 0, approved: 0, pending: 0, rejected: 0 },
        isLoading: false,
        refetch: jest.fn(),
      });

      const { getByText } = await render(<DashboardScreen />);
      expect(getByText('No entries yet')).toBeTruthy();
    });
  });
});

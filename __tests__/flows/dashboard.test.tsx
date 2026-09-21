/**
 * Dashboard Flow Tests
 * College Knowledge Vault
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import DashboardScreen from '../../src/features/dashboard/screens/DashboardScreen';
import * as useEntriesHooks from '../../src/core/hooks/useEntries';
import { createMockEntry, createMockStats, createMockUser, renderWithProviders } from '../utils/testUtils';
import { EntryStatus } from '../../src/core/types/entry.types';
import { UserRole } from '../../src/core/types/user.types';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
      reset: jest.fn(),
      dispatch: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
    }),
  };
});

// Mock hooks
jest.mock('../../src/core/hooks/useEntries');

// Mock authStore
let mockUser = createMockUser(UserRole.Senior);
jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    user: mockUser,
  })),
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

describe('Dashboard Flow', () => {
  const mockRefetchEntries = jest.fn().mockResolvedValue(undefined);
  const mockRefetchStats = jest.fn().mockResolvedValue(undefined);

  function setupMocks(
    entries = [createMockEntry()],
    stats = createMockStats(),
    isLoading = false,
  ) {
    (useEntriesHooks.useUserEntries as jest.Mock).mockReturnValue({
      data: isLoading ? undefined : entries,
      isLoading,
      refetch: mockRefetchEntries,
    });

    (useEntriesHooks.useUserStats as jest.Mock).mockReturnValue({
      data: isLoading ? undefined : stats,
      isLoading,
      refetch: mockRefetchStats,
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = createMockUser(UserRole.Senior);
  });

  describe('TEST GROUP 1: Stats display', () => {
    test('1a: renders Total stat card with correct count', async () => {
      setupMocks([], createMockStats({ total: 10 }));
      const { getByText } = await renderWithProviders(<DashboardScreen />);
      expect(getByText('Total')).toBeTruthy();
      expect(getByText('10')).toBeTruthy();
    });

    test('1b: renders Approved stat card with correct count', async () => {
      setupMocks([], createMockStats({ approved: 6 }));
      const { getByText } = await renderWithProviders(<DashboardScreen />);
      expect(getByText('Approved')).toBeTruthy();
      expect(getByText('6')).toBeTruthy();
    });

    test('1c: renders Pending stat card with correct count', async () => {
      setupMocks([], createMockStats({ pending: 3 }));
      const { getByText } = await renderWithProviders(<DashboardScreen />);
      expect(getByText('Pending')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();
    });

    test('1d: renders Rejected stat card with correct count', async () => {
      setupMocks([], createMockStats({ rejected: 1 }));
      const { getByText } = await renderWithProviders(<DashboardScreen />);
      expect(getByText('Rejected')).toBeTruthy();
      expect(getByText('1')).toBeTruthy();
    });

    test('1e: stat counts come from useUserStats hook', async () => {
      setupMocks([], createMockStats({ total: 42 }));
      await renderWithProviders(<DashboardScreen />);
      expect(useEntriesHooks.useUserStats).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('TEST GROUP 2: Entry list', () => {
    test('2a: renders user entries from useUserEntries', async () => {
      const entry1 = createMockEntry({ id: 'e1', title: 'Senior Project 1' });
      const entry2 = createMockEntry({ id: 'e2', title: 'Senior Project 2' });
      setupMocks([entry1, entry2]);

      const { getByText } = await renderWithProviders(<DashboardScreen />);
      expect(getByText('Senior Project 1')).toBeTruthy();
      expect(getByText('Senior Project 2')).toBeTruthy();
    });

    test('2b: each entry shows StatusBadge', async () => {
      const pendingEntry = createMockEntry({
        id: 'e1',
        title: 'Pending Knowledge',
        status: EntryStatus.Pending,
      });
      setupMocks([pendingEntry]);

      const { getByText } = await renderWithProviders(<DashboardScreen />);
      expect(getByText('PENDING')).toBeTruthy();
    });

    test('2c: pending entry shows Pending status badge text', async () => {
      const pending = createMockEntry({ status: EntryStatus.Pending });
      setupMocks([pending]);

      const { getByText } = await renderWithProviders(<DashboardScreen />);
      expect(getByText('PENDING')).toBeTruthy();
    });

    test('2d: approved entry shows Approved status badge text', async () => {
      const approved = createMockEntry({ status: EntryStatus.Approved });
      setupMocks([approved]);

      const { getByText } = await renderWithProviders(<DashboardScreen />);
      expect(getByText('APPROVED')).toBeTruthy();
    });

    test('2e: rejected entry shows Rejected status badge text', async () => {
      const rejected = createMockEntry({ status: EntryStatus.Rejected });
      setupMocks([rejected]);

      const { getByText } = await renderWithProviders(<DashboardScreen />);
      expect(getByText('REJECTED')).toBeTruthy();
    });
  });

  describe('TEST GROUP 3: Empty states', () => {
    test('3a: empty state shown when no entries', async () => {
      setupMocks([]);
      const { getByText } = await renderWithProviders(<DashboardScreen />);
      expect(getByText('No entries yet')).toBeTruthy();
    });

    test('3b: senior sees "Submit Your First Entry" button', async () => {
      mockUser = createMockUser(UserRole.Senior);
      setupMocks([]);

      const { getByText } = await renderWithProviders(<DashboardScreen />);
      expect(getByText('Submit Your First Entry')).toBeTruthy();
    });

    test('3c: student sees browse message', async () => {
      mockUser = createMockUser(UserRole.Student);
      setupMocks([]);

      const { getByText } = await renderWithProviders(<DashboardScreen />);
      expect(
        getByText(/Browse knowledge from graduating seniors/),
      ).toBeTruthy();
    });
  });

  describe('TEST GROUP 4: FAB behavior', () => {
    test('4a: FAB visible for senior role', async () => {
      mockUser = createMockUser(UserRole.Senior);
      setupMocks([]);

      const { getByTestId } = await renderWithProviders(<DashboardScreen />);
      expect(getByTestId('dashboard-fab-button')).toBeTruthy();
    });

    test('4b: FAB not visible for student role', async () => {
      mockUser = createMockUser(UserRole.Student);
      setupMocks([]);

      const { queryByTestId } = await renderWithProviders(<DashboardScreen />);
      expect(queryByTestId('dashboard-fab-button')).toBeNull();
    });

    test('4c: FAB visible for faculty role', async () => {
      mockUser = createMockUser(UserRole.Faculty);
      setupMocks([]);

      const { getByTestId } = await renderWithProviders(<DashboardScreen />);
      expect(getByTestId('dashboard-fab-button')).toBeTruthy();
    });

    test('4d: tapping FAB navigates to SubmitStep1Type', async () => {
      mockUser = createMockUser(UserRole.Senior);
      setupMocks([]);

      const { getByTestId } = await renderWithProviders(<DashboardScreen />);
      fireEvent.press(getByTestId('dashboard-fab-button'));

      expect(mockNavigate).toHaveBeenCalledWith('SubmitTab', {
        screen: 'SubmitStep1Type',
      });
    });
  });
});

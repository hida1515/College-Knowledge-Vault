/**
 * Account Deletion Unit Tests (Google Play Policy Compliance)
 * College Knowledge Vault
 */

import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { deleteUserAccount } from '../../src/core/services/accountDeletionService';
import { supabase } from '../../src/core/services/supabase';
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
      addListener: jest.fn(() => jest.fn()),
    }),
  };
});

jest.mock('../../src/core/services/supabase', () => {
  const mockRpc = jest.fn();
  const mockFrom = jest.fn();
  return {
    supabase: {
      rpc: mockRpc,
      from: mockFrom,
    },
  };
});

jest.mock('../../src/core/services/profileService', () => ({
  getUserUpvoteCount: jest.fn().mockResolvedValue(12),
  getFacultyModerationStats: jest.fn().mockResolvedValue({}),
  getCollegeStats: jest.fn().mockResolvedValue({}),
  getPlatformStats: jest.fn().mockResolvedValue({}),
  cancelFacultyRequest: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/core/services/entryService', () => ({
  getUserEntries: jest.fn().mockResolvedValue([]),
}));

const mockUser = createMockUser(UserRole.Student, {
  id: 'usr-delete-1',
  displayName: 'Student Deletable',
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

describe('Account Deletion Flow', () => {
  const mockRpc = supabase.rpc as jest.Mock;
  const mockFrom = supabase.from as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthStoreState = mockAuthStoreReturn(mockUser);
  });

  describe('Service: deleteUserAccount()', () => {
    test('test 1e: deleteUserAccount calls supabase.rpc with correct user_id', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      await deleteUserAccount('usr-delete-1');

      expect(mockRpc).toHaveBeenCalledWith('delete_user_account', {
        user_id: 'usr-delete-1',
      });
      expect(mockAuthStoreState.reset).toHaveBeenCalled();
    });

    test('test 1a: fallback anonymizes user data if RPC fails', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC not found' } });
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return { update: mockUpdate };
        }
        return { delete: mockDelete, update: mockUpdate };
      });

      await deleteUserAccount('usr-delete-1');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          display_name: 'Deleted User',
          email: expect.stringContaining('deleted-usr-delete-1'),
          avatar_url: null,
          fcm_token: null,
        }),
      );
    });

    test('test 1b: fallback deletes bookmarks', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC not found' } });
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'bookmarks') {
          return { delete: mockDelete };
        }
        return {
          delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
          update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
        };
      });

      await deleteUserAccount('usr-delete-1');

      expect(mockFrom).toHaveBeenCalledWith('bookmarks');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('user_id', 'usr-delete-1');
    });

    test('test 1c: fallback deletes upvotes', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC not found' } });
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'entry_upvotes') {
          return { delete: mockDelete };
        }
        return {
          delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
          update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
        };
      });

      await deleteUserAccount('usr-delete-1');

      expect(mockFrom).toHaveBeenCalledWith('entry_upvotes');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('user_id', 'usr-delete-1');
    });

    test('test 1d: fallback soft-deletes authored entries', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC not found' } });
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'entries') {
          return { update: mockUpdate };
        }
        return {
          delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
          update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
        };
      });

      await deleteUserAccount('usr-delete-1');

      expect(mockFrom).toHaveBeenCalledWith('entries');
      expect(mockUpdate).toHaveBeenCalledWith({ is_deleted: true });
      expect(mockEq).toHaveBeenCalledWith('author_id', 'usr-delete-1');
    });
  });

  describe('UI: ProfileScreen Deletion Flow', () => {
    test('test 1f: confirmation dialog shown before deletion', async () => {
      const { getByTestId, queryByTestId, getByText } = await renderWithProviders(
        React.createElement(ProfileScreen),
      );

      // Initially modals are not visible
      expect(queryByTestId('modal-delete-step1')).toBeNull();

      // Tap Delete Account
      await act(async () => {
        fireEvent.press(getByTestId('btn-delete-account'));
      });

      await waitFor(() => {
        expect(getByTestId('modal-delete-step1').props.visible).toBe(true);
        expect(getByText('Delete Account?')).toBeTruthy();
        expect(
          getByText(/Your submitted knowledge entries will remain in the vault anonymously/),
        ).toBeTruthy();
      });
    });

    test('test 1g: DELETE text required for final confirmation', async () => {
      const { getByTestId } = await renderWithProviders(React.createElement(ProfileScreen));

      // Open Step 1
      await act(async () => {
        fireEvent.press(getByTestId('btn-delete-account'));
      });

      // Continue to Step 2
      await act(async () => {
        fireEvent.press(getByTestId('btn-continue-delete-step1'));
      });

      await waitFor(() => {
        expect(getByTestId('modal-delete-step2').props.visible).toBe(true);
      });

      const confirmBtn = getByTestId('btn-confirm-delete-account');
      expect(confirmBtn.props.accessibilityState?.disabled).toBe(true);

      // Type incorrect text
      await act(async () => {
        fireEvent.changeText(getByTestId('input-confirm-delete'), 'del');
      });
      expect(confirmBtn.props.accessibilityState?.disabled).toBe(true);

      // Type DELETE
      await act(async () => {
        fireEvent.changeText(getByTestId('input-confirm-delete'), 'DELETE');
      });
      expect(confirmBtn.props.accessibilityState?.disabled).toBe(false);
    });

    test('test 1h: navigation to Landing after deletion', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      const { getByTestId } = await renderWithProviders(React.createElement(ProfileScreen));

      // Open Step 1
      await act(async () => {
        fireEvent.press(getByTestId('btn-delete-account'));
      });

      // Continue to Step 2
      await act(async () => {
        fireEvent.press(getByTestId('btn-continue-delete-step1'));
      });

      // Type DELETE
      await act(async () => {
        fireEvent.changeText(getByTestId('input-confirm-delete'), 'DELETE');
      });

      // Confirm Delete
      await act(async () => {
        fireEvent.press(getByTestId('btn-confirm-delete-account'));
      });

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith('delete_user_account', {
          user_id: 'usr-delete-1',
        });
        expect(mockReset).toHaveBeenCalledWith({
          index: 0,
          routes: [{ name: 'Landing' }],
        });
      });
    });
  });
});

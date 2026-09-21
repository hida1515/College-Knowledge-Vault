/**
 * SuperAdminScreen Unit Tests
 * College Knowledge Vault
 */

import React from 'react';
import { fireEvent, waitFor, cleanup } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SuperAdminScreen from '../../src/features/superAdmin/screens/SuperAdminScreen';
import { renderWithProviders, mockAuthStoreReturn, createMockUser } from '../utils/testUtils';
import { UserRole } from '../../src/core/types/user.types';
import * as collegeService from '../../src/core/services/collegeService';
import * as profileService from '../../src/core/services/profileService';

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

const mockSupabaseFrom = jest.fn();
jest.mock('../../src/core/services/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  },
}));

// ── Helper: configure all mock return values ──
function setupMocks() {
  const mockedCollegeService = collegeService as jest.Mocked<typeof collegeService>;
  const mockedProfileService = profileService as jest.Mocked<typeof profileService>;

  mockedCollegeService.getCollegeAdminRequests.mockResolvedValue([
    {
      id: 'req-admin-1',
      userId: 'user-admin-candidate',
      userDisplayName: 'Prof. Ramesh',
      userEmail: 'ramesh@newcollege.edu',
      collegeId: null as any, // New college!
      collegeName: 'National Institute of Tech',
      collegeCity: 'Calicut',
      collegeState: 'Kerala',
      designation: 'Principal',
      employeeId: 'PRIN001',
      reason: 'Setting up vault archive for campus',
      status: 'pending' as const,
      createdAt: '2026-09-11T12:00:00Z',
      reviewedBy: null as any,
      reviewNote: null as any,
      reviewedAt: null as any,
    },
  ]);

  mockedCollegeService.approveCollegeAdminRequest.mockResolvedValue(undefined);
  mockedCollegeService.rejectCollegeAdminRequest.mockResolvedValue(undefined);

  mockedCollegeService.getAllCollegesForAdmin.mockResolvedValue([
    {
      id: 'col-1',
      name: 'IIT Bombay',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      isActive: true,
    },
    {
      id: 'col-2',
      name: 'NIT Calicut',
      city: 'Kozhikode',
      state: 'Kerala',
      country: 'India',
      isActive: false,
    },
  ] as any);

  mockedCollegeService.createCollege.mockResolvedValue({
    id: 'col-new',
    name: 'New College',
    city: 'Pune',
    state: 'MH',
    isActive: true,
  } as any);

  mockedCollegeService.toggleCollegeActiveStatus.mockResolvedValue(undefined);

  mockedProfileService.getPlatformStats.mockResolvedValue({
    totalColleges: 20,
    totalUsers: 1500,
    totalEntries: 3200,
    pendingAdminRequests: 1,
  });

  // Supabase direct queries
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === 'entries') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 'e-platform-1',
                    title: 'Platform Architecture Intro',
                    created_at: '2026-09-12T10:00:00Z',
                    college_id: 'col-1',
                    users: { display_name: 'Lead Senior' },
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    if (table === 'users') {
      return {
        select: jest.fn().mockResolvedValue({
          data: [{ college_id: 'col-1' }, { college_id: 'col-1' }],
          error: null,
        }),
      };
    }
    return {};
  });
}

describe('SuperAdminScreen Component', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
    alertSpy = jest.spyOn(Alert, 'alert');
    mockAuthStoreState = mockAuthStoreReturn(mockSuperAdminUser);
  });

  afterEach(() => {
    alertSpy.mockRestore();
    cleanup();
  });

  describe('TEST GROUP 1: Tab 1 - College Admin Requests', () => {
    test('renders requests with NEW COLLEGE badge and approves on confirm', async () => {
      const { getByText, getByTestId } = await renderWithProviders(<SuperAdminScreen />);

      expect(getByText('⚡ Super Admin Panel')).toBeTruthy();
      expect(getByText('Prof. Ramesh')).toBeTruthy();
      expect(getByTestId('badge-new-college-req-admin-1')).toBeTruthy();

      // Press Approve Admin
      fireEvent.press(getByTestId('approve-admin-req-admin-1'));
      expect(alertSpy).toHaveBeenCalledWith(
        'Approve College Admin',
        expect.stringContaining('National Institute of Tech'),
        expect.any(Array),
      );

      const confirmBtn = alertSpy.mock.calls[0][2]?.find((b: any) => b.text === 'Approve');
      await confirmBtn?.onPress?.();

      await waitFor(() => {
        expect(collegeService.approveCollegeAdminRequest).toHaveBeenCalled();
      });
    });
  });

  describe('TEST GROUP 2: Tab 2 - Colleges Management', () => {
    test('switches to Colleges tab and toggles active status', async () => {
      const { getByTestId, getByText } = await renderWithProviders(<SuperAdminScreen />);

      fireEvent.press(getByTestId('tab-colleges'));

      await waitFor(() => {
        expect(getByText('🏫 IIT Bombay')).toBeTruthy();
        expect(getByText('🏫 NIT Calicut')).toBeTruthy();
      });

      // Toggle status for active college
      fireEvent.press(getByTestId('toggle-college-status-col-1'));
      expect(alertSpy).toHaveBeenCalledWith(
        'Deactivate College',
        expect.stringContaining('IIT Bombay'),
        expect.any(Array),
      );

      const confirmBtn = alertSpy.mock.calls[0][2]?.find((b: any) => b.text === 'Confirm');
      await confirmBtn?.onPress?.();

      await waitFor(() => {
        expect(collegeService.toggleCollegeActiveStatus).toHaveBeenCalledWith('col-1', false);
      });
    });
  });

  describe('TEST GROUP 3: Tab 3 - Platform Stats', () => {
    test('switches to Stats tab and renders platform global overview', async () => {
      const { getByTestId, getByText } = await renderWithProviders(<SuperAdminScreen />);

      await waitFor(() => {
        expect(getByTestId('tab-stats')).toBeTruthy();
      });

      fireEvent.press(getByTestId('tab-stats'));

      await waitFor(() => {
        expect(getByText('Platform Multi-Tenant Overview')).toBeTruthy();
        expect(getByTestId('stats-grid')).toBeTruthy();
        expect(getByTestId('stat-box-colleges')).toBeTruthy();
        expect(getByTestId('stat-box-users')).toBeTruthy();
        expect(getByTestId('stat-box-entries')).toBeTruthy();
        expect(getByTestId('stat-box-requests')).toBeTruthy();
      });
    });
  });

  describe('TEST GROUP 4: Tab 2 - Add College Modal', () => {
    test('opens Add College modal and displays form fields', async () => {
      const { getByTestId, unmount } = await renderWithProviders(<SuperAdminScreen />);
      fireEvent.press(getByTestId('tab-colleges'));

      await waitFor(() => {
        expect(getByTestId('button-add-college')).toBeTruthy();
      });

      fireEvent.press(getByTestId('button-add-college'));

      await waitFor(() => {
        expect(getByTestId('modal-add-college')).toBeTruthy();
        expect(getByTestId('input-new-college-name')).toBeTruthy();
        expect(getByTestId('input-new-college-city')).toBeTruthy();
        expect(getByTestId('input-new-college-state')).toBeTruthy();
        expect(getByTestId('button-submit-create-college')).toBeTruthy();
        expect(getByTestId('button-cancel-add-college')).toBeTruthy();
      });

      fireEvent.changeText(getByTestId('input-new-college-name'), 'Pune Institute of Tech');
      fireEvent.changeText(getByTestId('input-new-college-city'), 'Pune');
      fireEvent.changeText(getByTestId('input-new-college-state'), 'Maharashtra');

      await waitFor(() => {
        expect(getByTestId('input-new-college-name').props.value).toBe('Pune Institute of Tech');
        expect(getByTestId('input-new-college-city').props.value).toBe('Pune');
        expect(getByTestId('input-new-college-state').props.value).toBe('Maharashtra');
      });

      unmount();
    });
  });
});


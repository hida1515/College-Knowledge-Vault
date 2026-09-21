/**
 * RoleSelectionScreen Invite Code Verification System Tests
 * College Knowledge Vault
 */

import React from 'react';
import { fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';
import RoleSelectionScreen from '../../src/features/auth/screens/RoleSelectionScreen';
import { UserRole } from '../../src/core/types/user.types';
import { renderWithProviders, createMockUser, mockAuthStoreReturn } from '../utils/testUtils';
import * as inviteCodeService from '../../src/core/services/inviteCodeService';

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
      dispatch: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

let mockAuthStoreState: any;
jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: (selector?: (state: any) => any) => {
    if (selector) return selector(mockAuthStoreState);
    return mockAuthStoreState;
  },
}));

jest.mock('../../src/core/services/inviteCodeService');
jest.mock('../../src/core/services/collegeService');

describe('RoleSelectionScreen — Invite Code Verification', () => {
  const mockCollege = {
    id: 'col-sngce',
    name: 'ABC Engineering College',
    city: 'Kochi',
    state: 'Kerala',
    country: 'India',
    isActive: true,
    studentInviteCode: 'SNGCE-2024-XK7P',
    facultyInviteCode: 'SNGCE-FAC-7M2Q',
    adminInviteCode: 'SNGCE-ADM-9R3T',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthStoreState = mockAuthStoreReturn(
      createMockUser(UserRole.Student, {
        id: 'new-user-1',
        displayName: 'Alice Student',
        college: '',
        collegeName: '',
        collegeId: null,
        joinedViaCode: null,
      }),
      { isNewUser: true },
    );
  });

  afterEach(async () => {
    cleanup();
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
  });

  describe('TEST GROUP 1: Code entry step', () => {
    test('1a: invite code input renders', async () => {
      const { getByTestId } = await renderWithProviders(<RoleSelectionScreen />);
      expect(getByTestId('input-invite-code')).toBeTruthy();
    });

    test('1b: input auto-converts to uppercase', async () => {
      const { getByTestId } = await renderWithProviders(<RoleSelectionScreen />);
      await act(async () => {
        fireEvent.changeText(getByTestId('input-invite-code'), 'sngce-2024-xk7p');
      });
      expect(getByTestId('input-invite-code').props.value).toBe('SNGCE-2024-XK7P');
    });

    test('1c: Verify button disabled when empty', async () => {
      const { getByTestId } = await renderWithProviders(<RoleSelectionScreen />);
      const verifyBtn = getByTestId('btn-verify-code');
      expect(verifyBtn.props.accessibilityState?.disabled).toBe(true);
    });

    test('1d: Verify button shows loading during validation', async () => {
      let resolveValidation!: (value: any) => void;
      const slowPromise = new Promise((resolve) => {
        resolveValidation = resolve;
      });
      (inviteCodeService.validateInviteCode as jest.Mock).mockImplementation(() => slowPromise);

      const { getByTestId } = await renderWithProviders(<RoleSelectionScreen />);
      await act(async () => {
        fireEvent.changeText(getByTestId('input-invite-code'), 'SNGCE-2024-XK7P');
      });

      const verifyBtn = getByTestId('btn-verify-code');
      await act(async () => {
        fireEvent.press(verifyBtn);
      });

      // While validating, button should be disabled
      expect(getByTestId('btn-verify-code').props.accessibilityState?.disabled).toBe(true);

      await act(async () => {
        resolveValidation({
          isValid: true,
          college: mockCollege,
          codeType: 'student',
          errorMessage: null,
        });
      });
    });

    test('1e: success shows college name in green', async () => {
      (inviteCodeService.validateInviteCode as jest.Mock).mockResolvedValue({
        isValid: true,
        college: mockCollege,
        codeType: 'student',
        errorMessage: null,
      });

      const { getByTestId, getByText } = await renderWithProviders(<RoleSelectionScreen />);
      await act(async () => {
        fireEvent.changeText(getByTestId('input-invite-code'), 'SNGCE-2024-XK7P');
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-verify-code'));
      });

      await waitFor(() => {
        expect(getByText('ABC Engineering College')).toBeTruthy();
        expect(getByTestId('college-verified-badge')).toBeTruthy();
      });
    });

    test('1f: success shows code type badge', async () => {
      (inviteCodeService.validateInviteCode as jest.Mock).mockResolvedValue({
        isValid: true,
        college: mockCollege,
        codeType: 'student',
        errorMessage: null,
      });

      const { getByTestId, getByText } = await renderWithProviders(<RoleSelectionScreen />);
      await act(async () => {
        fireEvent.changeText(getByTestId('input-invite-code'), 'SNGCE-2024-XK7P');
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-verify-code'));
      });

      await waitFor(() => {
        expect(getByTestId('code-type-badge')).toBeTruthy();
        expect(getByText('Student / Senior Access')).toBeTruthy();
      });
    });

    test('1g: failure shows red error message', async () => {
      (inviteCodeService.validateInviteCode as jest.Mock).mockResolvedValue({
        isValid: false,
        college: null,
        codeType: null,
        errorMessage: 'Invalid code. Please check with your College Admin.',
      });

      const { getByTestId, getByText } = await renderWithProviders(<RoleSelectionScreen />);
      await act(async () => {
        fireEvent.changeText(getByTestId('input-invite-code'), 'WRONG-CODE');
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-verify-code'));
      });

      await waitFor(() => {
        expect(getByText('Invalid code. Please check with your College Admin.')).toBeTruthy();
        expect(getByTestId('error-invite-code')).toBeTruthy();
      });
    });

    test('1h: failure clears input for retry', async () => {
      (inviteCodeService.validateInviteCode as jest.Mock).mockResolvedValue({
        isValid: false,
        college: null,
        codeType: null,
        errorMessage: 'Invalid code. Please check with your College Admin.',
      });

      const { getByTestId } = await renderWithProviders(<RoleSelectionScreen />);
      await act(async () => {
        fireEvent.changeText(getByTestId('input-invite-code'), 'WRONG-CODE');
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-verify-code'));
      });

      await waitFor(() => {
        expect(getByTestId('input-invite-code').props.value).toBe('');
      });
    });
  });

  describe('TEST GROUP 2: Code type routing', () => {
    test('2a: student code → no faculty form in step 3', async () => {
      (inviteCodeService.validateInviteCode as jest.Mock).mockResolvedValue({
        isValid: true,
        college: mockCollege,
        codeType: 'student',
        errorMessage: null,
      });

      const { getByTestId, queryByTestId } = await renderWithProviders(<RoleSelectionScreen />);
      await act(async () => {
        fireEvent.changeText(getByTestId('input-invite-code'), 'SNGCE-2024-XK7P');
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-verify-code'));
      });

      await waitFor(() => {
        expect(getByTestId('college-verified-badge')).toBeTruthy();
        // Faculty form inputs and role switcher are NOT shown
        expect(queryByTestId('input-request-reason')).toBeNull();
        expect(queryByTestId('card-role-faculty')).toBeNull();
      });
    });

    test('2b: faculty code → faculty form shown in step 3', async () => {
      (inviteCodeService.validateInviteCode as jest.Mock).mockResolvedValue({
        isValid: true,
        college: mockCollege,
        codeType: 'faculty',
        errorMessage: null,
      });

      const { getByTestId, getByText } = await renderWithProviders(<RoleSelectionScreen />);
      await act(async () => {
        fireEvent.changeText(getByTestId('input-invite-code'), 'SNGCE-FAC-7M2Q');
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-verify-code'));
      });

      await waitFor(() => {
        expect(getByText('Faculty Access (pending verification)')).toBeTruthy();
        expect(getByTestId('input-designation')).toBeTruthy();
        expect(getByTestId('input-request-reason')).toBeTruthy();
        expect(getByText(/Your request will be reviewed by your College Admin/)).toBeTruthy();
      });
    });

    test('2c: admin code cannot be redeemed (college_admin invite codes removed)', async () => {
      (inviteCodeService.validateInviteCode as jest.Mock).mockResolvedValue({
        isValid: false,
        college: null,
        codeType: null,
        errorMessage: 'Invalid invite code. Please check with your College Admin.',
      });

      const { getByTestId, getByText } = await renderWithProviders(<RoleSelectionScreen />);
      await act(async () => {
        fireEvent.changeText(getByTestId('input-invite-code'), 'SNGCE-ADM-9R3T');
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-verify-code'));
      });

      await waitFor(() => {
        expect(getByText('Invalid invite code. Please check with your College Admin.')).toBeTruthy();
      });
    });

    test('2d: college locked after code verification', async () => {
      (inviteCodeService.validateInviteCode as jest.Mock).mockResolvedValue({
        isValid: true,
        college: mockCollege,
        codeType: 'student',
        errorMessage: null,
      });

      const { getByTestId, queryByTestId, getByText } = await renderWithProviders(
        <RoleSelectionScreen />,
      );
      await act(async () => {
        fireEvent.changeText(getByTestId('input-invite-code'), 'SNGCE-2024-XK7P');
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-verify-code'));
      });

      await waitFor(() => {
        expect(getByTestId('college-verified-badge')).toBeTruthy();
        expect(getByText(/College Verified & Locked/)).toBeTruthy();
        // Code input is replaced with locked card
        expect(queryByTestId('input-invite-code')).toBeNull();
      });
    });
  });

  describe('TEST GROUP 3: Existing user re-verification', () => {
    beforeEach(() => {
      // User registered before invite code system: collegeId is set, but joinedViaCode is null, isNewUser is false
      mockAuthStoreState = mockAuthStoreReturn(
        createMockUser(UserRole.Student, {
          id: 'existing-user-99',
          displayName: 'Bob Senior',
          college: 'ABC Engineering College',
          collegeId: 'col-sngce',
          joinedViaCode: null,
        }),
        { isNewUser: false },
      );
    });

    test('3a: user with null joined_via_code sees verify prompt', async () => {
      const { getByTestId, getByText } = await renderWithProviders(<RoleSelectionScreen />);
      expect(getByTestId('prompt-reverify-college')).toBeTruthy();
      expect(getByText('Verify Your College')).toBeTruthy();
      expect(
        getByText(/We've added a verification system. Please enter your college invite code/),
      ).toBeTruthy();
    });

    test('3b: entering matching college code updates record', async () => {
      (inviteCodeService.validateInviteCode as jest.Mock).mockResolvedValue({
        isValid: true,
        college: mockCollege,
        codeType: 'student',
        errorMessage: null,
      });
      (inviteCodeService.recordUserCode as jest.Mock).mockResolvedValue(undefined);

      const { getByTestId } = await renderWithProviders(<RoleSelectionScreen />);
      await act(async () => {
        fireEvent.changeText(getByTestId('input-invite-code'), 'SNGCE-2024-XK7P');
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-verify-code'));
      });

      await waitFor(() => {
        expect(inviteCodeService.recordUserCode).toHaveBeenCalledWith(
          'existing-user-99',
          'SNGCE-2024-XK7P',
          'student',
        );
        expect(mockReset).toHaveBeenCalledWith({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      });
    });

    test('3c: entering wrong college code shows warning', async () => {
      const otherCollege = {
        ...mockCollege,
        id: 'different-college-id',
        name: 'XYZ Institute of Technology',
      };
      (inviteCodeService.validateInviteCode as jest.Mock).mockResolvedValue({
        isValid: true,
        college: otherCollege,
        codeType: 'student',
        errorMessage: null,
      });

      const { getByTestId, getByText } = await renderWithProviders(<RoleSelectionScreen />);
      await act(async () => {
        fireEvent.changeText(getByTestId('input-invite-code'), 'XYZ-2024-CODE');
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-verify-code'));
      });

      await waitFor(() => {
        expect(getByTestId('warning-wrong-college')).toBeTruthy();
        expect(
          getByText(/This code belongs to a different college. Please enter your college invite code/),
        ).toBeTruthy();
      });
    });
  });
});

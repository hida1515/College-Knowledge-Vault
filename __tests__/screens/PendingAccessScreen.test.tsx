import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import PendingAccessScreen from '../../src/features/auth/screens/PendingAccessScreen';
import { renderWithProviders, mockAuthStoreReturn, createMockUser } from '../utils/testUtils';
import { UserRole } from '../../src/core/types/user.types';

const mockReset = jest.fn();
const mockNavigate = jest.fn();
let mockRouteParams: any = {
  requestType: 'faculty',
  collegeName: 'IIT Bombay',
  designation: 'Associate Professor',
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

let mockAuthStoreState = mockAuthStoreReturn(
  createMockUser(UserRole.Faculty, {
    college: 'IIT Bombay',
    department: 'Computer Science',
  }),
  { isNewUser: true }
);

jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: (...args: unknown[]) => {
    const selector = args[0] as ((mockState: unknown) => unknown) | undefined;
    if (typeof selector === 'function') {
      return selector(mockAuthStoreState);
    }
    return mockAuthStoreState;
  },
}));

describe('PendingAccessScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = {
      requestType: 'faculty',
      collegeName: 'IIT Bombay',
      designation: 'Associate Professor',
      department: 'Computer Science',
    };
    mockAuthStoreState = mockAuthStoreReturn(
      createMockUser(UserRole.Faculty, {
        college: 'IIT Bombay',
        department: 'Computer Science',
      }),
      { isNewUser: true }
    );
  });

  describe('TEST GROUP 1: Rendering', () => {
    test('1a: renders request submitted title and faculty details', async () => {
      const { getByText } = await renderWithProviders(<PendingAccessScreen />);

      expect(getByText('Request Submitted')).toBeTruthy();
      expect(getByText('Pending Review')).toBeTruthy();
      expect(getByText('Faculty Verification')).toBeTruthy();
      expect(getByText('IIT Bombay')).toBeTruthy();
      expect(getByText('Associate Professor')).toBeTruthy();
      expect(getByText('Computer Science')).toBeTruthy();
    });

    test('1b: renders college admin request details', async () => {
      mockRouteParams = {
        requestType: 'college_admin',
        collegeName: 'BITS Pilani',
        designation: 'Head of Department',
      };

      const { getByText } = await renderWithProviders(<PendingAccessScreen />);

      expect(getByText('College Admin Access')).toBeTruthy();
      expect(getByText('BITS Pilani')).toBeTruthy();
      expect(getByText('Head of Department')).toBeTruthy();
    });
  });

  describe('TEST GROUP 2: Actions', () => {
    test('2a: Browse Vault as Student resets to MainTabs', async () => {
      const { getByTestId } = await renderWithProviders(<PendingAccessScreen />);

      fireEvent.press(getByTestId('btn-browse-student'));

      expect(mockAuthStoreState.setIsNewUser).toHaveBeenCalledWith(false);
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    });

    test('2b: Sign Out calls signOut and resets to Landing', async () => {
      const { getByTestId } = await renderWithProviders(<PendingAccessScreen />);

      fireEvent.press(getByTestId('btn-sign-out'));

      expect(mockAuthStoreState.signOut).toHaveBeenCalled();
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
    });
  });
});

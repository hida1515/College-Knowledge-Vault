import React from 'react';
import { render, act } from '@testing-library/react-native';
import App from '../../src/app/App';
import { linking } from '../../src/app/Navigation';
import NetInfo from '@react-native-community/netinfo';
import { UserRole } from '../../src/core/types/user.types';
import { createMockUser, mockAuthStoreReturn } from '../utils/testUtils';

const mockUser = createMockUser(UserRole.Student);
let mockState = {
  ...mockAuthStoreReturn(mockUser),
  initializeAuth: jest.fn(),
  reset: jest.fn(),
};

jest.mock('../../src/core/store/authStore', () => {
  const fn = (selector?: (state: any) => any) => {
    return selector ? selector(mockState) : mockState;
  };
  fn.getState = () => mockState;
  return { useAuthStore: fn };
});

describe('Offline State & Deep Linking (FIX 11 & 12)', () => {
  it('should define valid deep linking configuration for EntryDetail and Profile', () => {
    expect(linking.prefixes).toContain('knowledge-vault://');
    expect(linking.config.screens.EntryDetail).toBe('entry/:entryId');
    expect(linking.config.screens.MainTabs.screens.ProfileTab.screens.Profile).toBe('profile/:userId');
  });

  it('should render offline banner when device goes offline', async () => {
    let listenerCallback: any = null;
    (NetInfo.addEventListener as jest.Mock).mockImplementation((cb) => {
      listenerCallback = cb;
      return jest.fn();
    });

    const { queryByTestId, findByText, getByTestId } = await render(<App />);

    // Initially online
    expect(queryByTestId('offline-banner')).toBeNull();

    // Trigger offline
    await act(async () => {
      if (listenerCallback) {
        listenerCallback({ isConnected: false, isInternetReachable: false });
      }
    });

    const banner = await findByText(/You're offline/i);
    expect(banner).toBeTruthy();
    expect(getByTestId('offline-banner')).toBeTruthy();
  });
});

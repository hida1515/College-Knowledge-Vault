/**
 * Onboarding Flow Tests
 * College Knowledge Vault
 */

import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from '../../src/features/onboarding/screens/OnboardingScreen';
import { renderWithProviders } from '../utils/testUtils';

// Mock navigation
const mockReset = jest.fn();
const mockNavigate = jest.fn();
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
  };
});

// Mock authStore
const mockSetHasOnboarded = jest.fn();
jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: () => ({
    setHasOnboarded: mockSetHasOnboarded,
  }),
}));

// Mock MMKV storage
jest.mock('../../src/core/services/mmkvStorage', () => ({
  appStorage: {
    set: jest.fn(),
    getString: jest.fn(),
    getBoolean: jest.fn(() => false),
    delete: jest.fn(),
  },
}));

describe('Onboarding Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  describe('TEST GROUP 1: First launch', () => {
    test('1a: OnboardingScreen renders page 1 on first launch', async () => {
      const { getByText } = await renderWithProviders(<OnboardingScreen />);
      await waitFor(() => {
        expect(getByText("Don't Let Knowledge Graduate")).toBeTruthy();
      });
    });

    test('1b: page 1 shows correct emoji 🎓 and title', async () => {
      const { getByText } = await renderWithProviders(<OnboardingScreen />);
      await waitFor(() => {
        expect(getByText('🎓')).toBeTruthy();
        expect(getByText("Don't Let Knowledge Graduate")).toBeTruthy();
      });
    });

    test('1c: page 2 content exists in ScrollView', async () => {
      const { getByText } = await renderWithProviders(<OnboardingScreen />);
      await waitFor(() => {
        expect(getByText('📚')).toBeTruthy();
        expect(getByText('Learn From Real Experiences')).toBeTruthy();
      });
    });

    test('1d: page 3 content exists in ScrollView', async () => {
      const { getByText } = await renderWithProviders(<OnboardingScreen />);
      await waitFor(() => {
        expect(getByText('🤝')).toBeTruthy();
        expect(getByText('Share Before You Leave')).toBeTruthy();
      });
    });

    test('1e: Skip button visible on page 1', async () => {
      const { getByText } = await renderWithProviders(<OnboardingScreen />);
      await waitFor(() => {
        expect(getByText('Skip')).toBeTruthy();
      });
    });

    test('1f: Next button visible on page 1', async () => {
      const { getByText } = await renderWithProviders(<OnboardingScreen />);
      await waitFor(() => {
        expect(getByText('Next')).toBeTruthy();
      });
    });
  });

  describe('TEST GROUP 2: Navigation', () => {
    test('2a: tapping Skip calls handleCompleteOnboarding and navigates', async () => {
      const { getByText } = await renderWithProviders(<OnboardingScreen />);

      await act(async () => {
        fireEvent.press(getByText('Skip'));
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@onboarding_complete',
          'true',
        );
        expect(mockSetHasOnboarded).toHaveBeenCalledWith(true);
        expect(mockReset).toHaveBeenCalledWith({
          index: 0,
          routes: [{ name: 'Landing' }],
        });
      });
    });
  });

  describe('TEST GROUP 3: Returning user', () => {
    test('3a: when onboarding_complete=true, auto-navigates to Landing', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

      await renderWithProviders(<OnboardingScreen />);

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalledWith({
          index: 0,
          routes: [{ name: 'Landing' }],
        });
      });
    });
  });
});

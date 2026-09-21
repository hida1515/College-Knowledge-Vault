import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import LandingScreen from '../../src/features/auth/screens/LandingScreen';
import { UserRole } from '../../src/core/types/user.types';
import { renderWithProviders } from '../utils/testUtils';

describe('LandingScreen Component', () => {
  const mockNavigate = jest.fn();
  const mockNavigation = {
    navigate: mockNavigate,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TEST GROUP 1: Rendering', () => {
    test('1a: renders header, branding, and subtitle', async () => {
      const { getByText } = await renderWithProviders(
        <LandingScreen navigation={mockNavigation} />
      );

      expect(getByText('College Knowledge Vault')).toBeTruthy();
      expect(
        getByText('Preserving college knowledge, one batch at a time')
      ).toBeTruthy();
      expect(getByText('Select Your Portal')).toBeTruthy();
    });

    test('1b: renders 3 role cards and Platform Admin link', async () => {
      const { getByTestId, getByText } = await renderWithProviders(
        <LandingScreen navigation={mockNavigation} />
      );

      expect(getByTestId('card-student')).toBeTruthy();
      expect(getByTestId('card-faculty')).toBeTruthy();
      expect(getByTestId('card-college-admin')).toBeTruthy();
      expect(getByTestId('card-super-admin')).toBeTruthy();

      expect(getByText('Student / Senior Login')).toBeTruthy();
      expect(getByText('Faculty Login')).toBeTruthy();
      expect(getByText('College Admin Login')).toBeTruthy();
      expect(getByText('Platform Admin?')).toBeTruthy();
    });
  });

  describe('TEST GROUP 2: Navigation Actions', () => {
    test('2a: pressing Student card navigates to Login with student context', async () => {
      const { getByTestId } = await renderWithProviders(
        <LandingScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByTestId('card-student'));
      expect(mockNavigate).toHaveBeenCalledWith('Login', {
        contextRole: UserRole.Student,
      });
    });

    test('2b: pressing Faculty card navigates to Login with faculty context', async () => {
      const { getByTestId } = await renderWithProviders(
        <LandingScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByTestId('card-faculty'));
      expect(mockNavigate).toHaveBeenCalledWith('Login', {
        contextRole: UserRole.Faculty,
      });
    });

    test('2c: pressing College Admin card navigates to Login with college_admin context', async () => {
      const { getByTestId } = await renderWithProviders(
        <LandingScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByTestId('card-college-admin'));
      expect(mockNavigate).toHaveBeenCalledWith('Login', {
        contextRole: 'college_admin',
      });
    });

    test('2d: pressing Super Admin link navigates to Login with super_admin context', async () => {
      const { getByTestId } = await renderWithProviders(
        <LandingScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByTestId('card-super-admin'));
      expect(mockNavigate).toHaveBeenCalledWith('Login', {
        contextRole: 'super_admin',
      });
    });
  });
});

/**
 * SubjectBrowseScreen Unit & Interaction Tests
 *
 * Validates:
 * 1. Empty state when no approved subjects exist.
 * 2. Grouping subjects by semester and displaying entry counts.
 * 3. Tapping a subject navigates to HomeTab with filter params.
 * 4. Back button navigates back.
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { SubjectBrowseScreen } from '../../src/features/home/screens/SubjectBrowseScreen';
import { supabase } from '../../src/core/services/supabase';
import { renderWithProviders } from '../utils/testUtils';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
  };
});

jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-123', collegeId: 'college-xyz' },
  }),
}));

describe('SubjectBrowseScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders empty state when no subjects are returned', async () => {
    const mockQueryBuilder: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    mockQueryBuilder.eq.mockImplementation((field: string) => {
      if (field === 'college_id') {
        return Promise.resolve({ data: [], error: null });
      }
      return mockQueryBuilder;
    });

    jest.spyOn(supabase, 'from').mockReturnValue(mockQueryBuilder);

    const { getByTestId, getByText } = await renderWithProviders(<SubjectBrowseScreen />);

    await waitFor(() => {
      expect(getByTestId('subjects-empty-state')).toBeTruthy();
      expect(getByText('No subjects recorded yet')).toBeTruthy();
    });
  });

  test('groups and displays subjects by semester', async () => {
    const mockEntries = [
      { subject: 'Operating Systems', semester: 4 },
      { subject: 'Operating Systems', semester: 4 },
      { subject: 'Database Management', semester: 4 },
      { subject: 'Compiler Design', semester: 6 },
    ];

    const mockQueryBuilder: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    mockQueryBuilder.eq.mockImplementation((field: string) => {
      if (field === 'college_id') {
        return Promise.resolve({ data: mockEntries, error: null });
      }
      return mockQueryBuilder;
    });

    jest.spyOn(supabase, 'from').mockReturnValue(mockQueryBuilder);

    const { getByText, getAllByText, getByTestId } = await renderWithProviders(<SubjectBrowseScreen />);

    await waitFor(() => {
      expect(getByTestId('semester-section-4')).toBeTruthy();
      expect(getByTestId('semester-section-6')).toBeTruthy();
      expect(getByText('Operating Systems')).toBeTruthy();
      expect(getByText('2 entries')).toBeTruthy();
      expect(getByText('Compiler Design')).toBeTruthy();
      expect(getAllByText('1 entries').length).toBe(2);
    });
  });

  test('tapping subject card navigates to Home with subject and semester params', async () => {
    const mockEntries = [{ subject: 'Machine Learning', semester: 7 }];

    const mockQueryBuilder: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    mockQueryBuilder.eq.mockImplementation((field: string) => {
      if (field === 'college_id') {
        return Promise.resolve({ data: mockEntries, error: null });
      }
      return mockQueryBuilder;
    });

    jest.spyOn(supabase, 'from').mockReturnValue(mockQueryBuilder);

    const { getByText } = await renderWithProviders(<SubjectBrowseScreen />);

    await waitFor(() => {
      expect(getByText('Machine Learning')).toBeTruthy();
    });

    fireEvent.press(getByText('Machine Learning'));
    expect(mockNavigate).toHaveBeenCalledWith('HomeTab', {
      screen: 'Home',
      params: { subject: 'Machine Learning', semester: 7 },
    });
  });

  test('tapping back button navigates back', async () => {
    const mockQueryBuilder: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    mockQueryBuilder.eq.mockImplementation((field: string) => {
      if (field === 'college_id') {
        return Promise.resolve({ data: [], error: null });
      }
      return mockQueryBuilder;
    });

    jest.spyOn(supabase, 'from').mockReturnValue(mockQueryBuilder);

    const { getByTestId } = await renderWithProviders(<SubjectBrowseScreen />);

    await waitFor(() => {
      expect(getByTestId('button-subjects-back')).toBeTruthy();
    });

    fireEvent.press(getByTestId('button-subjects-back'));
    expect(mockGoBack).toHaveBeenCalled();
  });
});

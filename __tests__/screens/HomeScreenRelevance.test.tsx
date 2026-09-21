/**
 * HomeScreen Relevance & Department Filtering Tests
 *
 * Validates:
 * 1. Tapping relevance toggle activates semester ± 1 filter and passes semesterRange to query hook.
 * 2. Tapping relevance toggle again deactivates it.
 * 3. Tapping "My Department" chip filters entries by user department.
 * 4. Tapping "Subjects" header button navigates to SubjectBrowse.
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../src/features/home/screens/HomeScreen';
import * as useEntriesHook from '../../src/core/hooks/useEntries';
import { renderWithProviders, createMockEntry } from '../utils/testUtils';
import { EntryType } from '../../src/core/types/entry.types';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
    }),
  };
});

jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: () => ({
    user: {
      id: 'user-senior-1',
      displayName: 'Alex Smith',
      department: 'Computer Science',
      semester: 6,
    },
  }),
}));

describe('HomeScreen Relevance & Department Filtering', () => {
  let mockUseApprovedEntries: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApprovedEntries = jest.spyOn(useEntriesHook, 'useApprovedEntries').mockReturnValue({
      data: {
        pages: [
          [
            createMockEntry({
              id: 'entry-1',
              title: 'Operating Systems Virtual Memory',
              type: EntryType.Viva,
              authorDepartment: 'Computer Science',
              semester: 6,
            }),
          ],
        ],
        pageParams: [1],
      },
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isLoading: false,
      refetch: jest.fn(),
    } as any);
  });

  test('tapping relevance toggle triggers semester ± 1 filter range [5, 7]', async () => {
    const { getByTestId } = await renderWithProviders(<HomeScreen />);

    expect(mockUseApprovedEntries).toHaveBeenCalledWith(
      expect.not.objectContaining({ semesterRange: expect.anything() }),
    );

    fireEvent.press(getByTestId('relevance-toggle'));

    await waitFor(() => {
      expect(mockUseApprovedEntries).toHaveBeenCalledWith(
        expect.objectContaining({ semesterRange: [5, 7] }),
      );
    });
  });

  test('tapping relevance toggle a second time removes the semester filter', async () => {
    const { getByTestId } = await renderWithProviders(<HomeScreen />);

    // Activate
    fireEvent.press(getByTestId('relevance-toggle'));
    await waitFor(() => {
      expect(mockUseApprovedEntries).toHaveBeenCalledWith(
        expect.objectContaining({ semesterRange: [5, 7] }),
      );
    });

    // Deactivate
    fireEvent.press(getByTestId('relevance-toggle'));
    await waitFor(() => {
      expect(mockUseApprovedEntries).toHaveBeenLastCalledWith(
        expect.not.objectContaining({ semesterRange: expect.anything() }),
      );
    });
  });

  test('tapping "My Department" chip applies user department filter', async () => {
    const { getByTestId } = await renderWithProviders(<HomeScreen />);

    expect(getByTestId('filter-chip-my-department')).toBeTruthy();
    fireEvent.press(getByTestId('filter-chip-my-department'));

    await waitFor(() => {
      expect(mockUseApprovedEntries).toHaveBeenCalledWith(
        expect.objectContaining({ department: 'Computer Science' }),
      );
    });
  });

  test('tapping browse subjects button navigates to SubjectBrowse', async () => {
    const { getByTestId } = await renderWithProviders(<HomeScreen />);

    expect(getByTestId('button-browse-subjects')).toBeTruthy();
    fireEvent.press(getByTestId('button-browse-subjects'));

    expect(mockNavigate).toHaveBeenCalledWith('SubjectBrowse');
  });
});

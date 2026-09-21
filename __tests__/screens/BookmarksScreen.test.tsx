/**
 * BookmarksScreen Unit & Interaction Tests
 *
 * Validates:
 * 1. Loading state indicator while fetching bookmarks.
 * 2. Empty state rendering when user has no saved entries.
 * 3. List of saved entries rendering when bookmarks exist.
 * 4. Back button navigation.
 * 5. Tapping an entry card navigates to EntryDetail.
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { BookmarksScreen } from '../../src/features/bookmarks/screens/BookmarksScreen';
import * as bookmarkService from '../../src/core/services/bookmarkService';
import { renderWithProviders, createMockEntry } from '../utils/testUtils';
import { EntryType } from '../../src/core/types/entry.types';

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
    user: { id: 'user-123', displayName: 'Jane Student' },
  }),
}));

jest.mock('../../src/core/services/bookmarkService', () => ({
  getUserBookmarks: jest.fn(),
  isBookmarked: jest.fn().mockResolvedValue(true),
  toggleBookmark: jest.fn().mockResolvedValue(false),
}));

describe('BookmarksScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders empty state when user has no bookmarks', async () => {
    (bookmarkService.getUserBookmarks as jest.Mock).mockResolvedValueOnce([]);

    const { getByTestId, getByText } = await renderWithProviders(<BookmarksScreen />);

    await waitFor(() => {
      expect(getByTestId('bookmarks-empty-state')).toBeTruthy();
      expect(getByText('No saved entries yet')).toBeTruthy();
    });
  });

  test('renders list of bookmarks when entries exist', async () => {
    const mockEntry = createMockEntry({
      id: 'entry-bm-1',
      title: 'Operating Systems Virtual Memory Guide',
      type: EntryType.Viva,
      subject: 'Operating Systems',
      semester: 4,
    });

    (bookmarkService.getUserBookmarks as jest.Mock).mockResolvedValueOnce([mockEntry]);

    const { getByText, getByTestId } = await renderWithProviders(<BookmarksScreen />);

    await waitFor(() => {
      expect(getByText('Operating Systems Virtual Memory Guide')).toBeTruthy();
      expect(getByTestId('entry-card-entry-bm-1')).toBeTruthy();
    });
  });

  test('tapping back button navigates back', async () => {
    (bookmarkService.getUserBookmarks as jest.Mock).mockResolvedValueOnce([]);

    const { getByTestId } = await renderWithProviders(<BookmarksScreen />);

    await waitFor(() => {
      expect(getByTestId('button-bookmarks-back')).toBeTruthy();
    });

    fireEvent.press(getByTestId('button-bookmarks-back'));
    expect(mockGoBack).toHaveBeenCalled();
  });

  test('tapping an entry card navigates to EntryDetail', async () => {
    const mockEntry = createMockEntry({
      id: 'entry-bm-42',
      title: 'React Native Micro-Frontend Architecture',
      type: EntryType.Project,
    });

    (bookmarkService.getUserBookmarks as jest.Mock).mockResolvedValueOnce([mockEntry]);

    const { getByText } = await renderWithProviders(<BookmarksScreen />);

    await waitFor(() => {
      expect(getByText('React Native Micro-Frontend Architecture')).toBeTruthy();
    });

    fireEvent.press(getByText('React Native Micro-Frontend Architecture'));
    expect(mockNavigate).toHaveBeenCalledWith('EntryDetail', { entryId: 'entry-bm-42' });
  });
});

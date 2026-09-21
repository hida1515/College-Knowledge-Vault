import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../src/features/home/screens/HomeScreen';
import * as useEntriesHooks from '../../src/core/hooks/useEntries';

jest.mock('../../src/core/hooks/useEntries');
jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    user: { id: 'u1', displayName: 'John' },
  })),
}));

describe('HomeScreen Component', () => {
  const mockRefetch = jest.fn();
  const mockFetchNextPage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TEST GROUP 1: Rendering', () => {
    test('1a: shows skeleton loaders when loading', async () => {
      (useEntriesHooks.useApprovedEntries as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        refetch: mockRefetch,
      });

      const { queryByText } = await render(<HomeScreen />);
      expect(queryByText('Knowledge Vault')).toBeTruthy();
      expect(queryByText('No entries yet')).toBeNull();
    });

    test('1b: shows entry cards when data loaded', async () => {
      (useEntriesHooks.useApprovedEntries as jest.Mock).mockReturnValue({
        data: {
          pages: [
            [
              {
                id: 'e1',
                title: 'Loaded Entry 1',
                description: 'Desc',
                type: 'project',
                status: 'approved',
                tags: ['React'],
                authorName: 'Senior',
                upvoteCount: 5,
                viewCount: 10,
                createdAt: '2026-01-01T00:00:00Z',
              },
            ],
          ],
        },
        isLoading: false,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        refetch: mockRefetch,
      });

      const { getByText } = await render(<HomeScreen />);
      expect(getByText('Loaded Entry 1')).toBeTruthy();
    });

    test('1c: shows empty state when no entries', async () => {
      (useEntriesHooks.useApprovedEntries as jest.Mock).mockReturnValue({
        data: { pages: [[]] },
        isLoading: false,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        refetch: mockRefetch,
      });

      const { getByText } = await render(<HomeScreen />);
      expect(getByText('No entries yet')).toBeTruthy();
    });

    test('1d: filter bar rendered with options', async () => {
      (useEntriesHooks.useApprovedEntries as jest.Mock).mockReturnValue({
        data: { pages: [[]] },
        isLoading: false,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        refetch: mockRefetch,
      });

      const { getByText } = await render(<HomeScreen />);
      expect(getByText('All')).toBeTruthy();
      expect(getByText('Project')).toBeTruthy();
      expect(getByText('Viva')).toBeTruthy();
      expect(getByText('Mistake')).toBeTruthy();
      expect(getByText('Resource')).toBeTruthy();
    });
  });

  describe('TEST GROUP 2: Interactions', () => {
    test('2a & 2b: tapping filter chip and sort toggle updates query params', async () => {
      (useEntriesHooks.useApprovedEntries as jest.Mock).mockReturnValue({
        data: { pages: [[]] },
        isLoading: false,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        refetch: mockRefetch,
      });

      const { getByTestId } = await render(<HomeScreen />);

      fireEvent.press(getByTestId('filter-chip-Project'));

      await waitFor(() =>
        expect(useEntriesHooks.useApprovedEntries).toHaveBeenLastCalledWith(
          expect.objectContaining({ type: 'project' }),
        ),
      );

      fireEvent.press(getByTestId('sort-popular'));

      await waitFor(() =>
        expect(useEntriesHooks.useApprovedEntries).toHaveBeenLastCalledWith(
          expect.objectContaining({ sortBy: 'upvote_count' }),
        ),
      );
    });
  });
});

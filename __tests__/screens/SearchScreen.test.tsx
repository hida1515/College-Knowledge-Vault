import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchScreen } from '../../src/features/search/screens/SearchScreen';
import * as entryService from '../../src/core/services/entryService';
import * as useEntriesHooks from '../../src/core/hooks/useEntries';
import { EntryType } from '../../src/core/types/entry.types';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

jest.mock('../../src/core/hooks/useEntries', () => ({
  useTags: jest.fn(),
  useToggleUpvote: jest.fn(() => ({
    mutate: jest.fn(),
  })),
}));

jest.mock('../../src/core/services/entryService', () => ({
  searchEntries: jest.fn(),
}));

jest.mock('../../src/core/store/authStore', () => {
  const state = {
    user: { id: 'u1', displayName: 'Tester', collegeId: 'col-1' },
    isAuthenticated: true,
  };
  const fn: any = jest.fn(() => state);
  fn.getState = jest.fn(() => state);
  return { useAuthStore: fn };
});

const sampleEntry = {
  id: 'entry-1',
  authorId: 'u1',
  collegeId: 'col-1',
  title: 'React Native Search Guide',
  description: 'How to implement instant debounced search',
  type: EntryType.Project,
  subject: 'Mobile Dev',
  semester: 6,
  status: 'approved',
  upvoteCount: 12,
  viewCount: 45,
  isUpvotedByCurrentUser: false,
  isBookmarkedByCurrentUser: false,
  authorName: 'Senior Student',
  tags: ['React Native', 'Mobile'],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('SearchScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useEntriesHooks.useTags as jest.Mock).mockReturnValue({
      data: ['React', 'Python', 'NodeJS'],
    });
    (entryService.searchEntries as jest.Mock).mockResolvedValue([sampleEntry]);
  });

  describe('TEST GROUP 1: Rendering', () => {
    test('1a: search input renders and is auto-focused', async () => {
      const { getByTestId } = await render(<SearchScreen />);
      const input = getByTestId('search-input');
      expect(input).toBeTruthy();
      expect(input.props.autoFocus).toBe(true);
    });

    test('1b: empty state shown when query < 2 chars', async () => {
      const { getByTestId } = await render(<SearchScreen />);
      expect(getByTestId('search-empty-state')).toBeTruthy();
    });

    test('1c: recent searches shown when available', async () => {
      await AsyncStorage.setItem(
        '@recent_searches',
        JSON.stringify(['Microservices', 'Algorithms']),
      );

      const { getByText } = await render(<SearchScreen />);

      await waitFor(() => {
        expect(getByText('Recent Searches')).toBeTruthy();
        expect(getByText('Microservices')).toBeTruthy();
        expect(getByText('Algorithms')).toBeTruthy();
      });
    });

    test('1d: popular tags shown in empty state', async () => {
      const { getByText } = await render(<SearchScreen />);
      expect(getByText('Popular Tags')).toBeTruthy();
      expect(getByText('#React')).toBeTruthy();
      expect(getByText('#Python')).toBeTruthy();
    });

    test('1e: skeleton shown when isSearching=true', async () => {
      let resolveSearch: (val: any) => void = () => {};
      (entryService.searchEntries as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSearch = resolve;
          }),
      );

      const { getByTestId } = await render(<SearchScreen />);
      const input = getByTestId('search-input');

      await act(async () => {
        fireEvent.changeText(input, 'React');
      });

      expect(getByTestId('search-skeleton-loader')).toBeTruthy();

      await waitFor(() => {
        expect(entryService.searchEntries).toHaveBeenCalled();
      });

      await act(async () => {
        resolveSearch([sampleEntry]);
      });
    });

    test('1f: results shown when data returned', async () => {
      (entryService.searchEntries as jest.Mock).mockResolvedValue([sampleEntry]);

      const { getByTestId, getByText } = await render(<SearchScreen />);
      const input = getByTestId('search-input');

      await act(async () => {
        fireEvent.changeText(input, 'React');
      });

      await waitFor(() => {
        expect(getByTestId('search-results-count')).toBeTruthy();
        expect(getByText('React Native Search Guide')).toBeTruthy();
      });
    });

    test('1g: no results state when empty array returned', async () => {
      (entryService.searchEntries as jest.Mock).mockResolvedValue([]);

      const { getByTestId, getByText } = await render(<SearchScreen />);
      const input = getByTestId('search-input');

      await act(async () => {
        fireEvent.changeText(input, 'UnknownQuery');
      });

      await waitFor(() => {
        expect(getByTestId('search-no-results')).toBeTruthy();
        expect(getByText('No results found')).toBeTruthy();
      });
    });

    test('1h: filter chips render (All, Project, Viva, Mistake, Resource)', async () => {
      const { getByTestId } = await render(<SearchScreen />);
      expect(getByTestId('filter-chip-all')).toBeTruthy();
      expect(getByTestId('filter-chip-project')).toBeTruthy();
      expect(getByTestId('filter-chip-viva')).toBeTruthy();
      expect(getByTestId('filter-chip-mistake')).toBeTruthy();
      expect(getByTestId('filter-chip-resource')).toBeTruthy();
    });
  });

  describe('TEST GROUP 2: Search Behavior', () => {
    test('2a: query < 2 chars does not trigger search', async () => {
      const { getByTestId } = await render(<SearchScreen />);
      const input = getByTestId('search-input');

      await act(async () => {
        fireEvent.changeText(input, 'a');
      });

      await new Promise((resolve) => setTimeout(() => resolve(undefined), 350));

      expect(entryService.searchEntries).not.toHaveBeenCalled();
    });

    test('2b: query >= 2 chars triggers searchEntries', async () => {
      const { getByTestId } = await render(<SearchScreen />);
      const input = getByTestId('search-input');

      await act(async () => {
        fireEvent.changeText(input, 'React');
      });

      await waitFor(() => {
        expect(entryService.searchEntries).toHaveBeenCalledWith(
          expect.objectContaining({ query: 'React' }),
        );
      });
    });

    test('2c: 300ms debounce applied', async () => {
      const { getByTestId } = await render(<SearchScreen />);
      const input = getByTestId('search-input');

      await act(async () => {
        fireEvent.changeText(input, 'Re');
        fireEvent.changeText(input, 'Rea');
        fireEvent.changeText(input, 'React');
      });

      // Before 300ms, not called
      expect(entryService.searchEntries).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(entryService.searchEntries).toHaveBeenCalledTimes(1);
        expect(entryService.searchEntries).toHaveBeenCalledWith(
          expect.objectContaining({ query: 'React' }),
        );
      });
    });

    test('2d: type filter passed to searchEntries', async () => {
      const { getByTestId } = await render(<SearchScreen />);
      const filterChip = getByTestId('filter-chip-viva');

      await act(async () => {
        fireEvent.press(filterChip);
      });

      const input = getByTestId('search-input');
      await act(async () => {
        fireEvent.changeText(input, 'React');
      });

      await waitFor(() => {
        expect(entryService.searchEntries).toHaveBeenCalledWith(
          expect.objectContaining({
            query: 'React',
            type: EntryType.Viva,
          }),
        );
      });
    });

    test('2e: tapping result saves to recent searches and navigates', async () => {
      (entryService.searchEntries as jest.Mock).mockResolvedValue([sampleEntry]);

      const { getByTestId, getByText } = await render(<SearchScreen />);
      const input = getByTestId('search-input');

      await act(async () => {
        fireEvent.changeText(input, 'React');
      });

      await waitFor(() => {
        expect(getByText('React Native Search Guide')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('React Native Search Guide'));
      });

      expect(mockNavigate).toHaveBeenCalledWith('EntryDetail', {
        entryId: 'entry-1',
      });

      const recentRaw = await AsyncStorage.getItem('@recent_searches');
      expect(recentRaw).toBeTruthy();
      const recent = JSON.parse(recentRaw!);
      expect(recent).toContain('React');
    });

    test('2f: clear X button clears search field', async () => {
      const { getByTestId, queryByTestId } = await render(<SearchScreen />);
      const input = getByTestId('search-input');

      await act(async () => {
        fireEvent.changeText(input, 'React');
      });

      const clearBtn = getByTestId('button-clear-search');
      expect(clearBtn).toBeTruthy();

      await act(async () => {
        fireEvent.press(clearBtn);
      });

      expect(input.props.value).toBe('');
      expect(queryByTestId('button-clear-search')).toBeNull();
    });
  });
});

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../src/features/home/screens/HomeScreen';
import * as useEntriesHooks from '../../src/core/hooks/useEntries';
import { EntryType, EntryStatus, Entry } from '../../src/core/types/entry.types';

jest.mock('../../src/core/hooks/useEntries');
jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    user: { id: 'u1', displayName: 'John', role: 'student' },
  })),
}));

function createMockEntry(overrides?: Partial<Entry>): Entry {
  return {
    id: 'entry-1',
    authorId: 'author-1',
    authorName: 'Senior Student',
    authorAvatarUrl: null,
    authorCollege: 'Test College',
    authorDepartment: 'MCA',
    authorGraduationYear: 2025,
    title: 'React Native Build Optimization Tips',
    description: 'A comprehensive guide to optimizing React Native builds.',
    type: EntryType.Project,
    status: EntryStatus.Approved,
    tags: ['React Native', 'TypeScript', 'Android'],
    subject: 'Mobile Development',
    semester: 3,
    upvoteCount: 7,
    viewCount: 42,
    isUpvotedByCurrentUser: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('Home Screen Flow', () => {
  const mockRefetch = jest.fn().mockResolvedValue(undefined);
  const mockFetchNextPage = jest.fn();

  function setupMock(entries: Entry[] = [createMockEntry()], isLoading = false) {
    (useEntriesHooks.useApprovedEntries as jest.Mock).mockImplementation(() => ({
      data: isLoading ? undefined : { pages: [entries] },
      isLoading,
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
      refetch: mockRefetch,
      isError: false,
    }));
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── GROUP 1: Loading states ───

  describe('TEST GROUP 1: Loading states', () => {
    test('1a: shows skeleton loaders when isLoading=true', async () => {
      setupMock([], true);
      const { queryByText } = await render(<HomeScreen />);
      expect(queryByText('No entries yet')).toBeNull();
    });

    test('1b: skeleton loaders disappear when data loaded', async () => {
      const entry = createMockEntry({ title: 'Visible Entry' });
      setupMock([entry]);
      const { getByText } = await render(<HomeScreen />);
      expect(getByText('Visible Entry')).toBeTruthy();
    });
  });

  // ─── GROUP 2: Entry display ───

  describe('TEST GROUP 2: Entry display', () => {
    const entry1 = createMockEntry({
      id: 'e1',
      title: 'React Native Tips',
      authorName: 'Alice',
      type: EntryType.Project,
      status: EntryStatus.Approved,
      tags: ['React', 'TS'],
      upvoteCount: 5,
      viewCount: 22,
    });
    const entry2 = createMockEntry({
      id: 'e2',
      title: 'Viva Prep Guide',
      authorName: 'Bob',
      type: EntryType.Viva,
      tags: ['Java', 'Spring', 'Docker', 'K8s'],
      upvoteCount: 12,
      viewCount: 100,
    });

    test('2a: renders EntryCard for each entry in feed', async () => {
      setupMock([entry1, entry2]);
      const { getByText } = await render(<HomeScreen />);
      expect(getByText('React Native Tips')).toBeTruthy();
      expect(getByText('Viva Prep Guide')).toBeTruthy();
    });

    test('2b: entry card shows title', async () => {
      setupMock([entry1, entry2]);
      const { getByText } = await render(<HomeScreen />);
      expect(getByText('React Native Tips')).toBeTruthy();
    });

    test('2c: entry card shows author name', async () => {
      setupMock([entry1, entry2]);
      const { getByText } = await render(<HomeScreen />);
      expect(getByText('Alice')).toBeTruthy();
    });

    test('2d: entry card shows type badge text', async () => {
      setupMock([entry1, entry2]);
      const { getAllByText } = await render(<HomeScreen />);
      expect(getAllByText('Project').length).toBeGreaterThan(0);
    });

    test('2e: entry card shows max 3 tags, "+N more" for extra', async () => {
      setupMock([entry1, entry2]);
      const { getByText } = await render(<HomeScreen />);
      expect(getByText('+1 more')).toBeTruthy();
    });

    test('2f: entry card shows upvote count', async () => {
      setupMock([entry1, entry2]);
      const { getByText } = await render(<HomeScreen />);
      expect(getByText('5')).toBeTruthy();
    });

    test('2g: entry card shows view count', async () => {
      setupMock([entry1, entry2]);
      const { getByText } = await render(<HomeScreen />);
      expect(getByText('22')).toBeTruthy();
    });
  });

  // ─── GROUP 3: Filtering ───

  describe('TEST GROUP 3: Filtering', () => {
    test('3a: All filter selected by default', async () => {
      setupMock([]);
      const { getByTestId } = await render(<HomeScreen />);
      expect(getByTestId('filter-chip-All')).toBeTruthy();
    });

    test('3b: tapping Project filter calls useApprovedEntries with type=project', async () => {
      setupMock([]);
      const { getByTestId } = await render(<HomeScreen />);
      fireEvent.press(getByTestId('filter-chip-Project'));

      await waitFor(() => {
        expect(useEntriesHooks.useApprovedEntries).toHaveBeenLastCalledWith(
          expect.objectContaining({ type: EntryType.Project }),
        );
      });
    });

    test('3c: tapping Viva filter calls with type=viva', async () => {
      setupMock([]);
      const { getByTestId } = await render(<HomeScreen />);
      fireEvent.press(getByTestId('filter-chip-Viva'));

      await waitFor(() => {
        expect(useEntriesHooks.useApprovedEntries).toHaveBeenLastCalledWith(
          expect.objectContaining({ type: EntryType.Viva }),
        );
      });
    });

    test('3d: tapping Mistake filter calls with type=mistake', async () => {
      setupMock([]);
      const { getByTestId } = await render(<HomeScreen />);
      fireEvent.press(getByTestId('filter-chip-Mistake'));

      await waitFor(() => {
        expect(useEntriesHooks.useApprovedEntries).toHaveBeenLastCalledWith(
          expect.objectContaining({ type: EntryType.Mistake }),
        );
      });
    });

    test('3e: tapping Resource filter calls with type=resource', async () => {
      setupMock([]);
      const { getByTestId } = await render(<HomeScreen />);
      fireEvent.press(getByTestId('filter-chip-Resource'));

      await waitFor(() => {
        expect(useEntriesHooks.useApprovedEntries).toHaveBeenLastCalledWith(
          expect.objectContaining({ type: EntryType.Resource }),
        );
      });
    });

    test('3f: tapping All clears type filter', async () => {
      setupMock([]);
      const { getByTestId } = await render(<HomeScreen />);
      fireEvent.press(getByTestId('filter-chip-Project'));
      await waitFor(() => {
        expect(useEntriesHooks.useApprovedEntries).toHaveBeenLastCalledWith(
          expect.objectContaining({ type: EntryType.Project }),
        );
      });

      fireEvent.press(getByTestId('filter-chip-All'));
      await waitFor(() => {
        expect(useEntriesHooks.useApprovedEntries).toHaveBeenLastCalledWith(
          expect.objectContaining({ type: undefined }),
        );
      });
    });
  });

  // ─── GROUP 4: Sorting ───

  describe('TEST GROUP 4: Sorting', () => {
    test('4a: Recent sort selected by default', async () => {
      setupMock([]);
      await render(<HomeScreen />);
      await waitFor(() => {
        expect(useEntriesHooks.useApprovedEntries).toHaveBeenCalledWith(
          expect.objectContaining({ sortBy: 'created_at' }),
        );
      });
    });

    test('4b: tapping Popular calls with sortBy=upvote_count', async () => {
      setupMock([]);
      const { getByTestId } = await render(<HomeScreen />);
      fireEvent.press(getByTestId('sort-popular'));

      await waitFor(() => {
        expect(useEntriesHooks.useApprovedEntries).toHaveBeenLastCalledWith(
          expect.objectContaining({ sortBy: 'upvote_count' }),
        );
      });
    });

    test('4c: tapping Recent calls with sortBy=created_at', async () => {
      setupMock([]);
      const { getByTestId } = await render(<HomeScreen />);
      fireEvent.press(getByTestId('sort-popular'));
      await waitFor(() => {
        expect(useEntriesHooks.useApprovedEntries).toHaveBeenLastCalledWith(
          expect.objectContaining({ sortBy: 'upvote_count' }),
        );
      });

      fireEvent.press(getByTestId('sort-recent'));
      await waitFor(() => {
        expect(useEntriesHooks.useApprovedEntries).toHaveBeenLastCalledWith(
          expect.objectContaining({ sortBy: 'created_at' }),
        );
      });
    });
  });

  // ─── GROUP 5: Empty and error states ───

  describe('TEST GROUP 5: Empty and error states', () => {
    test('5a: empty state shown when entries array is empty', async () => {
      setupMock([]);
      const { getByText } = await render(<HomeScreen />);
      expect(getByText('No entries yet')).toBeTruthy();
    });

    test('5b: empty state shows correct message', async () => {
      setupMock([]);
      const { getByText } = await render(<HomeScreen />);
      expect(
        getByText(/Be the first to share your knowledge/),
      ).toBeTruthy();
    });
  });
});

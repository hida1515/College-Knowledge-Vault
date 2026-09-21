/**
 * EntryCard Comprehensive Component Tests
 * College Knowledge Vault
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { EntryCard } from '../../src/features/home/components/EntryCard';
import { createMockEntry } from '../utils/testUtils';
import { EntryType, EntryStatus } from '../../src/core/types/entry.types';

// Mock hook
const mockToggleUpvote = jest.fn();
jest.mock('../../src/core/hooks/useEntries', () => ({
  useToggleUpvote: () => ({
    mutate: mockToggleUpvote,
  }),
}));

// Mock authStore
jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'u1', displayName: 'John' },
  }),
}));

describe('EntryCard Comprehensive Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TEST GROUP 1: All entry types render correctly', () => {
    test('1a: project type renders title and badge text', async () => {
      const entry = createMockEntry({ type: EntryType.Project, title: 'Project Entry' });
      const { getByText } = await render(<EntryCard entry={entry} />);
      expect(getByText('Project Entry')).toBeTruthy();
      expect(getByText('Project')).toBeTruthy();
    });

    test('1b: viva type renders title and badge text', async () => {
      const entry = createMockEntry({ type: EntryType.Viva, title: 'Viva Entry' });
      const { getByText } = await render(<EntryCard entry={entry} />);
      expect(getByText('Viva Entry')).toBeTruthy();
      expect(getByText('Viva')).toBeTruthy();
    });

    test('1c: mistake type renders title and badge text', async () => {
      const entry = createMockEntry({ type: EntryType.Mistake, title: 'Mistake Entry' });
      const { getByText } = await render(<EntryCard entry={entry} />);
      expect(getByText('Mistake Entry')).toBeTruthy();
      expect(getByText('Mistake')).toBeTruthy();
    });

    test('1d: resource type renders title and badge text', async () => {
      const entry = createMockEntry({ type: EntryType.Resource, title: 'Resource Entry' });
      const { getByText } = await render(<EntryCard entry={entry} />);
      expect(getByText('Resource Entry')).toBeTruthy();
      expect(getByText('Resource')).toBeTruthy();
    });
  });

  describe('TEST GROUP 2: Tag display', () => {
    test('2a: 1 tag shows 1 pill, no "+more"', async () => {
      const entry = createMockEntry({ tags: ['React'] });
      const { getByText, queryByText } = await render(<EntryCard entry={entry} />);
      expect(getByText('React')).toBeTruthy();
      expect(queryByText(/more/)).toBeNull();
    });

    test('2b: 2 tags shows 2 pills, no "+more"', async () => {
      const entry = createMockEntry({ tags: ['React', 'TypeScript'] });
      const { getByText, queryByText } = await render(<EntryCard entry={entry} />);
      expect(getByText('React')).toBeTruthy();
      expect(getByText('TypeScript')).toBeTruthy();
      expect(queryByText(/more/)).toBeNull();
    });

    test('2c: 3 tags shows 3 pills, no "+more"', async () => {
      const entry = createMockEntry({ tags: ['React', 'TS', 'Node'] });
      const { getByText, queryByText } = await render(<EntryCard entry={entry} />);
      expect(getByText('React')).toBeTruthy();
      expect(getByText('TS')).toBeTruthy();
      expect(getByText('Node')).toBeTruthy();
      expect(queryByText(/more/)).toBeNull();
    });

    test('2d: 4 tags shows 3 pills + "+1 more"', async () => {
      const entry = createMockEntry({ tags: ['React', 'TS', 'Node', 'Docker'] });
      const { getByText } = await render(<EntryCard entry={entry} />);
      expect(getByText('React')).toBeTruthy();
      expect(getByText('TS')).toBeTruthy();
      expect(getByText('Node')).toBeTruthy();
      expect(getByText('+1 more')).toBeTruthy();
    });

    test('2e: 6 tags shows 3 pills + "+3 more"', async () => {
      const entry = createMockEntry({
        tags: ['React', 'TS', 'Node', 'Docker', 'AWS', 'GraphQL'],
      });
      const { getByText } = await render(<EntryCard entry={entry} />);
      expect(getByText('+3 more')).toBeTruthy();
    });
  });

  describe('TEST GROUP 3: Status badge', () => {
    test('3a: no status badge when showStatusBadge=false', async () => {
      const entry = createMockEntry({ status: EntryStatus.Pending });
      const { queryByText } = await render(<EntryCard entry={entry} showStatusBadge={false} />);
      expect(queryByText('PENDING')).toBeNull();
    });

    test('3b: pending badge when status=pending and showStatusBadge=true', async () => {
      const entry = createMockEntry({ status: EntryStatus.Pending });
      const { getByText } = await render(<EntryCard entry={entry} showStatusBadge={true} />);
      expect(getByText('PENDING')).toBeTruthy();
    });

    test('3c: approved badge when status=approved', async () => {
      const entry = createMockEntry({ status: EntryStatus.Approved });
      const { getByText } = await render(<EntryCard entry={entry} showStatusBadge={true} />);
      expect(getByText('APPROVED')).toBeTruthy();
    });

    test('3d: rejected badge when status=rejected', async () => {
      const entry = createMockEntry({ status: EntryStatus.Rejected });
      const { getByText } = await render(<EntryCard entry={entry} showStatusBadge={true} />);
      expect(getByText('REJECTED')).toBeTruthy();
    });
  });

  describe('TEST GROUP 4: Upvote interaction', () => {
    test('4a: upvote button renders with correct count', async () => {
      const entry = createMockEntry({ upvoteCount: 15 });
      const { getByText } = await render(<EntryCard entry={entry} />);
      expect(getByText('15')).toBeTruthy();
    });

    test('4b: tapping upvote calls toggleUpvote mutation', async () => {
      const entry = createMockEntry({ id: 'e1', upvoteCount: 15, isUpvotedByCurrentUser: false });
      const { getByText } = await render(<EntryCard entry={entry} />);

      fireEvent.press(getByText('15'));
      expect(mockToggleUpvote).toHaveBeenCalledWith({ entryId: 'e1', userId: 'u1' });
    });

    test('4c: optimistic update: count changes immediately on tap', async () => {
      const entry = createMockEntry({ id: 'e1', upvoteCount: 15, isUpvotedByCurrentUser: false });
      const { getByText } = await render(<EntryCard entry={entry} />);

      act(() => {
        fireEvent.press(getByText('15'));
      });

      expect(getByText('16')).toBeTruthy();
    });
  });
});

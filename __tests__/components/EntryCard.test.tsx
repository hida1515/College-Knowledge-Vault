import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EntryCard } from '../../src/features/home/components/EntryCard';
import { Entry, EntryType, EntryStatus } from '../../src/core/types/entry.types';
import * as useEntriesHooks from '../../src/core/hooks/useEntries';

jest.mock('../../src/core/hooks/useEntries', () => ({
  useToggleUpvote: jest.fn(),
}));

jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    user: { id: 'u1', displayName: 'John' },
  })),
}));

const mockEntry: Entry = {
  id: 'e1',
  authorId: 'u1',
  authorName: 'Jane Doe',
  authorAvatarUrl: null,
  authorDepartment: 'MCA',
  authorGraduationYear: 2026,
  title: 'Sample Knowledge Entry Title',
  description: 'Sample description content',
  type: EntryType.Project,
  status: EntryStatus.Approved,
  tags: ['React Native', 'Supabase', 'TypeScript', 'Jest'],
  subject: 'MAD',
  semester: 6,
  upvoteCount: 12,
  viewCount: 45,
  isUpvotedByCurrentUser: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('EntryCard Component', () => {
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useEntriesHooks.useToggleUpvote as jest.Mock).mockReturnValue({
      mutate: mockMutate,
    });
  });

  describe('TEST GROUP 1: Rendering', () => {
    test('1a & 1b: renders entry title and author name', async () => {
      const { getByText } = await render(<EntryCard entry={mockEntry} />);

      expect(getByText('Sample Knowledge Entry Title')).toBeTruthy();
      expect(getByText('Jane Doe')).toBeTruthy();
    });

    test('1c: renders type badge text', async () => {
      const { getByText } = await render(<EntryCard entry={mockEntry} />);

      expect(getByText('PROJECT')).toBeTruthy();
    });

    test('1d & 1e: renders max 3 tags and +N more badge', async () => {
      const { getByText, queryByText } = await render(
        <EntryCard entry={mockEntry} />,
      );

      expect(getByText('React Native')).toBeTruthy();
      expect(getByText('Supabase')).toBeTruthy();
      expect(getByText('TypeScript')).toBeTruthy();
      expect(queryByText('Jest')).toBeNull();
      expect(getByText('+1 more')).toBeTruthy();
    });

    test('1f: renders upvote count', async () => {
      const { getByText } = await render(<EntryCard entry={mockEntry} />);

      expect(getByText('12')).toBeTruthy();
    });

    test('1g & 1h: controls status badge visibility via showStatusBadge prop', async () => {
      const { queryByText, rerender } = await render(
        <EntryCard entry={mockEntry} showStatusBadge={false} />,
      );
      expect(queryByText('Approved')).toBeNull();

      await rerender(<EntryCard entry={mockEntry} showStatusBadge={true} />);
      expect(queryByText('Approved')).toBeTruthy();
    });
  });

  describe('TEST GROUP 2: Interactions', () => {
    test('2a: tapping card calls onPress callback', async () => {
      const onPressMock = jest.fn();
      const { getByTestId } = await render(
        <EntryCard entry={mockEntry} onPress={onPressMock} />,
      );

      fireEvent.press(getByTestId('entry-card-e1'));
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    test('2b: tapping upvote calls toggleUpvote mutation', async () => {
      const { getByTestId } = await render(<EntryCard entry={mockEntry} />);

      fireEvent.press(getByTestId('upvote-button-e1'));
      expect(mockMutate).toHaveBeenCalledWith(
        { entryId: 'e1', userId: 'u1' },
        expect.any(Object),
      );
    });
  });
});

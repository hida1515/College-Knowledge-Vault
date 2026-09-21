import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { EntryDetailScreen } from '../../src/features/entryDetail/screens/EntryDetailScreen';
import * as entryService from '../../src/core/services/entryService';
import * as commentService from '../../src/core/services/commentService';
import { renderWithProviders, createMockEntry, mockAuthStoreReturn } from '../utils/testUtils';
import { EntryType, EntryStatus } from '../../src/core/types/entry.types';

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: { entryId: 'test-entry-discuss' },
    }),
  };
});

const mockUser: any = { id: 'user-commenter-1', displayName: 'Curious Student', role: 'student' };
const mockAuthState = mockAuthStoreReturn(mockUser);
jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: (selector?: any) => (selector ? selector(mockAuthState) : mockAuthState),
}));

jest.mock('../../src/features/submitEntry/context/SubmitFormContext', () => ({
  useSubmitFormContext: () => ({
    loadEntryForEdit: jest.fn(),
  }),
}));

jest.mock('../../src/core/services/bookmarkService', () => ({
  isBookmarked: jest.fn().mockResolvedValue(false),
  toggleBookmark: jest.fn().mockResolvedValue(true),
}));

describe('EntryDetailScreen Discussion UI (FIX 14)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(entryService, 'getEntryById').mockResolvedValue(
      createMockEntry({
        id: 'test-entry-discuss',
        title: 'Distributed File System',
        type: EntryType.Project,
        status: EntryStatus.Approved,
      }),
    );
  });

  it('renders discussion section and posts a comment', async () => {
    const mockComments = [
      {
        id: 'c-1',
        entryId: 'test-entry-discuss',
        userId: 'u-senior',
        parentCommentId: null,
        content: 'Feel free to ask about raft consensus implementation!',
        createdAt: '2026-03-01T12:00:00Z',
        updatedAt: '2026-03-01T12:00:00Z',
        author: {
          id: 'u-senior',
          displayName: 'Senior Lead',
          role: 'student',
        },
        replies: [],
      },
    ];

    jest.spyOn(commentService, 'getEntryComments').mockResolvedValue(mockComments);
    const addCommentSpy = jest.spyOn(commentService, 'addComment').mockResolvedValue({
      id: 'c-2',
      entryId: 'test-entry-discuss',
      userId: 'user-commenter-1',
      parentCommentId: null,
      content: 'Did you use gRPC or HTTP/2 for RPCs?',
      createdAt: '2026-03-01T13:00:00Z',
      updatedAt: '2026-03-01T13:00:00Z',
      author: {
        id: 'user-commenter-1',
        displayName: 'Curious Student',
        role: 'student',
      },
      replies: [],
    });

    const screen = await renderWithProviders(<EntryDetailScreen />);

    // Verify discussion section rendered
    expect(await screen.findByTestId('discussion-section')).toBeTruthy();
    expect(await screen.findByText(/Feel free to ask about raft consensus/i)).toBeTruthy();
    expect(await screen.findByText('Senior Lead')).toBeTruthy();

    // Type in comment input
    const input = await screen.findByTestId('input-comment');
    fireEvent.changeText(input, 'Did you use gRPC or HTTP/2 for RPCs?');

    await waitFor(() => {
      expect(input.props.value).toBe('Did you use gRPC or HTTP/2 for RPCs?');
    });

    // Post comment
    const postBtn = screen.getByTestId('btn-post-comment');
    fireEvent.press(postBtn);

    await waitFor(() => {
      expect(addCommentSpy).toHaveBeenCalledWith({
        entryId: 'test-entry-discuss',
        userId: 'user-commenter-1',
        content: 'Did you use gRPC or HTTP/2 for RPCs?',
        parentCommentId: null,
      });
    });
  });

  it('allows clicking reply to set parent comment', async () => {
    const mockComments = [
      {
        id: 'c-parent',
        entryId: 'test-entry-discuss',
        userId: 'u-faculty',
        parentCommentId: null,
        content: 'Great project writeup.',
        createdAt: '2026-03-01T12:00:00Z',
        updatedAt: '2026-03-01T12:00:00Z',
        author: {
          id: 'u-faculty',
          displayName: 'Dr. Smith',
          role: 'faculty',
        },
        replies: [],
      },
    ];

    jest.spyOn(commentService, 'getEntryComments').mockResolvedValue(mockComments);
    const addCommentSpy = jest.spyOn(commentService, 'addComment').mockResolvedValue({
      id: 'c-reply-1',
      entryId: 'test-entry-discuss',
      userId: 'user-commenter-1',
      parentCommentId: 'c-parent',
      content: 'Thank you Professor!',
      createdAt: '2026-03-01T13:00:00Z',
      updatedAt: '2026-03-01T13:00:00Z',
      author: {
        id: 'user-commenter-1',
        displayName: 'Curious Student',
        role: 'student',
      },
      replies: [],
    });

    const screen = await renderWithProviders(<EntryDetailScreen />);

    // Wait for comments to render
    expect(await screen.findByText('Dr. Smith')).toBeTruthy();

    const replyBtn = await screen.findByTestId('btn-reply-comment-c-parent');
    fireEvent.press(replyBtn);

    // Verify reply banner
    expect(await screen.findByTestId('btn-cancel-reply')).toBeTruthy();

    const input = await screen.findByTestId('input-comment');
    fireEvent.changeText(input, 'Thank you Professor!');

    await waitFor(() => {
      expect(input.props.value).toBe('Thank you Professor!');
    });

    const postBtn = screen.getByTestId('btn-post-comment');
    fireEvent.press(postBtn);

    await waitFor(() => {
      expect(addCommentSpy).toHaveBeenCalledWith({
        entryId: 'test-entry-discuss',
        userId: 'user-commenter-1',
        content: 'Thank you Professor!',
        parentCommentId: 'c-parent',
      });
    });
  });
});

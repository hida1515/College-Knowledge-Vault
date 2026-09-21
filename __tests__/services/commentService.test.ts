import {
  getEntryComments,
  addComment,
  deleteComment,
  getCommentCount,
} from '../../src/core/services/commentService';
import { supabase } from '../../src/core/services/supabase';

jest.mock('../../src/core/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Comment Service (FIX 14)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEntryComments()', () => {
    test('1. returns top-level comments and nests 1-level replies', async () => {
      const mockRows = [
        {
          id: 'c1',
          entry_id: 'e1',
          user_id: 'u1',
          parent_comment_id: null,
          content: 'Top level question',
          is_deleted: false,
          created_at: '2026-03-01T10:00:00Z',
          updated_at: '2026-03-01T10:00:00Z',
          users: {
            id: 'u1',
            display_name: 'Student One',
            avatar_url: null,
            role: 'student',
            department: 'CSE',
          },
        },
        {
          id: 'c2',
          entry_id: 'e1',
          user_id: 'u2',
          parent_comment_id: 'c1',
          content: 'Nested answer reply',
          is_deleted: false,
          created_at: '2026-03-01T10:05:00Z',
          updated_at: '2026-03-01T10:05:00Z',
          users: {
            id: 'u2',
            display_name: 'Senior Author',
            avatar_url: null,
            role: 'student',
            department: 'CSE',
          },
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockRows, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const comments = await getEntryComments('e1');
      expect(comments.length).toBe(1);
      expect(comments[0].id).toBe('c1');
      expect(comments[0].replies).toHaveLength(1);
      expect(comments[0].replies![0].id).toBe('c2');
      expect(comments[0].replies![0].content).toBe('Nested answer reply');
    });

    test('2. returns empty array on database error', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB fail' } }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const comments = await getEntryComments('e1');
      expect(comments).toEqual([]);
    });
  });

  describe('addComment()', () => {
    test('3. throws error if content is empty or whitespace', async () => {
      await expect(
        addComment({
          entryId: 'e1',
          userId: 'u1',
          content: '   ',
        }),
      ).rejects.toThrow('Comment cannot be empty.');
    });

    test('4. throws error if content exceeds 500 characters', async () => {
      const longText = 'A'.repeat(501);
      await expect(
        addComment({
          entryId: 'e1',
          userId: 'u1',
          content: longText,
        }),
      ).rejects.toThrow('Comment cannot exceed 500 characters.');
    });

    test('5. successfully inserts comment and returns formatted item', async () => {
      const mockInserted = {
        id: 'new-c',
        entry_id: 'e1',
        user_id: 'u1',
        parent_comment_id: null,
        content: 'Great project writeup!',
        is_deleted: false,
        created_at: '2026-03-01T12:00:00Z',
        updated_at: '2026-03-01T12:00:00Z',
        users: {
          id: 'u1',
          display_name: 'Alice',
          avatar_url: null,
          role: 'student',
        },
      };

      const mockInsertBuilder = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockInserted, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockInsertBuilder);

      const res = await addComment({
        entryId: 'e1',
        userId: 'u1',
        content: 'Great project writeup!',
      });

      expect(res.id).toBe('new-c');
      expect(res.content).toBe('Great project writeup!');
      expect(res.author.displayName).toBe('Alice');
    });
  });

  describe('deleteComment()', () => {
    test('6. soft-deletes comment by updating is_deleted to true', async () => {
      const mockUpdateBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockUpdateBuilder);

      const success = await deleteComment('c1', 'u1');
      expect(success).toBe(true);
      expect(mockUpdateBuilder.update).toHaveBeenCalledWith({ is_deleted: true });
      expect(mockUpdateBuilder.eq).toHaveBeenCalledWith('id', 'c1');
    });
  });

  describe('getCommentCount()', () => {
    test('7. returns active count of comments', async () => {
      const mockCountBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockImplementation((col: string, _val: any) => {
          if (col === 'is_deleted') {
            return Promise.resolve({ count: 7, error: null });
          }
          return mockCountBuilder;
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockCountBuilder);

      const count = await getCommentCount('e1');
      expect(count).toBe(7);
    });
  });
});

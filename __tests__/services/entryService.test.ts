import {
  getApprovedEntries,
  createEntry,
  getUserStats,
  toggleUpvote,
  incrementViewCount,
} from '../../src/core/services/entryService';
import { supabase } from '../../src/core/services/supabase';
import { EntryType } from '../../src/core/types/entry.types';

jest.mock('../../src/core/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    },
    rpc: jest.fn().mockResolvedValue({ error: null }),
  },
}));

describe('entryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
    });
  });

  describe('getApprovedEntries()', () => {
    test('1a & 1c: queries entries with status=approved and applies limit/offset', async () => {
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'e1',
              author_id: 'u1',
              title: 'Entry Title',
              description: 'Desc',
              type: 'project',
              status: 'approved',
              upvote_count: 5,
              view_count: 10,
              created_at: '2026-01-01',
              users: {
                display_name: 'John',
                avatar_url: null,
                college_name: 'MIT',
                department: 'CS',
                graduation_year: 2026,
              },
              entry_tags: [{ tags: { name: 'React' } }],
            },
          ],
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const res = await getApprovedEntries({ limit: 10, offset: 0 });

      expect(supabase.from).toHaveBeenCalledWith('entries');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'approved');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_deleted', false);
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 9);
      expect(res.length).toBe(1);
      expect(res[0].title).toBe('Entry Title');
      expect(res[0].tags).toEqual(['React']);
    });

    test('1b: filters by type when type parameter provided', async () => {
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await getApprovedEntries({ type: EntryType.Viva });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('type', 'viva');
    });

    test('1d: handles error response gracefully by returning empty array', async () => {
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const res = await getApprovedEntries({});
      expect(res).toEqual([]);
    });
  });

  describe('createEntry()', () => {
    test('2a, 2b, 2c: inserts entry, resolves tags, inserts viva questions', async () => {
      const mockEntryInsert: any = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'new-entry-id' },
          error: null,
        }),
      };

      const mockTagSelect: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 'tag-1' },
          error: null,
        }),
      };

      const mockEntryTagInsert: any = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };

      const mockVivaInsert: any = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'entries') return mockEntryInsert;
        if (table === 'tags') return mockTagSelect;
        if (table === 'entry_tags') return mockEntryTagInsert;
        if (table === 'viva_questions') return mockVivaInsert;
        return {};
      });

      const entryId = await createEntry({
        authorId: 'u1',
        title: 'My Project',
        description: 'Description long enough for testing entry creation',
        type: EntryType.Project,
        subject: 'Math',
        semester: 5,
        tags: ['React'],
        vivaQuestions: [{ question: 'Q1', answer: 'A1', difficulty: 'easy' }],
      });

      expect(entryId).toBe('new-entry-id');
      expect(mockEntryInsert.insert).toHaveBeenCalledWith({
        author_id: 'u1',
        college_id: null,
        title: 'My Project',
        description: 'Description long enough for testing entry creation',
        type: 'project',
        subject: 'Math',
        semester: 5,
        status: 'pending',
      });
      expect(mockEntryTagInsert.insert).toHaveBeenCalledWith({
        entry_id: 'new-entry-id',
        tag_id: 'tag-1',
      });
      expect(mockVivaInsert.insert).toHaveBeenCalledWith([
        {
          entry_id: 'new-entry-id',
          question: 'Q1',
          answer: 'A1',
          difficulty: 'easy',
        },
      ]);
    });
  });

  describe('toggleUpvote()', () => {
    test('3a & 3c: inserts upvote row when not upvoted and returns upvoted=true', async () => {
      const mockSelectChain: any = {
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null }),
      };

      const mockDeleteChain: any = {
        eq: jest.fn().mockReturnThis(),
      };
      mockDeleteChain.eq.mockResolvedValue({ error: null });

      const mockUpvoteTable: any = {
        select: jest.fn().mockReturnValue(mockSelectChain),
        insert: jest.fn().mockResolvedValue({ error: null }),
        delete: jest.fn().mockReturnValue(mockDeleteChain),
      };

      const mockEntriesBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { upvote_count: 5 } }),
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'entry_upvotes') return mockUpvoteTable;
        if (table === 'entries') return mockEntriesBuilder;
        return {};
      });

      const res = await toggleUpvote('e1', 'u1');
      expect(res.upvoted).toBe(true);
      expect(res.newCount).toBe(5);
    });

    test('3b & 3d: deletes upvote row when already upvoted and returns upvoted=false', async () => {
      const mockSelectChain: any = {
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { entry_id: 'e1', user_id: 'u1' },
        }),
      };

      const mockDeleteChain: any = {
        eq: jest.fn().mockReturnThis(),
      };

      const mockUpvoteTable: any = {
        select: jest.fn().mockReturnValue(mockSelectChain),
        delete: jest.fn().mockReturnValue(mockDeleteChain),
        insert: jest.fn().mockResolvedValue({ error: null }),
      };

      const mockEntriesBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { upvote_count: 4 } }),
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'entry_upvotes') return mockUpvoteTable;
        if (table === 'entries') return mockEntriesBuilder;
        return {};
      });

      const res = await toggleUpvote('e1', 'u1');
      expect(res.upvoted).toBe(false);
      expect(res.newCount).toBe(4);
    });
  });

  describe('getUserStats()', () => {
    test('4a: returns correct counts for each status', async () => {
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockQueryBuilder.eq.mockImplementation((field: string) => {
        if (field === 'is_deleted') {
          return Promise.resolve({
            data: [
              { status: 'approved' },
              { status: 'approved' },
              { status: 'pending' },
              { status: 'rejected' },
            ],
            error: null,
          });
        }
        return mockQueryBuilder;
      });

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const stats = await getUserStats('u1');
      expect(stats.total).toBe(4);
      expect(stats.approved).toBe(2);
      expect(stats.pending).toBe(1);
      expect(stats.rejected).toBe(1);
    });
  });

  describe('incrementViewCount()', () => {
    test('fire and forget updates view_count on entry', async () => {
      const mockEntriesBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { view_count: 10 } }),
        update: jest.fn().mockReturnThis(),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockEntriesBuilder);

      await incrementViewCount('e1');

      expect(supabase.from).toHaveBeenCalledWith('entries');
      expect(mockEntriesBuilder.update).toHaveBeenCalledWith({ view_count: 11 });
    });
  });
});

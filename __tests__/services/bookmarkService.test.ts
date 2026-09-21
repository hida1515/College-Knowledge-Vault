/**
 * Bookmark Service Unit Tests
 *
 * Validates:
 * 1. isBookmarked checks if user has bookmarked an entry.
 * 2. toggleBookmark inserts when not bookmarked and returns { bookmarked: true }.
 * 3. toggleBookmark deletes when already bookmarked and returns { bookmarked: false }.
 * 4. Error throwing on empty arguments or Supabase failures.
 * 5. getUserBookmarks retrieves and maps approved bookmarked entries with tags and details.
 */

import { isBookmarked, toggleBookmark, getUserBookmarks } from '../../src/core/services/bookmarkService';
import { supabase } from '../../src/core/services/supabase';

jest.mock('../../src/core/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('bookmarkService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isBookmarked', () => {
    test('returns false when entryId or userId is missing', async () => {
      expect(await isBookmarked('', 'u1')).toBe(false);
      expect(await isBookmarked('e1', '')).toBe(false);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    test('returns true when a bookmark row is found', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: { id: 'b1' },
        error: null,
      });
      const mockEq2 = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await isBookmarked('e1', 'u1');

      expect(supabase.from).toHaveBeenCalledWith('bookmarks');
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockEq1).toHaveBeenCalledWith('entry_id', 'e1');
      expect(mockEq2).toHaveBeenCalledWith('user_id', 'u1');
      expect(result).toBe(true);
    });

    test('returns false when no bookmark row is found or error occurs', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });
      const mockEq2 = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await isBookmarked('e1', 'u1');
      expect(result).toBe(false);
    });
  });

  describe('toggleBookmark', () => {
    test('throws error if entryId or userId is missing', async () => {
      await expect(toggleBookmark('', 'u1')).rejects.toThrow('entryId and userId are required to toggle bookmark');
      await expect(toggleBookmark('e1', '')).rejects.toThrow('entryId and userId are required to toggle bookmark');
    });

    test('inserts bookmark when not currently bookmarked', async () => {
      // 1. isBookmarked check -> returns false
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEqUser = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEqEntry = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEqEntry });

      // 2. insert call -> returns { error: null }
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'bookmarks') {
          return {
            select: mockSelect,
            insert: mockInsert,
          };
        }
        return {};
      });

      const result = await toggleBookmark('e1', 'u1');

      expect(mockInsert).toHaveBeenCalledWith({
        entry_id: 'e1',
        user_id: 'u1',
      });
      expect(result).toEqual({ bookmarked: true });
    });

    test('deletes bookmark when already bookmarked', async () => {
      // 1. isBookmarked check -> returns true
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { id: 'b1' }, error: null });
      const mockEqUser = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEqEntry = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEqEntry });

      // 2. delete call -> returns { error: null }
      const mockDeleteEqUser = jest.fn().mockResolvedValue({ error: null });
      const mockDeleteEqEntry = jest.fn().mockReturnValue({ eq: mockDeleteEqUser });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEqEntry });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'bookmarks') {
          return {
            select: mockSelect,
            delete: mockDelete,
          };
        }
        return {};
      });

      const result = await toggleBookmark('e1', 'u1');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteEqEntry).toHaveBeenCalledWith('entry_id', 'e1');
      expect(mockDeleteEqUser).toHaveBeenCalledWith('user_id', 'u1');
      expect(result).toEqual({ bookmarked: false });
    });

    test('throws error if insert fails', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEqUser = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEqEntry = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEqEntry });
      const mockInsert = jest.fn().mockResolvedValue({ error: { message: 'Database constraint violation' } });

      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: mockSelect,
        insert: mockInsert,
      }));

      await expect(toggleBookmark('e1', 'u1')).rejects.toThrow('Failed to add bookmark: Database constraint violation');
    });

    test('throws error if delete fails', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { id: 'b1' }, error: null });
      const mockEqUser = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEqEntry = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEqEntry });

      const mockDeleteEqUser = jest.fn().mockResolvedValue({ error: { message: 'Delete constraint' } });
      const mockDeleteEqEntry = jest.fn().mockReturnValue({ eq: mockDeleteEqUser });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEqEntry });

      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: mockSelect,
        delete: mockDelete,
      }));

      await expect(toggleBookmark('e1', 'u1')).rejects.toThrow('Failed to remove bookmark: Delete constraint');
    });
  });

  describe('getUserBookmarks', () => {
    test('returns empty array when userId is empty', async () => {
      const result = await getUserBookmarks('');
      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    test('retrieves and correctly maps bookmarked entries', async () => {
      const mockOrder = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'b1',
            created_at: '2026-02-01T00:00:00Z',
            entries: {
              id: 'e1',
              author_id: 'a1',
              college_id: 'c1',
              title: 'Autonomous Drone Navigation',
              description: 'ROS-based mapping and path planning',
              type: 'project',
              status: 'approved',
              subject: 'Robotics',
              semester: 7,
              upvote_count: 14,
              view_count: 52,
              outdated_count: 0,
              is_marked_outdated: false,
              project_details: { category: 'Hardware' },
              viva_details: null,
              mistake_details: null,
              resource_details: null,
              created_at: '2026-01-15T00:00:00Z',
              updated_at: '2026-01-16T00:00:00Z',
              is_deleted: false,
              users: {
                display_name: 'Rahul Sen',
                avatar_url: 'https://example.com/avatar.png',
                college: 'National Tech',
                department: 'ECE',
                graduation_year: 2026,
              },
              entry_tags: [
                { tags: { name: 'ROS' } },
                { tags: { name: 'Robotics' } },
              ],
            },
          },
          {
            // Deleted or non-approved entry should be filtered out
            id: 'b2',
            created_at: '2026-02-02T00:00:00Z',
            entries: {
              id: 'e2',
              status: 'rejected',
              is_deleted: false,
            },
          },
        ],
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await getUserBookmarks('u1');

      expect(supabase.from).toHaveBeenCalledWith('bookmarks');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'u1');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('e1');
      expect(result[0].title).toBe('Autonomous Drone Navigation');
      expect(result[0].authorName).toBe('Rahul Sen');
      expect(result[0].tags).toEqual(['ROS', 'Robotics']);
      expect(result[0].isBookmarkedByCurrentUser).toBe(true);
    });

    test('returns empty array when query fails', async () => {
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Network disconnected' },
      });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await getUserBookmarks('u1');
      expect(result).toEqual([]);
    });
  });
});

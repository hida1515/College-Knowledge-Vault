/**
 * Entry Service Duplicate Detection & Outdated Flagging Unit Tests
 *
 * Validates:
 * 1. checkDuplicate performs case-insensitive search within 6-month window for the same author and type.
 * 2. markOutdated prevents double-flagging by same user.
 * 3. markOutdated sets is_marked_outdated = true when flag count reaches 3.
 * 4. getEntryForEdit fetches draft data for rejected entry.
 * 5. updateEntry resets status to 'pending' for re-moderation.
 */

import {
  checkDuplicate,
  markOutdated,
  getEntryForEdit,
  updateEntry,
} from '../../src/core/services/entryService';
import { supabase } from '../../src/core/services/supabase';
import { EntryType } from '../../src/core/types/entry.types';

jest.mock('../../src/core/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('entryService - Duplicate Detection & Outdated Flags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDuplicate', () => {
    test('returns false when authorId or title is empty', async () => {
      expect(
        await checkDuplicate({ authorId: '', title: 'Test', type: EntryType.Project }),
      ).toEqual({ isDuplicate: false, existingEntryId: null });

      expect(
        await checkDuplicate({ authorId: 'u1', title: '', type: EntryType.Project }),
      ).toEqual({ isDuplicate: false, existingEntryId: null });
    });

    test('detects duplicate when existing entry within 6 months matches title case-insensitively', async () => {
      const mockIlike = jest.fn().mockResolvedValue({
        data: [{ id: 'existing-entry-1', title: 'Deep Learning Vision' }],
        error: null,
      });
      const mockGte = jest.fn().mockReturnValue({ ilike: mockIlike });
      const mockEqType = jest.fn().mockReturnValue({ gte: mockGte });
      const mockEqAuthor = jest.fn().mockReturnValue({ eq: mockEqType });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEqAuthor });

      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await checkDuplicate({
        authorId: 'user-1',
        title: 'deep learning vision',
        type: EntryType.Project,
      });

      expect(supabase.from).toHaveBeenCalledWith('entries');
      expect(mockEqAuthor).toHaveBeenCalledWith('author_id', 'user-1');
      expect(mockEqType).toHaveBeenCalledWith('type', EntryType.Project);
      expect(mockIlike).toHaveBeenCalledWith('title', 'deep learning vision');
      expect(result).toEqual({
        isDuplicate: true,
        existingEntryId: 'existing-entry-1',
      });
    });

    test('returns false when no matching entry found or query errors', async () => {
      const mockIlike = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      const mockGte = jest.fn().mockReturnValue({ ilike: mockIlike });
      const mockEqType = jest.fn().mockReturnValue({ gte: mockGte });
      const mockEqAuthor = jest.fn().mockReturnValue({ eq: mockEqType });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEqAuthor });

      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await checkDuplicate({
        authorId: 'user-1',
        title: 'Completely Unique Title',
        type: EntryType.Project,
      });

      expect(result).toEqual({
        isDuplicate: false,
        existingEntryId: null,
      });
    });
  });

  describe('markOutdated', () => {
    test('throws error if entryId or userId missing', async () => {
      await expect(markOutdated('', 'u1', 'Outdated')).rejects.toThrow(
        'entryId and userId are required to mark outdated',
      );
      await expect(markOutdated('e1', '', 'Outdated')).rejects.toThrow(
        'entryId and userId are required to mark outdated',
      );
    });

    test('returns early without inserting if user already marked this entry', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: { entry_id: 'e1' },
        error: null,
      });
      const mockEqUser = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEqEntry = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEqEntry });
      const mockInsert = jest.fn();

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'outdated_marks') {
          return { select: mockSelect, insert: mockInsert };
        }
        return {};
      });

      await markOutdated('e1', 'u1', 'Old syllabus');

      expect(mockSelect).toHaveBeenCalled();
      expect(mockInsert).not.toHaveBeenCalled();
    });

    test('inserts mark and updates entry count; sets is_marked_outdated to true when count reaches 3', async () => {
      // 1. Existing mark check -> not found
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEqUser = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEqEntry = jest.fn().mockReturnValue({ eq: mockEqUser });
      const mockSelectMark = jest.fn().mockReturnValue({ eq: mockEqEntry });

      // 2. Insert mark
      const mockInsertMark = jest.fn().mockResolvedValue({ error: null });

      // 3. Fetch entry outdated_count -> 2 (so new count = 3 >= 3)
      const mockSingleEntry = jest.fn().mockResolvedValue({
        data: { outdated_count: 2 },
        error: null,
      });
      const mockEqEntryId = jest.fn().mockReturnValue({ single: mockSingleEntry });
      const mockSelectEntry = jest.fn().mockReturnValue({ eq: mockEqEntryId });

      // 4. Update entry
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdateEntry = jest.fn().mockReturnValue({ eq: mockUpdateEq });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'outdated_marks') {
          return { select: mockSelectMark, insert: mockInsertMark };
        }
        if (table === 'entries') {
          return { select: mockSelectEntry, update: mockUpdateEntry };
        }
        return {};
      });

      await markOutdated('e1', 'u1', 'Dependencies deprecated');

      expect(mockInsertMark).toHaveBeenCalledWith({
        entry_id: 'e1',
        user_id: 'u1',
        reason: 'Dependencies deprecated',
      });

      expect(mockUpdateEntry).toHaveBeenCalledWith({
        outdated_count: 3,
        is_marked_outdated: true,
      });
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 'e1');
    });
  });

  describe('getEntryForEdit & updateEntry', () => {
    test('getEntryForEdit retrieves and formats existing entry data with tags and viva questions', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'e1',
          title: 'Existing Project',
          description: 'Description long enough for edit',
          type: 'project',
          subject: 'Computer Networks',
          semester: 5,
          rejection_reason: 'Please clarify system requirements',
          project_details: { category: 'Web App' },
          viva_details: null,
          mistake_details: null,
          resource_details: null,
          entry_tags: [{ tags: { name: 'TCP/IP' } }, { tags: { name: 'Sockets' } }],
          viva_questions: [{ id: 'vq1', question: 'Explain 3-way handshake', answer: 'SYN, SYN-ACK, ACK', difficulty: 'medium' }],
        },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const form = await getEntryForEdit('e1');

      expect(form.id).toBe('e1');
      expect(form.title).toBe('Existing Project');
      expect(form.tags).toEqual(['TCP/IP', 'Sockets']);
      expect(form.rejectionReason).toBe('Please clarify system requirements');
      expect(form.vivaQuestions?.length).toBe(1);
    });

    test('updateEntry resets status to pending and updates columns', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'entries') {
          return { update: mockUpdate };
        }
        if (table === 'tags') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'tag-1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'entry_tags') {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        return { delete: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
      });

      await updateEntry('e1', {
        title: 'Updated Project Title',
        description: 'New and improved description for resubmission',
        type: EntryType.Project,
        subject: 'Networking',
        semester: '5',
        tags: ['Networks'],
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Project Title',
          description: 'New and improved description for resubmission',
          status: 'pending',
          semester: 5,
        }),
      );
      expect(mockEq).toHaveBeenCalledWith('id', 'e1');
    });
  });
});

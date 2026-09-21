import { createEntry } from '../../src/core/services/entryService';
import { supabase } from '../../src/core/services/supabase';
import { EntryType } from '../../src/core/types/entry.types';

jest.mock('../../src/core/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

jest.mock('../../src/core/services/notificationService', () => ({
  notifyEntryApproved: jest.fn(),
  notifyEntryRejected: jest.fn(),
  notifyFacultyNewSubmission: jest.fn().mockResolvedValue(true),
}));

describe('Submission Rate Limiting (FIX 15)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows submission when author has submitted less than 5 entries in 24 hours', async () => {
    const mockGte = jest.fn().mockResolvedValue({ count: 2, error: null });
    const mockEq = jest.fn().mockReturnValue({ gte: mockGte });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { id: 'entry-allowed-1' }, error: null }),
      }),
    });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'entries') {
        return {
          select: mockSelect,
          insert: mockInsert,
        };
      }
      if (table === 'tags') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'tag-1' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'entry_tags') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    });

    const entryId = await createEntry({
      authorId: 'senior-1',
      title: 'Allowed Entry',
      description: 'A detailed valid description of the submitted project',
      type: EntryType.Project,
      subject: 'Computer Networks',
      semester: 6,
      tags: ['Networking'],
    });

    expect(entryId).toBe('entry-allowed-1');
  });

  it('blocks submission and throws rate limit error when author has submitted 5 or more entries in 24 hours', async () => {
    const mockGte = jest.fn().mockResolvedValue({ count: 5, error: null });
    const mockEq = jest.fn().mockReturnValue({ gte: mockGte });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'entries') {
        return {
          select: mockSelect,
          insert: jest.fn(),
        };
      }
      return {};
    });

    await expect(
      createEntry({
        authorId: 'senior-spammy',
        title: 'Sixth Entry',
        description: 'Trying to submit sixth entry in one day',
        type: EntryType.Project,
        subject: 'Math',
        semester: 4,
        tags: ['Math'],
      }),
    ).rejects.toThrow('You can submit up to 5 entries per day. Please try again tomorrow.');
  });
});

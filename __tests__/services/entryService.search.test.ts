import { searchEntries } from '../../src/core/services/entryService';
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

describe('entryService.searchEntries()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleRawEntry = {
    id: 'e1',
    author_id: 'u1',
    college_id: 'col-123',
    title: 'Machine Learning Project',
    description: 'A deep neural network project for image classification',
    type: 'project',
    status: 'approved',
    upvote_count: 5,
    view_count: 20,
    created_at: '2026-01-01T00:00:00Z',
    users: {
      display_name: 'Alice',
      avatar_url: null,
      college: 'MIT',
      department: 'CS',
      graduation_year: 2026,
    },
    entry_tags: [{ tags: { name: 'Python' } }, { tags: { name: 'ML' } }],
  };

  test('1a: filters by college_id', async () => {
    const mockQueryBuilder: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [sampleRawEntry], error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

    const res = await searchEntries({
      query: 'Machine',
      collegeId: 'col-123',
    });

    expect(supabase.from).toHaveBeenCalledWith('entries');
    expect(mockQueryBuilder.or).toHaveBeenCalledWith('college_id.eq.col-123,college_id.is.null');
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('e1');
  });

  test('1b: filters by status=approved and is_deleted=false', async () => {
    const mockQueryBuilder: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [sampleRawEntry], error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

    await searchEntries({
      query: 'Machine',
      collegeId: 'col-123',
    });

    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'approved');
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_deleted', false);
  });

  test('1c: case insensitive title search via ilike in or filter', async () => {
    const mockQueryBuilder: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [sampleRawEntry], error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

    await searchEntries({
      query: 'machine',
      collegeId: 'col-123',
    });

    expect(mockQueryBuilder.or).toHaveBeenCalledWith(
      expect.stringContaining('title.ilike.%machine%'),
    );
  });

  test('1d: case insensitive description search via ilike in or filter', async () => {
    const mockQueryBuilder: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [sampleRawEntry], error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

    await searchEntries({
      query: 'neural',
      collegeId: 'col-123',
    });

    expect(mockQueryBuilder.or).toHaveBeenCalledWith(
      expect.stringContaining('description.ilike.%neural%'),
    );
  });

  test('1e: applies type filter when provided', async () => {
    const mockQueryBuilder: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [sampleRawEntry], error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

    await searchEntries({
      query: 'Machine',
      collegeId: 'col-123',
      type: EntryType.Project,
    });

    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('type', 'project');
  });

  test('1f: returns empty array when no matches or error occurs', async () => {
    const mockQueryBuilder: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

    const res = await searchEntries({
      query: 'NonExistent',
      collegeId: 'col-123',
    });

    expect(res).toEqual([]);
  });

  test('1g: respects limit and offset parameters', async () => {
    const mockQueryBuilder: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

    await searchEntries({
      query: 'Test',
      collegeId: 'col-123',
      limit: 10,
      offset: 5,
    });

    expect(mockQueryBuilder.range).toHaveBeenCalledWith(5, 14);
  });
});

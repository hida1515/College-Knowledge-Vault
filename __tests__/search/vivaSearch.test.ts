/**
 * Viva Questions & Unified Full Text Search Unit Tests
 * College Knowledge Vault
 */

import { searchEntries } from '../../src/core/services/entryService';
import { supabase } from '../../src/core/services/supabase';

jest.mock('../../src/core/services/supabase', () => {
  const mockRpc = jest.fn();
  const mockFrom = jest.fn();
  return {
    supabase: {
      rpc: mockRpc,
      from: mockFrom,
    },
  };
});

describe('Unified Search: search_vault_entries RPC & Foreign Key Disambiguation', () => {
  const mockRpc = supabase.rpc as jest.Mock;
  const mockFrom = supabase.from as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('test 1a: search_vault_entries RPC finds viva question matches', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          id: 'entry-viva-1',
          title: 'Sorting Algorithms Overview',
          description: 'A comprehensive study of sorting algorithms',
          type: 'viva',
          status: 'approved',
          college_id: 'col-123',
          author_id: 'usr-1',
          upvote_count: 5,
          view_count: 20,
          created_at: '2024-09-01T00:00:00Z',
          match_source: 'viva_question',
          match_snippet: 'What is the average time complexity of Bubble Sort?',
        },
      ],
      error: null,
    });

    const results = await searchEntries({
      query: 'Bubble Sort',
      collegeId: 'col-123',
    });

    expect(mockRpc).toHaveBeenCalledWith('search_vault_entries', {
      search_query: 'Bubble Sort',
      p_college_id: 'col-123',
      p_entry_type: null,
      p_limit: 20,
      p_offset: 0,
    });
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Sorting Algorithms Overview');
    expect(results[0].matchSource).toBe('viva_question');
    expect(results[0].matchSnippet).toContain('Bubble Sort');
  });

  test('test 1b: match_source = "viva_question" for viva matches', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          id: 'viva-q1',
          title: 'Operating Systems',
          description: 'OS concepts',
          type: 'viva',
          status: 'approved',
          college_id: 'col-123',
          author_id: 'usr-2',
          upvote_count: 8,
          view_count: 45,
          created_at: '2024-09-01T00:00:00Z',
          match_source: 'viva_question',
          match_snippet: 'Explain Banker algorithm for deadlock avoidance',
        },
      ],
      error: null,
    });

    const results = await searchEntries({
      query: 'Banker',
      collegeId: 'col-123',
    });

    expect(results[0].matchSource).toBe('viva_question');
  });

  test('test 1c: match_source = "entry" for title/description matches', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          id: 'entry-direct-1',
          title: 'React Native Micro-Frontend Architecture',
          description: 'Guide to building modular apps',
          type: 'resource',
          status: 'approved',
          college_id: 'col-123',
          author_id: 'usr-3',
          upvote_count: 14,
          view_count: 80,
          created_at: '2024-09-01T00:00:00Z',
          match_source: 'entry',
          match_snippet: 'React Native Micro-Frontend Architecture',
        },
      ],
      error: null,
    });

    const results = await searchEntries({
      query: 'Micro-Frontend',
      collegeId: 'col-123',
    });

    expect(results[0].matchSource).toBe('entry');
  });

  test('test 1d: match_source = "tag" for tag matches', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          id: 'entry-tag-1',
          title: 'Computer Vision Project',
          description: 'Image classification with OpenCV',
          type: 'project',
          status: 'approved',
          college_id: 'col-123',
          author_id: 'usr-4',
          upvote_count: 22,
          view_count: 110,
          created_at: '2024-09-01T00:00:00Z',
          match_source: 'tag',
          match_snippet: 'Machine Learning',
        },
      ],
      error: null,
    });

    const results = await searchEntries({
      query: 'Machine Learning',
      collegeId: 'col-123',
    });

    expect(results[0].matchSource).toBe('tag');
  });

  test('test 1e: results exclude other college entries by collegeId scoping in fallback query', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC not deployed yet' } });

    const mockOr = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockRange = jest.fn().mockResolvedValue({ data: [], error: null });

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        or: mockOr,
        eq: mockEq,
        range: mockRange,
      }),
    });

    await searchEntries({
      query: 'Compiler',
      collegeId: 'col-my-college',
    });

    expect(mockFrom).toHaveBeenCalledWith('entries');
    expect(mockOr).toHaveBeenCalledWith(
      expect.stringContaining('college_id.eq.col-my-college'),
    );
  });

  test('test 1f: results include entries with college_id IS NULL in fallback query', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC not deployed yet' } });

    const mockOr = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockRange = jest.fn().mockResolvedValue({ data: [], error: null });

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        or: mockOr,
        eq: mockEq,
        range: mockRange,
      }),
    });

    await searchEntries({
      query: 'Global Resource',
      collegeId: 'col-123',
    });

    expect(mockOr).toHaveBeenCalledWith(
      'college_id.eq.col-123,college_id.is.null',
    );
  });
});

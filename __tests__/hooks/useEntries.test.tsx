import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useApprovedEntries,
  useUserEntries,
  useUserStats,
  useToggleUpvote,
} from '../../src/core/hooks/useEntries';
import * as entryService from '../../src/core/services/entryService';

jest.mock('../../src/core/services/entryService');

describe('useEntries hooks', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useApprovedEntries', () => {
    test('1a & 1c: fetches initial page of approved entries', async () => {
      (entryService.getApprovedEntries as jest.Mock).mockResolvedValue([
        { id: '1', title: 'Entry 1' },
      ]);

      const wrapper = createWrapper();
      const { result } = await renderHook(() => useApprovedEntries({}), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(entryService.getApprovedEntries).toHaveBeenCalledWith({
        offset: 0,
        limit: 10,
      });
      expect(result.current.data?.pages[0]).toEqual([
        { id: '1', title: 'Entry 1' },
      ]);
    });

    test('1e: fetchNextPage calls service with incremented offset', async () => {
      const tenEntries = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        title: `E${i}`,
      }));

      (entryService.getApprovedEntries as jest.Mock)
        .mockResolvedValueOnce(tenEntries)
        .mockResolvedValueOnce([{ id: '10', title: 'E10' }]);

      const wrapper = createWrapper();
      const { result } = await renderHook(() => useApprovedEntries({}), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.hasNextPage).toBe(true);

      result.current.fetchNextPage();

      await waitFor(() =>
        expect(entryService.getApprovedEntries).toHaveBeenCalledWith({
          offset: 10,
          limit: 10,
        }),
      );
    });
  });

  describe('useUserEntries', () => {
    test('fetches entries for user id', async () => {
      (entryService.getUserEntries as jest.Mock).mockResolvedValue([
        { id: 'u1', title: 'My Entry' },
      ]);

      const wrapper = createWrapper();
      const { result } = await renderHook(() => useUserEntries('user-123'), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(entryService.getUserEntries).toHaveBeenCalledWith('user-123');
      expect(result.current.data).toEqual([{ id: 'u1', title: 'My Entry' }]);
    });
  });

  describe('useUserStats', () => {
    test('fetches contribution stats for user id', async () => {
      (entryService.getUserStats as jest.Mock).mockResolvedValue({
        total: 5,
        approved: 3,
        pending: 1,
        rejected: 1,
      });

      const wrapper = createWrapper();
      const { result } = await renderHook(() => useUserStats('user-123'), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(entryService.getUserStats).toHaveBeenCalledWith('user-123');
      expect(result.current.data).toEqual({
        total: 5,
        approved: 3,
        pending: 1,
        rejected: 1,
      });
    });
  });

  describe('useToggleUpvote', () => {
    test('2a: calls toggleUpvote service on mutate', async () => {
      (entryService.toggleUpvote as jest.Mock).mockResolvedValue({
        upvoted: true,
        newCount: 1,
      });

      const wrapper = createWrapper();
      const { result } = await renderHook(() => useToggleUpvote(), { wrapper });

      result.current.mutate({ entryId: 'e1', userId: 'u1' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(entryService.toggleUpvote).toHaveBeenCalledWith('e1', 'u1');
    });
  });
});

/**
 * Custom Hooks — Entry Data Management
 * College Knowledge Vault
 *
 * Provides React Query hooks for fetching approved entries, user entries,
 * tags, user statistics, and toggling upvotes.
 */

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getApprovedEntries,
  getUserEntries,
  getUserStats,
  toggleUpvote,
  getTags,
  getEntryById,
} from '../services/entryService';
import { EntryType } from '../types/entry.types';

/**
 * Infinite query for fetching approved entries feed with filtering and sorting.
 */
export function useApprovedEntries(params: {
  type?: EntryType;
  sortBy?: 'created_at' | 'upvote_count';
  department?: string;
  semesterRange?: [number, number];
}) {
  return useInfiniteQuery({
    queryKey: ['entries', 'approved', params],
    queryFn: ({ pageParam = 0 }) =>
      getApprovedEntries({
        ...params,
        offset: pageParam as number,
        limit: 10,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 10 ? allPages.length * 10 : undefined,
  });
}

/**
 * Query for fetching user's own submitted entries.
 */
export function useUserEntries(userId: string) {
  return useQuery({
    queryKey: ['entries', 'user', userId],
    queryFn: () => getUserEntries(userId),
    enabled: Boolean(userId),
  });
}

/**
 * Query for fetching user contribution statistics.
 */
export function useUserStats(userId: string) {
  return useQuery({
    queryKey: ['entries', 'stats', userId],
    queryFn: () => getUserStats(userId),
    enabled: Boolean(userId),
  });
}

/**
 * Query for fetching a single detailed entry by ID.
 */
export function useEntry(entryId: string) {
  return useQuery({
    queryKey: ['entries', 'detail', entryId],
    queryFn: () => getEntryById(entryId),
    enabled: Boolean(entryId),
  });
}

/**
 * Mutation hook for toggling an upvote on an entry.
 */
export function useToggleUpvote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, userId }: { entryId: string; userId: string }) =>
      toggleUpvote(entryId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', 'approved'] });
      queryClient.invalidateQueries({ queryKey: ['entries', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['entries', 'detail'] });
    },
  });
}

/**
 * Query for fetching all available tags with 5-minute cache.
 */
export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
    staleTime: 5 * 60 * 1000,
  });
}


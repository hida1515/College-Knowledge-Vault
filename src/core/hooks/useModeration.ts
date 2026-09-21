/**
 * useModeration Hook
 * College Knowledge Vault
 *
 * Phase 1: Stub — typed interface only.
 */

import { EntryStatus } from '../types/entry.types';
import {
  ModerationRecord,
  ModerationStats,
} from '../types/moderation.types';

/**
 * Custom hook for moderation operations.
 * Will use TanStack Query + Supabase Realtime in Phase 2.
 */
export function useModeration(_status?: EntryStatus | null) {
  // TODO: Phase 2 — useQuery + Realtime subscription

  return {
    records: [] as ModerationRecord[],
    stats: null as ModerationStats | null,
    isLoading: false,
    isError: false,
    error: null as string | null,
    hasNextPage: false,
    fetchNextPage: async () => { /* placeholder */ },
    approveEntry: async (_recordId: string, _note: string | null) => { /* placeholder */ },
    rejectEntry: async (_recordId: string, _note: string) => { /* placeholder */ },
    refetch: async () => { /* placeholder */ },
  };
}

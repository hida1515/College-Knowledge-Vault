/**
 * useSearch Hook
 * College Knowledge Vault
 *
 * Phase 1: Stub — typed interface only.
 */

import { Entry } from '../types/entry.types';

export interface SearchState {
  query: string;
  results: Entry[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  totalHits: number;
  hasMore: boolean;
  recentSearches: string[];
}

/**
 * Custom hook for Algolia-powered search.
 */
export function useSearch() {
  // TODO: Phase 2 — Algolia + AsyncStorage for recent searches

  return {
    query: '',
    results: [] as Entry[],
    isLoading: false,
    isError: false,
    error: null as string | null,
    totalHits: 0,
    hasMore: false,
    recentSearches: [] as string[],
    setQuery: (_query: string) => { /* placeholder */ },
    search: async (_query: string) => { /* placeholder */ },
    loadMore: async () => { /* placeholder */ },
    clearRecentSearches: async () => { /* placeholder */ },
  };
}

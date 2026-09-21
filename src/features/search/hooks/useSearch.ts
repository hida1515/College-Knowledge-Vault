/**
 * useSearch Hook
 * College Knowledge Vault
 *
 * Provides search state management, 300ms debounce, recent searches
 * persistence via AsyncStorage, and filtering by entry type.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Entry, EntryType } from '../../../core/types/entry.types';
import { searchEntries } from '../../../core/services/entryService';
import { useAuthStore } from '../../../core/store/authStore';

export const RECENT_SEARCHES_KEY = '@recent_searches';
export const MAX_RECENT_SEARCHES = 5;

export interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  type: EntryType | undefined;
  setType: (t: EntryType | undefined) => void;
  results: Entry[];
  isSearching: boolean;
  error: string | null;
  recentSearches: string[];
  addRecentSearch: (search: string) => Promise<void>;
  removeRecentSearch: (search: string) => Promise<void>;
  clearRecentSearches: () => Promise<void>;
  executeSearch: (searchQuery?: string) => Promise<void>;
}

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<EntryType | undefined>(undefined);
  const [results, setResults] = useState<Entry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches on mount
  useEffect(() => {
    async function loadRecent() {
      try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setRecentSearches(parsed);
          }
        }
      } catch {
        // ignore error
      }
    }
    loadRecent();
  }, []);

  const addRecentSearch = useCallback(async (search: string) => {
    const trimmed = search.trim();
    if (!trimmed) return;
    try {
      setRecentSearches((prev) => {
        const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
        const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    } catch {
      // ignore error
    }
  }, []);

  const removeRecentSearch = useCallback(async (search: string) => {
    try {
      setRecentSearches((prev) => {
        const updated = prev.filter((item) => item !== search);
        AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    } catch {
      // ignore error
    }
  }, []);

  const clearRecentSearches = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch {
      // ignore error
    }
  }, []);

  const performSearch = useCallback(async (searchQuery: string, searchType?: EntryType) => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setResults([]);
      setIsSearching(false);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const user = typeof useAuthStore?.getState === 'function' ? useAuthStore.getState().user : null;
      const collegeId = user?.collegeId || '';

      const data = await searchEntries({
        query: q,
        type: searchType,
        collegeId,
      });
      setResults(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to search entries');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const executeSearch = useCallback(async (searchQuery?: string) => {
    await performSearch(searchQuery !== undefined ? searchQuery : query, type);
  }, [query, type, performSearch]);

  // Debounced search when query or type changes
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      setError(null);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(() => {
      performSearch(query, type);
    }, 300);

    return () => clearTimeout(handler);
  }, [query, type, performSearch]);

  return {
    query,
    setQuery,
    type,
    setType,
    results,
    isSearching,
    error,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    executeSearch,
  };
}

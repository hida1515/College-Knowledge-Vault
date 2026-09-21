/**
 * Algolia Search Service
 * College Knowledge Vault
 *
 * Phase 1: Typed function signatures only — no implementation.
 */

import { Entry } from '../types/entry.types';

export interface AlgoliaSearchResult {
  hits: Entry[];
  totalHits: number;
  page: number;
  totalPages: number;
  query: string;
}

/**
 * Searches entries via Algolia full-text search.
 * @param query - The search query string.
 * @param page - The page number (0-indexed).
 * @param filters - Optional Algolia filter string.
 */
export async function searchEntries(
  query: string,
  page: number,
  filters?: string,
): Promise<AlgoliaSearchResult> {
  void query;
  void page;
  void filters;
  // TODO: Phase 2 — query Algolia index
  throw new Error('Not implemented');
}

/**
 * Indexes a new or updated entry in Algolia.
 * Called after entry approval in moderation.
 * @param entry - The entry to index.
 */
export async function indexEntry(entry: Entry): Promise<void> {
  void entry;
  // TODO: Phase 2 — add/update Algolia record (server-side preferred)
  throw new Error('Not implemented');
}

/**
 * Removes an entry from the Algolia index.
 * @param entryId - The entry ID to remove.
 */
export async function deleteEntryFromIndex(
  entryId: string,
): Promise<void> {
  void entryId;
  // TODO: Phase 2 — delete Algolia record
  throw new Error('Not implemented');
}

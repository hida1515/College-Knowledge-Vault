/**
 * Moderation Service
 * College Knowledge Vault
 *
 * Phase 1: Typed function signatures only — no implementation.
 */

import { EntryStatus } from '../types/entry.types';
import {
  ModerationRecord,
  ModerationStats,
  PaginatedModerationRecords,
  Flag,
  FlagReason,
} from '../types/moderation.types';

/**
 * Fetches the moderation queue with pagination.
 */
export async function getModerationQueue(
  page: number,
  status: EntryStatus | null,
): Promise<PaginatedModerationRecords> {
  void page;
  void status;
  // TODO: Phase 2 — query Supabase + Realtime subscription
  throw new Error('Not implemented');
}

/**
 * Approves an entry in the moderation queue.
 */
export async function approveEntry(
  recordId: string,
  reviewerId: string,
  reviewNote: string | null,
): Promise<ModerationRecord> {
  void recordId;
  void reviewerId;
  void reviewNote;
  // TODO: Phase 2 — update moderation_queue + entries status
  throw new Error('Not implemented');
}

/**
 * Rejects an entry in the moderation queue.
 */
export async function rejectEntry(
  recordId: string,
  reviewerId: string,
  reviewNote: string,
): Promise<ModerationRecord> {
  void recordId;
  void reviewerId;
  void reviewNote;
  // TODO: Phase 2 — update moderation_queue + entries status
  throw new Error('Not implemented');
}

/**
 * Gets moderation statistics for the admin dashboard.
 */
export async function getModerationStats(): Promise<ModerationStats> {
  // TODO: Phase 2 — aggregate queries on Supabase
  throw new Error('Not implemented');
}

/**
 * Fetches flagged entries for review.
 */
export async function getFlaggedEntries(
  page: number,
): Promise<{ flags: Flag[]; totalCount: number; hasMore: boolean }> {
  void page;
  // TODO: Phase 2 — query flags table
  throw new Error('Not implemented');
}

/**
 * Creates a flag report on an entry.
 */
export async function flagEntry(
  entryId: string,
  reportedBy: string,
  reason: FlagReason,
  description: string | null,
): Promise<Flag> {
  void entryId;
  void reportedBy;
  void reason;
  void description;
  // TODO: Phase 2 — insert into flags table
  throw new Error('Not implemented');
}

/**
 * Resolves a flag report.
 */
export async function resolveFlag(
  flagId: string,
  resolvedBy: string,
): Promise<Flag> {
  void flagId;
  void resolvedBy;
  // TODO: Phase 2 — update flag as resolved
  throw new Error('Not implemented');
}

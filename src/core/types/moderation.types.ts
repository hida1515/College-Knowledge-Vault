/**
 * Moderation Types
 * College Knowledge Vault
 */

import { Entry, EntryStatus } from './entry.types';

export enum FlagReason {
  Spam = 'spam',
  Inappropriate = 'inappropriate',
  Duplicate = 'duplicate',
  Inaccurate = 'inaccurate',
  Other = 'other',
}

export interface ModerationRecord {
  id: string;
  entryId: string;
  entry: Entry;
  submittedBy: string;
  reviewedBy: string | null;
  status: EntryStatus;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface Flag {
  id: string;
  entryId: string;
  reportedBy: string;
  reason: FlagReason;
  description: string | null;
  isResolved: boolean;
  resolvedBy: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface ModerationStats {
  totalPending: number;
  approvedToday: number;
  rejectedToday: number;
  totalFlags: number;
}

export interface PaginatedModerationRecords {
  records: ModerationRecord[];
  totalCount: number;
  hasMore: boolean;
  nextPage: number | null;
}

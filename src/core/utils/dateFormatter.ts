/**
 * Date Formatter
 * College Knowledge Vault
 *
 * Utility functions for date formatting using date-fns.
 * Phase 1: Typed signatures with basic implementations.
 */

import { formatDistanceToNow, format, parseISO } from 'date-fns';

/**
 * Formats an ISO date string to a relative time string.
 * e.g., "2 hours ago", "3 days ago"
 */
export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
}

/**
 * Formats an ISO date string to a readable date.
 * e.g., "Jan 15, 2025"
 */
export function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy');
}

/**
 * Formats an ISO date string to a date with time.
 * e.g., "Jan 15, 2025 at 2:30 PM"
 */
export function formatDateTime(dateString: string): string {
  return format(parseISO(dateString), "MMM d, yyyy 'at' h:mm a");
}

/**
 * Formats an ISO date string to a short date.
 * e.g., "15 Jan"
 */
export function formatShortDate(dateString: string): string {
  return format(parseISO(dateString), 'd MMM');
}

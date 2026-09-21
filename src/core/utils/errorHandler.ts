/**
 * Error Handler
 * College Knowledge Vault
 *
 * Centralized error handling utilities.
 */

import { ERRORS } from '../constants/appConstants';

export interface AppError {
  message: string;
  code: string;
  originalError: unknown;
}

/**
 * Extracts a user-friendly error message from an unknown error.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return ERRORS.GENERIC;
}

/**
 * Creates a standardized AppError from an unknown error.
 */
export function createAppError(
  error: unknown,
  code: string = 'UNKNOWN',
): AppError {
  return {
    message: getErrorMessage(error),
    code,
    originalError: error,
  };
}

/**
 * Checks if an error is a network error.
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('aborted')
    );
  }
  return false;
}

/**
 * Gets a user-friendly message based on error type.
 */
export function getUserFriendlyError(error: unknown): string {
  if (isNetworkError(error)) {
    return ERRORS.NETWORK;
  }
  return getErrorMessage(error);
}

/**
 * Logs an error to the console (will be replaced with crash reporting in production).
 */
export function logError(error: unknown, context?: string): void {
  const message = getErrorMessage(error);
  const prefix = context ? `[${context}]` : '[Error]';
  // eslint-disable-next-line no-console
  console.error(`${prefix} ${message}`, error);
}

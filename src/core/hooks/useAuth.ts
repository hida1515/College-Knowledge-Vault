/**
 * useAuth Hook
 * College Knowledge Vault
 *
 * Phase 1: Stub — returns store state and placeholder actions.
 */

import { useAuthStore } from '../store/authStore';

/**
 * Custom hook for authentication operations.
 * Provides auth state and action methods.
 */
export function useAuth() {
  const store = useAuthStore();

  return {
    user: store.user,
    session: store.session,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    error: store.error,

    // TODO: Phase 2 — implement actual auth logic
    signIn: async () => {
      // Placeholder
    },
    signOut: async () => {
      store.signOut();
    },
    refreshSession: async () => {
      // Placeholder
    },
  };
}

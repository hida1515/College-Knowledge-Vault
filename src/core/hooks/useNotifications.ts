/**
 * useNotifications Hook
 * College Knowledge Vault
 *
 * Phase 1: Stub — typed interface only.
 */

/**
 * Custom hook for push/local notification management.
 */
export function useNotifications() {
  // TODO: Phase 2 — FCM + notify-kit setup

  return {
    hasPermission: false,
    fcmToken: null as string | null,
    requestPermission: async (): Promise<boolean> => {
      // placeholder
      return false;
    },
    registerToken: async () => { /* placeholder */ },
  };
}

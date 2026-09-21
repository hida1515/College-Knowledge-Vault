/**
 * QueryClient Configuration
 * College Knowledge Vault
 *
 * TanStack Query v5 client instance.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 24 * 60 * 60 * 1000, // 24 hours persistent cache
      retry: (failureCount, error: any) => {
        if (error?.message?.toLowerCase().includes('network')) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false, // Not relevant for mobile
      refetchOnReconnect: true,
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 1,
    },
  },
});

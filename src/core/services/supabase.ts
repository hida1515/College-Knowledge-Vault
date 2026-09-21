/**
 * Supabase Client Service
 * College Knowledge Vault
 *
 * Initializes and exports the Supabase client singleton
 * with MMKV-backed session persistence.
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/supabaseConstants';
import { mmkvStorageAdapter } from './mmkvStorage';

/**
 * Singleton Supabase client with:
 * - Full Database type safety
 * - MMKV storage for session persistence (fast, synchronous)
 * - Auto-refresh tokens enabled
 * - URL detection disabled (not applicable in React Native)
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: mmkvStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

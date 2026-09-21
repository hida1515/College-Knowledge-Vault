/**
 * MMKV Storage Adapter for Supabase Auth
 * College Knowledge Vault
 *
 * Provides a synchronous storage backend for Supabase's auth session
 * persistence using react-native-mmkv instead of AsyncStorage.
 * MMKV is significantly faster and doesn't require async/await.
 */

import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';

/** Dedicated MMKV instance for auth tokens — isolated from app storage */
let _authStorage: MMKV | null = null;
function getAuthStorage(): MMKV {
  if (!_authStorage) {
    _authStorage = createMMKV({ id: 'supabase-auth' });
  }
  return _authStorage;
}

/** General-purpose MMKV instance for app-level storage */
let _appStorage: MMKV | null = null;
function getAppStorage(): MMKV {
  if (!_appStorage) {
    _appStorage = createMMKV({ id: 'college-kv-app' });
  }
  return _appStorage;
}

/**
 * Supabase-compatible storage adapter.
 * Implements getItem/setItem/removeItem with the interface
 * that Supabase expects, backed by synchronous MMKV.
 */
export const mmkvStorageAdapter = {
  getItem: (key: string): string | null => {
    const value = getAuthStorage().getString(key);
    return value ?? null;
  },

  setItem: (key: string, value: string): void => {
    getAuthStorage().set(key, value);
  },

  removeItem: (key: string): void => {
    getAuthStorage().remove(key);
  },
};

/**
 * General-purpose app storage accessor.
 * Used for onboarding flags, recent searches, preferences, etc.
 */
export const appStorage = {
  getString: (key: string): string | undefined => getAppStorage().getString(key),
  getBoolean: (key: string): boolean | undefined => getAppStorage().getBoolean(key),
  getNumber: (key: string): number | undefined => getAppStorage().getNumber(key),
  set: (key: string, value: string | boolean | number): void => getAppStorage().set(key, value),
  delete: (key: string): void => {
    getAppStorage().remove(key);
  },
};

/**
 * Clears all stored Supabase sessions and tokens across MMKV instances.
 */
export function clearSupabaseSession(): void {
  try {
    storage.delete('supabase-auth-token');
    const allKeys = storage.getAllKeys();
    allKeys.forEach((key) => storage.delete(key));
  } catch {}
  try {
    storage.clearAll();
  } catch {}
}

/**
 * Unified storage accessor providing clearAll, delete, and getAllKeys functionality
 */
export const storage = {
  delete: (key: string): void => {
    try {
      const anyAuthStore = getAuthStorage() as any;
      if (typeof anyAuthStore.delete === 'function') {
        anyAuthStore.delete(key);
      } else if (typeof anyAuthStore.remove === 'function') {
        anyAuthStore.remove(key);
      }
    } catch {}

    try {
      getAppStorage().remove(key);
    } catch {}
  },
  getAllKeys: (): string[] => {
    try {
      const authKeys = typeof getAuthStorage().getAllKeys === 'function' ? getAuthStorage().getAllKeys() : [];
      const appKeys = typeof getAppStorage().getAllKeys === 'function' ? getAppStorage().getAllKeys() : [];
      return Array.from(new Set([...authKeys, ...appKeys]));
    } catch {
      return [];
    }
  },
  clearAll: (): void => {
    try {
      getAuthStorage().clearAll();
    } catch {}
    try {
      getAppStorage().clearAll();
    } catch {}
  },
};


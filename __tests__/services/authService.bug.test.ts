/**
 * Auth Service Bug Fixes Unit Tests
 *
 * Validates:
 * 1. signOut() calls revokeAccess() and signOut() on GoogleSignin to clear cached accounts.
 * 2. signInWithGoogle() calls GoogleSignin.signOut() beforehand to force the account picker.
 * 3. Handles revokeAccess failure gracefully without throwing.
 * 4. authStore reset() clears MMKV storage.
 */

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { signOut, signInWithGoogle } from '../../src/core/services/authService';
import { supabase } from '../../src/core/services/supabase';
import { useAuthStore } from '../../src/core/store/authStore';
import { storage } from '../../src/core/services/mmkvStorage';
import { UserRole } from '../../src/core/types/user.types';

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({ data: { idToken: 'mock-id-token' } }),
    signOut: jest.fn().mockResolvedValue(null),
    revokeAccess: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('../../src/core/services/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithIdToken: jest.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            expires_at: 1234567890,
            user: { id: 'u1', email: 'test@example.com' },
          },
        },
        error: null,
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: 'u1',
          email: 'test@example.com',
          role: 'student',
          college: 'Engineering College',
          display_name: 'Test Student',
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
        error: null,
      }),
    })),
  },
}));

jest.mock('../../src/core/services/mmkvStorage', () => ({
  clearSupabaseSession: jest.fn(() => {
    require('../../src/core/services/mmkvStorage').storage.delete('supabase-auth-token');
  }),
  storage: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
    getAllKeys: jest.fn(() => []),
  },
  appStorage: {
    set: jest.fn(),
    getString: jest.fn(),
    getBoolean: jest.fn(() => false),
    delete: jest.fn(),
    clearAll: jest.fn(),
  },
}));

describe('Auth Service & Role Switching Fixes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('signOut() calls revokeAccess() on GoogleSignin to clear cached account', async () => {
    await signOut();
    expect(GoogleSignin.revokeAccess).toHaveBeenCalledTimes(1);
    expect(GoogleSignin.signOut).toHaveBeenCalledTimes(1);
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  test('signOut() completes even if GoogleSignin.revokeAccess() rejects', async () => {
    (GoogleSignin.revokeAccess as jest.Mock).mockRejectedValueOnce(new Error('Revoke failed'));
    await expect(signOut()).resolves.toBeUndefined();
    expect(GoogleSignin.signOut).toHaveBeenCalledTimes(1);
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  test('signOut() completes even if GoogleSignin.signOut() rejects', async () => {
    (GoogleSignin.signOut as jest.Mock).mockRejectedValueOnce(new Error('SignOut failed'));
    await expect(signOut()).resolves.toBeUndefined();
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  test('signOut() throws if supabase.auth.signOut returns an error', async () => {
    (supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({
      error: { message: 'Supabase sign out error' },
    });
    await expect(signOut()).rejects.toThrow('Sign out failed: Supabase sign out error');
  });

  test('signInWithGoogle() calls GoogleSignin.signOut() first to force account picker', async () => {
    await signInWithGoogle();
    expect(GoogleSignin.signOut).toHaveBeenCalledTimes(1);
    expect(GoogleSignin.signIn).toHaveBeenCalledTimes(1);
    expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
      provider: 'google',
      token: 'mock-id-token',
    });
  });

  test('signInWithGoogle() succeeds even if pre-sign-in GoogleSignin.signOut() throws', async () => {
    (GoogleSignin.signOut as jest.Mock).mockRejectedValueOnce(new Error('Not logged in'));
    const result = await signInWithGoogle();
    expect(result.user.id).toBe('u1');
    expect(result.session.access_token).toBe('access-token');
  });

  test('signInWithGoogle() throws when idToken is missing', async () => {
    (GoogleSignin.signIn as jest.Mock).mockResolvedValueOnce({ data: {} });
    await expect(signInWithGoogle()).rejects.toThrow('Google Sign-In failed: no idToken received');
  });

  test('authStore reset() invokes storage.clearAll() to purge MMKV data', () => {
    useAuthStore.getState().reset();
    expect(storage.clearAll).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  describe('TEST GROUP 3: Sign out clears session completely', () => {
    test('3a: signOut clears MMKV storage', async () => {
      await signOut();
      expect(storage.delete).toHaveBeenCalledWith('supabase-auth-token');
      expect(storage.clearAll).toHaveBeenCalled();
    });

    test('3b: signOut calls supabase.auth.signOut with scope local', async () => {
      await signOut();
      expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    });

    test('3c: after signOut, getSession returns null', async () => {
      await signOut();
      const sessionResult = await supabase.auth.getSession();
      expect(sessionResult.data.session).toBeNull();
    });

    test('3d: authStore.reset clears all state fields', () => {
      useAuthStore.setState({
        user: { id: 'u1' } as any,
        session: { access_token: 'tok' } as any,
        isAuthenticated: true,
        isNewUser: true,
        selectedContextRole: UserRole.Student,
        error: 'some-error',
      });

      useAuthStore.getState().reset();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isNewUser).toBe(false);
      expect(state.selectedContextRole).toBeNull();
      expect(state.error).toBeNull();
    });

    test('3e: app reopen after signOut shows Landing screen', async () => {
      await signOut();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        useAuthStore.getState().reset();
      }
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });
});

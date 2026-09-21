/**
 * Auth Store — Zustand
 * College Knowledge Vault
 *
 * Phase 2: Full auth state management with session restoration,
 * onboarding tracking, and auth state change listener.
 */

import { create } from 'zustand';
import { User, Session, UserProfile, EffectiveRole, UserRole } from '../types/user.types';
import { appStorage, storage, clearSupabaseSession } from '../services/mmkvStorage';
import {
  restoreSession,
  onAuthStateChange,
  getCurrentUser,
} from '../services/authService';
import { supabase } from '../services/supabase';
import { STORAGE_KEYS } from '../constants/appConstants';
import {
  computeEffectiveRole,
  canSubmitEntries,
  canModerate,
  canManageCollege,
  canAccessSuperAdmin,
} from '../utils/roleChecker';

export interface AuthState {
  /** Current user profile from public.users */
  user: User | null;
  /** Current Supabase auth session */
  session: Session | null;
  /** True while restoring session on app launch */
  isLoading: boolean;
  /** True while actively signing in/out */
  isAuthenticating: boolean;
  /** Derived: user is logged in */
  isAuthenticated: boolean;
  /** True if onboarding has been completed */
  hasOnboarded: boolean;
  /** Brand-new user flag */
  isNewUser: boolean;
  /** Context role chosen from Landing portal (Student, Faculty, College Admin, Super Admin) */
  selectedContextRole: UserRole | 'college_admin' | 'super_admin' | null;
  /** Error message from auth operations */
  error: string | null;

  // Role helpers
  getEffectiveRole: () => import('../types/user.types').EffectiveRole;
  canSubmit: () => boolean;
  canModerate: () => boolean;
  canManageCollege: () => boolean;
  canAccessAdmin: () => boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  setAuthenticating: (isAuthenticating: boolean) => void;
  setError: (error: string | null) => void;
  setHasOnboarded: (value: boolean) => void;
  setIsNewUser: (value: boolean) => void;
  setSelectedContextRole: (role: UserRole | 'college_admin' | 'super_admin' | null) => void;
  refreshProfile: () => Promise<User | null>;
  initializeAuth: () => Promise<void>;
  signOut: () => void;
  reset: () => void;
}

const initialState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticating: false,
  isAuthenticated: false,
  hasOnboarded: appStorage.getBoolean(STORAGE_KEYS.ONBOARDING_COMPLETE) ?? false,
  isNewUser: false,
  selectedContextRole: null,
  error: null,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,

  getEffectiveRole: () => {
    const user = get().user as UserProfile | null;
    if (!user) return EffectiveRole.Student;
    return computeEffectiveRole(user);
  },

  canSubmit: () => {
    const user = get().user as UserProfile | null;
    if (!user) return false;
    return canSubmitEntries(user);
  },

  canModerate: () => {
    const user = get().user as UserProfile | null;
    if (!user) return false;
    return canModerate(user);
  },

  canManageCollege: () => {
    const user = get().user as UserProfile | null;
    if (!user) return false;
    return canManageCollege(user);
  },

  canAccessAdmin: () => {
    const user = get().user as UserProfile | null;
    if (!user) return false;
    return canAccessSuperAdmin(user);
  },

  setUser: (user: User | null) =>
    set({ user, isAuthenticated: user !== null }),

  setSession: (session: Session | null) =>
    set({ session }),

  setLoading: (isLoading: boolean) =>
    set({ isLoading }),

  setAuthenticating: (isAuthenticating: boolean) =>
    set({ isAuthenticating }),

  setError: (error: string | null) =>
    set({ error }),

  setHasOnboarded: (value: boolean) => {
    appStorage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, value);
    set({ hasOnboarded: value });
  },

  setIsNewUser: (value: boolean) =>
    set({ isNewUser: value }),

  setSelectedContextRole: (role: UserRole | 'college_admin' | 'super_admin' | null) =>
    set({ selectedContextRole: role }),

  refreshProfile: async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        set({ user, isAuthenticated: true });
      }
      return user;
    } catch {
      return get().user;
    }
  },

  /**
   * Called once on app startup.
   * Restores persisted session and sets up auth state change listener.
   */
  initializeAuth: async () => {
    try {
      set({ isLoading: true, error: null });

      // 1. Attempt to restore persisted session
      const restored = await restoreSession();

      if (restored) {
        // Fetch fresh profile from DB on startup to capture background approvals
        const latestUser = await getCurrentUser();
        const activeUser = latestUser || restored.user;
        const isNewUser =
          !activeUser.isSuperAdmin &&
          (!activeUser.collegeId || !activeUser.college) &&
          !activeUser.pendingRoleRequest;

        set({
          session: restored.session,
          user: activeUser,
          isAuthenticated: true,
          isNewUser,
          isLoading: false,
        });
      } else {
        set({
          session: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }

      // 2. Listen for auth state changes (token refresh, sign out, etc.)
      onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          set({
            session: null,
            user: null,
            isAuthenticated: false,
            isNewUser: false,
          });
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Only refetch user if we don't already have one
          // or if the user ID changed
          const currentUser = get().user;
          if (!currentUser || currentUser.id !== session.user.id) {
            const user = await getCurrentUser();
            set({
              session,
              user,
              isAuthenticated: user !== null,
            });
          } else {
            set({ session });
          }
        }
      });
    } catch {
      set({
        isLoading: false,
        error: 'Failed to restore session',
        isAuthenticated: false,
      });
    }
  },

  signOut: () => {
    clearSupabaseSession();
    supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    appStorage.delete(STORAGE_KEYS.AUTH_TOKEN);
    appStorage.delete(STORAGE_KEYS.REFRESH_TOKEN);
    set({
      ...initialState,
      isLoading: false,
      hasOnboarded: get().hasOnboarded,
    });
  },

  reset: () => {
    clearSupabaseSession();
    storage.clearAll();
    set({
      ...initialState,
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      isNewUser: false,
      selectedContextRole: null,
      error: null,
    });
  },
}));

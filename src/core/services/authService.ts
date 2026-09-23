/**
 * Auth Service
 * College Knowledge Vault
 *
 * Phase 2 & 3: Google OAuth + Supabase auth implementation
 * with robust session restoration and profile fetching (.maybeSingle()).
 */

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';
import { clearSupabaseSession } from './mmkvStorage';
import { useAuthStore } from '../store/authStore';
import { GOOGLE_WEB_CLIENT_ID } from '../constants/supabaseConstants';
import { User, UserProfile, UserRole, Session, College, mapDbUserToUser } from '../types/user.types';
import type { DbUser } from '../types/database.types';
import { validateInviteCode, recordUserCode } from './inviteCodeService';

/**
 * Initiates Google Sign-In flow and authenticates with Supabase.
 * Flow: Google Sign-In → get idToken → Supabase signInWithIdToken → fetch/create profile.
 */
export async function signInWithGoogle(): Promise<{
  session: Session;
  user: User;
  isNewUser: boolean;
}> {
  // Ensure GoogleSignin is configured before sign-in call
  try {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
  } catch {
    // Ignore configuration error if already configured
  }

  // 1. Check Google Play Services
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  // 2. Force account picker by clearing any previous cached Google sign-in session
  try {
    await GoogleSignin.signOut();
  } catch {
    // Ignore error if already signed out
  }

  // 3. Trigger Google Sign-In popup
  const signInResult = await GoogleSignin.signIn();

  const idToken = signInResult.data?.idToken;
  if (!idToken) {
    throw new Error('Google Sign-In failed: no idToken received');
  }

  // 4. Authenticate with Supabase using Google idToken
  const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (authError) {
    throw new Error(`Supabase auth failed: ${authError.message}`);
  }

  if (!authData.session) {
    throw new Error('Supabase auth failed: no session returned');
  }

  // 5. Fetch the user profile from public.users using .maybeSingle() to prevent throw
  const { data, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.session.user.id)
    .maybeSingle();

  let dbUser = data as DbUser | null;
  const isSuperAdminEmail = authData.session.user.email?.toLowerCase() === 'hidagafoor05@gmail.com';

  const isDeletedUser = Boolean(
    dbUser &&
      (dbUser.display_name === 'Deleted User' ||
        dbUser.email?.startsWith('deleted-'))
  );

  if (!dbUser || isDeletedUser) {
    // 1. Try secure RPC first
    try {
      const { data: rpcUser, error: rpcErr } = await supabase.rpc('ensure_user_profile');
      if (!rpcErr && rpcUser) {
        dbUser = rpcUser as DbUser;
      }
    } catch {
      // RPC may not exist yet, fallback to client upsert
    }

    // 2. Client-side upsert with verified baseline columns
    if (!dbUser || isDeletedUser) {
      const newProfile = {
        id: authData.session.user.id,
        email: authData.session.user.email ?? '',
        display_name:
          authData.session.user.user_metadata?.full_name ??
          authData.session.user.user_metadata?.name ??
          authData.session.user.email?.split('@')[0] ??
          'User',
        avatar_url: authData.session.user.user_metadata?.avatar_url ?? null,
        role: 'student' as const,
        is_super_admin: isSuperAdminEmail,
        college: '',
        college_id: null,
        department: '',
      };
      await supabase.from('users').upsert(newProfile);
      const { data: refetched } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.session.user.id)
        .maybeSingle();
      dbUser = refetched as DbUser | null;
    }

    // 3. Resilient synthesis fallback: if table insert was blocked by RLS, construct active profile
    if (!dbUser) {
      dbUser = {
        id: authData.session.user.id,
        email: authData.session.user.email ?? '',
        display_name:
          authData.session.user.user_metadata?.full_name ??
          authData.session.user.user_metadata?.name ??
          authData.session.user.email?.split('@')[0] ??
          'User',
        avatar_url: authData.session.user.user_metadata?.avatar_url ?? null,
        role: 'student',
        college: '',
        college_id: null,
        department: '',
        graduation_year: null,
        joining_year: null,
        program: null,
        program_type: null,
        program_duration: 4,
        is_verified: false,
        is_super_admin: isSuperAdminEmail,
        is_college_admin: false,
        is_senior_revoked: false,
        faculty_verified_by: null,
        faculty_verified_at: null,
        college_admin_verified_by: null,
        college_admin_verified_at: null,
        pending_role_request: null,
        joined_via_code: null,
        code_type: null,
        fcm_token: null,
        entry_count: 0,
        total_upvotes_received: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  } else if (!dbUser.is_super_admin && isSuperAdminEmail) {
    await supabase
      .from('users')
      .update({ is_super_admin: true })
      .eq('id', dbUser.id);
    dbUser.is_super_admin = true;
  }

  if (!dbUser) {
    throw new Error(`Failed to fetch user profile: ${userError?.message ?? 'user not found'}`);
  }

  // 6. Determine if this is a new / unassigned user (no college assigned and no pending request)
  const isNewUser =
    !dbUser.is_super_admin &&
    (!dbUser.college_id || dbUser.college === '') &&
    !dbUser.pending_role_request;

  return {
    session: authData.session,
    user: mapDbUserToUser(dbUser),
    isNewUser,
  };
}

/**
 * Signs the current user out and clears session data.
 * Calls revokeAccess() and signOut() to ensure cached accounts are completely removed.
 */
export async function signOut(): Promise<void> {
  // 1. Revoke Google token access
  try {
    await GoogleSignin.revokeAccess();
  } catch {
    // Revoke access failure is non-critical
  }

  // 2. Sign out from Google to prevent auto-selecting same account
  try {
    await GoogleSignin.signOut();
  } catch {
    // Google sign-out failure is non-critical
  }

  // 3. Invalidate local Supabase auth session
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) {
    throw new Error(`Sign out failed: ${error.message}`);
  }

  // 4. Clear all stored MMKV session keys
  clearSupabaseSession();

  // 5. Reset global state
  useAuthStore.getState().reset();
}

/**
 * Fetches user profile by user ID from public.users.
 * Uses .maybeSingle() to return null instead of throwing when row is missing.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  const dbUser = data as DbUser | null;

  if (error || !dbUser) {
    return null;
  }

  const baseUser = mapDbUserToUser(dbUser);
  return {
    ...baseUser,
    totalEntries: baseUser.entryCount,
    totalUpvotes: baseUser.totalUpvotesReceived,
    totalViews: 0,
  };
}

/**
 * Retrieves the currently authenticated user profile from public.users.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  const dbUser = data as DbUser | null;

  if (
    error ||
    !dbUser ||
    dbUser.display_name === 'Deleted User' ||
    dbUser.email?.startsWith('deleted-')
  ) {
    return null;
  }

  return mapDbUserToUser(dbUser);
}

/**
 * Updates the role of the current user.
 */
export async function updateUserRole(
  userId: string,
  role: UserRole,
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
    .select('*')
    .single();

  const dbUser = data as DbUser | null;

  if (error || !dbUser) {
    throw new Error(`Failed to update role: ${error?.message ?? 'unknown error'}`);
  }

  return mapDbUserToUser(dbUser);
}

/**
 * Completes role selection and updates user details (role, college, department, graduation_year, joined_via_code).
 */
export async function completeRoleSelection(
  userId: string,
  payload: {
    role: UserRole;
    college: string;
    collegeId?: string | null;
    department: string;
    joiningYear?: number | null;
    program?: string | null;
    programType?: 'ug' | 'pg' | 'phd' | null;
    programDuration?: number | null;
    joinedViaCode?: string | null;
    codeType?: 'student' | 'faculty' | 'college_admin' | null;
  },
): Promise<User> {
  const graduationYear =
    payload.joiningYear && payload.programDuration
      ? payload.joiningYear + payload.programDuration
      : null;

  const currentUser = useAuthStore.getState().user;
  const { data: { session } } = await supabase.auth.getSession();
  const email = session?.user?.email || currentUser?.email || '';
  const displayName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    currentUser?.displayName ||
    session?.user?.email?.split('@')[0] ||
    'User';
  const avatarUrl =
    session?.user?.user_metadata?.avatar_url ||
    currentUser?.avatarUrl ||
    null;

  // Try updating with full program and invite code fields
  const updateFields: Record<string, any> = {
    email,
    display_name: displayName,
    avatar_url: avatarUrl,
    role: payload.role,
    college: payload.college,
    college_id: payload.collegeId ?? null,
    department: payload.department,
    joining_year: payload.joiningYear ?? null,
    program: payload.program ?? null,
    program_type: payload.programType ?? null,
    program_duration: payload.programDuration ?? null,
    graduation_year: graduationYear,
  };

  if (payload.joinedViaCode) {
    updateFields.joined_via_code = payload.joinedViaCode;
  }
  if (payload.codeType) {
    updateFields.code_type = payload.codeType;
  }

  const { data, error } = await supabase
    .from('users')
    .upsert({ id: userId, ...updateFields })
    .select('*')
    .single();

  if (error) {
    // Fallback if schema cache or migration column is not yet loaded in DB
    if (
      error.message.includes('joining_year') ||
      error.message.includes('joined_via_code') ||
      error.message.includes('program_type') ||
      error.message.includes('schema cache')
    ) {
      const fallbackFields: Record<string, any> = {
        email,
        display_name: displayName,
        avatar_url: avatarUrl,
        role: payload.role,
        college: payload.college,
        college_id: payload.collegeId ?? null,
        department: payload.department,
        graduation_year: graduationYear,
      };
      if (payload.joinedViaCode) {
        fallbackFields.joined_via_code = payload.joinedViaCode;
      }
      if (payload.codeType) {
        fallbackFields.code_type = payload.codeType;
      }

      const { data: fallbackData, error: fallbackError } = await supabase
        .from('users')
        .upsert({ id: userId, ...fallbackFields })
        .select('*')
        .single();

      if (fallbackError || !fallbackData) {
        throw new Error(`Failed to update profile: ${fallbackError?.message ?? 'unknown error'}`);
      }
      const mappedUser = mapDbUserToUser(fallbackData as DbUser);
      return {
        ...mappedUser,
        joiningYear: payload.joiningYear ?? null,
        program: payload.program ?? null,
        programType: payload.programType ?? null,
        programDuration: payload.programDuration ?? null,
        joinedViaCode: payload.joinedViaCode ?? mappedUser.joinedViaCode,
        codeType: (payload.codeType === 'student' || payload.codeType === 'faculty') ? payload.codeType : mappedUser.codeType,
      };
    }
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  const dbUser = data as DbUser | null;

  if (!dbUser) {
    throw new Error('Failed to update profile: unknown error');
  }

  return mapDbUserToUser(dbUser);
}

/**
 * Verifies an invite code for an existing user whose joined_via_code is null.
 * Validates that the code belongs to their current college.
 */
export async function verifyExistingUserCode(
  userId: string,
  code: string,
): Promise<{
  isValid: boolean;
  college: College | null;
  errorMessage: string | null;
}> {
  const result = await validateInviteCode(code);
  if (!result.isValid || !result.college) {
    return {
      isValid: false,
      college: null,
      errorMessage: result.errorMessage || 'Invalid invite code.',
    };
  }

  // Record the code on the user
  await recordUserCode(userId, code, result.codeType || 'student');
  return {
    isValid: true,
    college: result.college,
    errorMessage: null,
  };
}

/**
 * Restores the user session from persisted tokens (MMKV).
 * Returns the session and user if valid, or null if expired/missing.
 */
export async function restoreSession(): Promise<{
  session: Session;
  user: User;
} | null> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  const { data, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  const dbUser = data as DbUser | null;

  if (
    userError ||
    !dbUser ||
    dbUser.display_name === 'Deleted User' ||
    dbUser.email?.startsWith('deleted-')
  ) {
    return null;
  }

  return {
    session,
    user: mapDbUserToUser(dbUser),
  };
}

/**
 * Subscribes to Supabase auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void,
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    },
  );

  return () => subscription.unsubscribe();
}

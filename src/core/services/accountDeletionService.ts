/**
 * Account Deletion Service
 * College Knowledge Vault
 *
 * Implements Google Play Policy compliant account deletion.
 * Anonymizes personal details, purges bookmarks/upvotes/requests,
 * soft-deletes authored entries, deletes auth user, and purges local sessions.
 */

import { supabase } from './supabase';
import { useAuthStore } from '../store/authStore';
import { clearSupabaseSession } from './mmkvStorage';
import { signOut } from './authService';

export async function deleteUserAccount(userId: string): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to delete account.');
  }

  // 1. Call server-side RPC to perform secure deletion and anonymization in a single transaction
  const { error: rpcError } = await supabase.rpc('delete_user_account', {
    user_id: userId,
  });

  if (rpcError) {
    // Fallback: If RPC is not available yet, perform client-side operations
    try {
      await supabase.from('bookmarks').delete().eq('user_id', userId);
      await supabase.from('entry_upvotes').delete().eq('user_id', userId);
      await supabase.from('invite_code_uses').delete().eq('user_id', userId);
      await supabase.from('faculty_requests').delete().eq('user_id', userId);
      await supabase.from('college_admin_requests').delete().eq('user_id', userId);

      await supabase
        .from('entries')
        .update({ is_deleted: true })
        .eq('author_id', userId);

      await supabase
        .from('users')
        .update({
          email: `deleted-${userId}@deleted.com`,
          display_name: 'Deleted User',
          avatar_url: null,
          fcm_token: null,
          college: '',
          college_id: null,
          department: '',
          graduation_year: null,
          role: 'student',
        })
        .eq('id', userId);
    } catch {
      throw new Error(rpcError.message || 'Failed to delete account.');
    }
  }

  // 2. Clear Google session, Supabase auth session, MMKV storage & local state
  try {
    await signOut();
  } catch {}

  try {
    clearSupabaseSession();
  } catch {}

  try {
    useAuthStore.getState().reset();
  } catch {}
}

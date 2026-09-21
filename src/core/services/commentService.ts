/**
 * Comment Service
 * College Knowledge Vault
 *
 * Backend routines for entry discussions & 1-level nested threaded replies.
 */

import { supabase } from './supabase';

export interface CommentAuthor {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  role?: string;
  department?: string | null;
}

export interface EntryComment {
  id: string;
  entryId: string;
  userId: string;
  parentCommentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
  replies?: EntryComment[];
}

export interface CreateCommentParams {
  entryId: string;
  userId: string;
  content: string;
  parentCommentId?: string | null;
}

interface RawCommentRow {
  id: string;
  entry_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  users?: {
    id?: string;
    display_name?: string | null;
    avatar_url?: string | null;
    role?: string | null;
    department?: string | null;
  } | null;
}

/**
 * Fetches all active comments and nested replies for an entry.
 */
export async function getEntryComments(entryId: string): Promise<EntryComment[]> {
  const { data, error } = await supabase
    .from('entry_comments')
    .select(`
      id,
      entry_id,
      user_id,
      parent_comment_id,
      content,
      is_deleted,
      created_at,
      updated_at,
      users!user_id (
        id,
        display_name,
        avatar_url,
        role,
        department
      )
    `)
    .eq('entry_id', entryId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error || !data) {
    console.warn('Error fetching entry comments:', error);
    return [];
  }

  const rawRows = data as unknown as RawCommentRow[];

  // Convert raw rows to EntryComment items
  const commentMap = new Map<string, EntryComment>();
  const topLevelComments: EntryComment[] = [];

  rawRows.forEach((row) => {
    const commentItem: EntryComment = {
      id: row.id,
      entryId: row.entry_id,
      userId: row.user_id,
      parentCommentId: row.parent_comment_id,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      author: {
        id: row.users?.id || row.user_id,
        displayName: row.users?.display_name || 'Community Member',
        avatarUrl: row.users?.avatar_url || null,
        role: row.users?.role || 'student',
        department: row.users?.department || null,
      },
      replies: [],
    };

    commentMap.set(commentItem.id, commentItem);
  });

  // Assemble 1-level hierarchy
  rawRows.forEach((row) => {
    const item = commentMap.get(row.id)!;
    if (item.parentCommentId && commentMap.has(item.parentCommentId)) {
      const parent = commentMap.get(item.parentCommentId)!;
      parent.replies = parent.replies || [];
      parent.replies.push(item);
    } else {
      topLevelComments.push(item);
    }
  });

  return topLevelComments;
}

/**
 * Adds a new comment or reply to an entry.
 */
export async function addComment(params: CreateCommentParams): Promise<EntryComment> {
  const cleanContent = params.content.trim();

  if (!cleanContent) {
    throw new Error('Comment cannot be empty.');
  }

  if (cleanContent.length > 500) {
    throw new Error('Comment cannot exceed 500 characters.');
  }

  const { data, error } = await supabase
    .from('entry_comments')
    .insert({
      entry_id: params.entryId,
      user_id: params.userId,
      parent_comment_id: params.parentCommentId || null,
      content: cleanContent,
    })
    .select(`
      id,
      entry_id,
      user_id,
      parent_comment_id,
      content,
      is_deleted,
      created_at,
      updated_at,
      users!user_id (
        id,
        display_name,
        avatar_url,
        role,
        department
      )
    `)
    .single();

  if (error || !data) {
    console.error('Error adding comment:', error);
    throw new Error(error?.message || 'Failed to post comment');
  }

  const row = data as unknown as RawCommentRow;
  return {
    id: row.id,
    entryId: row.entry_id,
    userId: row.user_id,
    parentCommentId: row.parent_comment_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      id: row.users?.id || row.user_id,
      displayName: row.users?.display_name || 'You',
      avatarUrl: row.users?.avatar_url || null,
      role: row.users?.role || 'student',
      department: row.users?.department || null,
    },
    replies: [],
  };
}

/**
 * Soft deletes a comment.
 */
export async function deleteComment(commentId: string, _userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('entry_comments')
    .update({ is_deleted: true })
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    throw new Error(error.message);
  }

  return true;
}

/**
 * Gets total active comment count for an entry.
 */
export async function getCommentCount(entryId: string): Promise<number> {
  const { count, error } = await supabase
    .from('entry_comments')
    .select('id', { count: 'exact', head: true })
    .eq('entry_id', entryId)
    .eq('is_deleted', false);

  if (error) return 0;
  return count ?? 0;
}

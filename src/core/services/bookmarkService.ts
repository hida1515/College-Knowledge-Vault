/**
 * Bookmark Service
 * College Knowledge Vault
 *
 * Handles bookmarking/unbookmarking entries and fetching user saved entries.
 */

import { supabase } from './supabase';
import { Entry, EntryType, EntryStatus } from '../types/entry.types';

export async function isBookmarked(
  entryId: string,
  userId: string,
): Promise<boolean> {
  if (!entryId || !userId) return false;

  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('entry_id', entryId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }
  return true;
}

export async function toggleBookmark(
  entryId: string,
  userId: string,
): Promise<{ bookmarked: boolean }> {
  if (!entryId || !userId) {
    throw new Error('entryId and userId are required to toggle bookmark');
  }

  // Check if bookmark already exists
  const alreadyBookmarked = await isBookmarked(entryId, userId);

  if (alreadyBookmarked) {
    const { error: deleteError } = await supabase
      .from('bookmarks')
      .delete()
      .eq('entry_id', entryId)
      .eq('user_id', userId);

    if (deleteError) {
      throw new Error(`Failed to remove bookmark: ${deleteError.message}`);
    }
    return { bookmarked: false };
  } else {
    const { error: insertError } = await supabase
      .from('bookmarks')
      .insert({
        entry_id: entryId,
        user_id: userId,
      });

    if (insertError) {
      throw new Error(`Failed to add bookmark: ${insertError.message}`);
    }
    return { bookmarked: true };
  }
}

export async function getUserBookmarks(userId: string): Promise<Entry[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      id,
      created_at,
      entries (
        id,
        author_id,
        college_id,
        title,
        description,
        type,
        status,
        subject,
        semester,
        upvote_count,
        view_count,
        outdated_count,
        is_marked_outdated,
        project_details,
        viva_details,
        mistake_details,
        resource_details,
        created_at,
        updated_at,
        is_deleted,
        users (
          display_name,
          avatar_url,
          college,
          department,
          graduation_year
        ),
        entry_tags (
          tags (
            name
          )
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  const entries: Entry[] = [];

  for (const row of data) {
    const e = (row as any).entries;
    if (!e || e.is_deleted || e.status !== 'approved') {
      continue;
    }

    const tags = (e.entry_tags || [])
      .map((et: any) => et?.tags?.name)
      .filter(Boolean);

    entries.push({
      id: e.id,
      authorId: e.author_id,
      collegeId: e.college_id,
      authorName: e.users?.display_name || 'Anonymous',
      authorAvatarUrl: e.users?.avatar_url || null,
      authorCollege: e.users?.college || '',
      authorDepartment: e.users?.department || '',
      authorGraduationYear: e.users?.graduation_year || null,
      title: e.title,
      description: e.description,
      type: e.type as EntryType,
      status: e.status as EntryStatus,
      tags,
      subject: e.subject || '',
      semester: e.semester || 1,
      upvoteCount: e.upvote_count || 0,
      viewCount: e.view_count || 0,
      isUpvotedByCurrentUser: false,
      isBookmarkedByCurrentUser: true,
      outdatedCount: e.outdated_count || 0,
      isMarkedOutdated: e.is_marked_outdated || false,
      projectDetails: e.project_details || null,
      vivaDetails: e.viva_details || null,
      mistakeDetails: e.mistake_details || null,
      resourceDetails: e.resource_details || null,
      createdAt: e.created_at,
      updatedAt: e.updated_at,
    });
  }

  return entries;
}

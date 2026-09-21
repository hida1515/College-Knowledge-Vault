/**
 * Entry Service
 * College Knowledge Vault
 *
 * Full Supabase implementation for entry querying, creation, tagging,
 * stats, upvoting, and view counting.
 */

import { supabase } from './supabase';
import {
  notifyEntryApproved,
  notifyEntryRejected,
  notifyFacultyNewSubmission,
} from './notificationService';
import {
  Entry,
  EntryType,
  EntryStatus,
  CreateEntryPayload,
  EntryFormData,
} from '../types/entry.types';

interface RawUserRelation {
  display_name: string | null;
  avatar_url: string | null;
  college: string | null;
  department: string | null;
  graduation_year: number | null;
}

interface RawTagRelation {
  tags: {
    name: string;
  } | null;
}

const ENTRY_SELECT_QUERY = `
  *,
  users!author_id (
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
`;

interface RawEntryRow {
  id: string;
  author_id: string;
  college_id?: string | null;
  title: string;
  description: string;
  type: string;
  status: string;
  subject: string | null;
  semester: number | null;
  upvote_count: number | null;
  view_count: number | null;
  outdated_count?: number | null;
  is_marked_outdated?: boolean | null;
  rejection_reason?: string | null;
  project_details?: any;
  viva_details?: any;
  mistake_details?: any;
  resource_details?: any;
  created_at: string;
  updated_at: string;
  users?: RawUserRelation | null;
  entry_tags?: RawTagRelation[] | null;
}

function parseJsonSafe(val: any) {
  if (!val) return null;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
}

export function mapRawEntryToEntry(raw: RawEntryRow, isUpvoted: boolean = false): Entry {
  const author: RawUserRelation =
    (Array.isArray(raw.users) ? raw.users[0] : raw.users) || {};
  const rawTags = raw.entry_tags || [];
  const tagsList = rawTags
    .map((et) => et.tags?.name)
    .filter((n): n is string => Boolean(n));

  return {
    id: raw.id,
    authorId: raw.author_id,
    collegeId: raw.college_id ?? null,
    authorName: author.display_name ?? 'Anonymous',
    authorAvatarUrl: author.avatar_url ?? null,
    authorCollege: author.college ?? '',
    authorDepartment: author.department ?? '',
    authorGraduationYear: author.graduation_year ?? null,
    title: raw.title,
    description: raw.description,
    type: raw.type as EntryType,
    status: raw.status as EntryStatus,
    tags: tagsList,
    subject: raw.subject ?? '',
    semester: raw.semester ?? 0,
    upvoteCount: raw.upvote_count ?? 0,
    viewCount: raw.view_count ?? 0,
    isUpvotedByCurrentUser: isUpvoted,
    outdatedCount: raw.outdated_count ?? 0,
    isMarkedOutdated: raw.is_marked_outdated ?? false,
    rejectionReason: raw.rejection_reason ?? null,
    projectDetails: parseJsonSafe(raw.project_details),
    vivaDetails: parseJsonSafe(raw.viva_details),
    mistakeDetails: parseJsonSafe(raw.mistake_details),
    resourceDetails: parseJsonSafe(raw.resource_details),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

/**
 * Fetches a paginated list of approved entries with optional filtering and sorting.
 */
export async function getApprovedEntries(params: {
  type?: EntryType;
  sortBy?: 'created_at' | 'upvote_count';
  department?: string;
  semesterRange?: [number, number];
  limit?: number;
  offset?: number;
}): Promise<Entry[]> {
  const limit = params.limit ?? 10;
  const offset = params.offset ?? 0;
  const sortBy = params.sortBy ?? 'created_at';

  // Get current user for upvote check
  const { data: { session } } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id ?? null;

  let query = supabase
    .from('entries')
    .select(`
      *,
      users!inner (
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
    `)
    .eq('status', 'approved')
    .eq('is_deleted', false);

  if (params.type) {
    query = query.eq('type', params.type);
  }

  if (params.department) {
    query = query.eq('users.department', params.department);
  }

  if (params.semesterRange) {
    query = query
      .gte('semester', params.semesterRange[0])
      .lte('semester', params.semesterRange[1]);
  }

  query = query
    .order(sortBy, { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  // Get upvotes for current user if logged in
  let upvotedEntryIds = new Set<string>();
  if (currentUserId && data.length > 0) {
    const entryIds = (data as unknown as RawEntryRow[]).map((item) => item.id);
    const { data: upvoteData } = await supabase
      .from('entry_upvotes')
      .select('entry_id')
      .eq('user_id', currentUserId)
      .in('entry_id', entryIds);

    if (upvoteData) {
      upvotedEntryIds = new Set(
        upvoteData.map((u: { entry_id: string }) => u.entry_id),
      );
    }
  }

  return (data as unknown as RawEntryRow[]).map((raw) =>
    mapRawEntryToEntry(raw, upvotedEntryIds.has(raw.id)),
  );
}

/**
 * Fetches user's own submitted entries.
 */
export async function getUserEntries(userId: string): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select(ENTRY_SELECT_QUERY)
    .eq('author_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as unknown as RawEntryRow[]).map((raw) =>
    mapRawEntryToEntry(raw, false),
  );
}

/**
 * Creates a new knowledge entry with tags and viva questions.
 */
export async function createEntry(
  payload: CreateEntryPayload,
): Promise<string> {
  // FIX 15: Submission rate limit (max 5 entries per author per 24 hours)
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const query = supabase
      .from('entries')
      .select('id', { count: 'exact', head: true });

    if (query && typeof query.eq === 'function') {
      const eqQuery = query.eq('author_id', payload.authorId);
      if (eqQuery && typeof eqQuery.gte === 'function') {
        const { count, error: countError } = await eqQuery.gte('created_at', twentyFourHoursAgo);
        if (!countError && typeof count === 'number' && count >= 5) {
          throw new Error('You can submit up to 5 entries per day. Please try again tomorrow.');
        }
      }
    }
  } catch (err: any) {
    if (err?.message?.includes('5 entries per day')) {
      throw err;
    }
  }

  const insertData: Record<string, any> = {
    author_id: payload.authorId,
    college_id: payload.collegeId || null,
    title: payload.title,
    description: payload.description,
    type: payload.type,
    subject: payload.subject,
    semester: payload.semester,
    status: 'pending',
  };

  if (payload.projectDetails !== undefined && payload.projectDetails !== null) {
    insertData.project_details = typeof payload.projectDetails === 'string'
      ? payload.projectDetails
      : JSON.stringify(payload.projectDetails);
  }
  if (payload.vivaDetails !== undefined && payload.vivaDetails !== null) {
    insertData.viva_details = typeof payload.vivaDetails === 'string'
      ? payload.vivaDetails
      : JSON.stringify(payload.vivaDetails);
  }
  if (payload.mistakeDetails !== undefined && payload.mistakeDetails !== null) {
    insertData.mistake_details = typeof payload.mistakeDetails === 'string'
      ? payload.mistakeDetails
      : JSON.stringify(payload.mistakeDetails);
  }
  if (payload.resourceDetails !== undefined && payload.resourceDetails !== null) {
    insertData.resource_details = typeof payload.resourceDetails === 'string'
      ? payload.resourceDetails
      : JSON.stringify(payload.resourceDetails);
  }

  // 1. Insert main entry
  const { data: entryData, error: entryError } = await supabase
    .from('entries')
    .insert(insertData)
    .select('id')
    .single();

  if (entryError || !entryData) {
    console.error('Supabase insert error:', entryError);
    throw new Error(`Failed to create entry: ${entryError?.message ?? 'unknown error'}`);
  }

  const entryId = entryData.id;

  // 2. Process Tags
  for (const tagName of payload.tags) {
    const cleanName = tagName.trim();
    if (!cleanName) continue;

    let tagId: string | null = null;

    // Check existing tag
    const { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .eq('name', cleanName)
      .maybeSingle();

    if (existingTag) {
      tagId = existingTag.id;
    } else {
      // Insert new custom tag
      const { data: newTag } = await supabase
        .from('tags')
        .insert({
          name: cleanName,
          is_predefined: false,
        })
        .select('id')
        .single();

      if (newTag) {
        tagId = newTag.id;
      }
    }

    if (tagId) {
      await supabase
        .from('entry_tags')
        .insert({
          entry_id: entryId,
          tag_id: tagId,
        });
    }
  }

  // 3. Process Viva Questions if present
  if (payload.vivaQuestionsDetailed && payload.vivaQuestionsDetailed.length > 0) {
    const vivaRows = payload.vivaQuestionsDetailed.map((q) => ({
      entry_id: entryId,
      question: q.question,
      answer: q.answer || null,
      difficulty: q.difficulty,
    }));
    await supabase.from('viva_questions').insert(vivaRows);
  } else if (payload.vivaQuestions && payload.vivaQuestions.length > 0) {
    const vivaRows = payload.vivaQuestions.map((q) => ({
      entry_id: entryId,
      question: q.question,
      answer: q.answer || null,
      difficulty: q.difficulty,
    }));

    await supabase.from('viva_questions').insert(vivaRows);
  }

  // FIX 13: Notify faculty in the same college of a new submission
  if (payload.collegeId) {
    supabase
      .from('users')
      .select('display_name')
      .eq('id', payload.authorId)
      .single()
      .then(({ data: authorUser }) => {
        const authorName = authorUser?.display_name || 'A student';
        notifyFacultyNewSubmission(payload.collegeId!, entryId, payload.title, authorName).catch((e) => {
          console.warn('Failed to notify faculty of new submission:', e);
        });
      });
  }

  return entryId;
}

/**
 * Gets tag names for a given entry.
 */
export async function getEntryTags(entryId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('entry_tags')
    .select('tags(name)')
    .eq('entry_id', entryId);

  if (error || !data) {
    return [];
  }

  return (data as unknown as RawTagRelation[])
    .map((item) => item.tags?.name)
    .filter((name): name is string => Boolean(name));
}

/**
 * Aggregates user contribution statistics.
 */
export async function getUserStats(userId: string): Promise<{
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}> {
  const { data, error } = await supabase
    .from('entries')
    .select('status')
    .eq('author_id', userId)
    .eq('is_deleted', false);

  if (error || !data) {
    return { total: 0, approved: 0, pending: 0, rejected: 0 };
  }

  const stats = {
    total: data.length,
    approved: 0,
    pending: 0,
    rejected: 0,
  };

  data.forEach((row: { status: string }) => {
    if (row.status === 'approved') stats.approved++;
    else if (row.status === 'pending') stats.pending++;
    else if (row.status === 'rejected') stats.rejected++;
  });

  return stats;
}

/**
 * Toggles upvote on an entry for the specified user.
 */
export async function toggleUpvote(
  entryId: string,
  userId: string,
): Promise<{ upvoted: boolean; newCount: number }> {
  // Check if upvote exists
  const { data: existing } = await supabase
    .from('entry_upvotes')
    .select('*')
    .eq('entry_id', entryId)
    .eq('user_id', userId)
    .maybeSingle();

  let upvoted = false;

  if (existing) {
    // Delete upvote
    await supabase
      .from('entry_upvotes')
      .delete()
      .eq('entry_id', entryId)
      .eq('user_id', userId);
    upvoted = false;
  } else {
    // Insert upvote
    await supabase
      .from('entry_upvotes')
      .insert({
        entry_id: entryId,
        user_id: userId,
      });
    upvoted = true;
  }

  // Fetch updated count
  const { data: entry } = await supabase
    .from('entries')
    .select('upvote_count')
    .eq('id', entryId)
    .single();

  const newCount = entry?.upvote_count ?? 0;

  return { upvoted, newCount };
}

/**
 * Fire-and-forget view count increment.
 */
export async function incrementViewCount(entryId: string): Promise<void> {
  try {
    const { data: entry } = await supabase
      .from('entries')
      .select('view_count')
      .eq('id', entryId)
      .single();

    const currentViews = entry?.view_count ?? 0;

    await supabase
      .from('entries')
      .update({ view_count: currentViews + 1 })
      .eq('id', entryId);
  } catch {
    // Silent fail (fire & forget)
  }
}

/**
 * Fetches all tags ordered by predefined status and usage count.
 */
export async function getTags(): Promise<string[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('name')
    .order('is_predefined', { ascending: false })
    .order('usage_count', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((t: { name: string }) => t.name);
}

/**
 * Fetches a single entry with full details, tags, author, and viva questions.
 */
export async function getEntryById(entryId: string): Promise<Entry | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id ?? null;

  const { data, error } = await supabase
    .from('entries')
    .select(`
      *,
      users!author_id (
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
      ),
      viva_questions (
        id,
        question,
        answer,
        difficulty
      )
    `)
    .eq('id', entryId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  let isUpvoted = false;
  let isBookmarkedByUser = false;

  if (currentUserId) {
    const { data: upvote } = await supabase
      .from('entry_upvotes')
      .select('id')
      .eq('entry_id', entryId)
      .eq('user_id', currentUserId)
      .maybeSingle();
    isUpvoted = !!upvote;

    const { data: bookmark } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('entry_id', entryId)
      .eq('user_id', currentUserId)
      .maybeSingle();
    isBookmarkedByUser = !!bookmark;
  }

  const raw = data as unknown as RawEntryRow;
  const entry = mapRawEntryToEntry(raw, isUpvoted);
  entry.isBookmarkedByCurrentUser = isBookmarkedByUser;

  if (data.viva_questions && Array.isArray(data.viva_questions)) {
    entry.vivaQuestionsDetailed = data.viva_questions.map((v: any) => ({
      id: v.id,
      question: v.question,
      answer: v.answer || '',
      difficulty: v.difficulty || 'medium',
      frequency: 'often',
      followUpQuestions: [],
      answerTip: null,
    }));
  }

  return entry;
}

/**
 * Checks if the author has submitted an entry with similar title within last 6 months.
 */
export async function checkDuplicate(params: {
  authorId: string;
  title: string;
  type: EntryType;
}): Promise<{ isDuplicate: boolean; existingEntryId: string | null }> {
  if (!params.authorId || !params.title) {
    return { isDuplicate: false, existingEntryId: null };
  }

  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('entries')
    .select('id, title, created_at')
    .eq('author_id', params.authorId)
    .eq('type', params.type)
    .gte('created_at', sixMonthsAgo)
    .ilike('title', params.title.trim());

  if (error || !data || data.length === 0) {
    return { isDuplicate: false, existingEntryId: null };
  }

  return { isDuplicate: true, existingEntryId: data[0].id };
}

/**
 * Fetches entry data formatted for the multi-step edit submission form.
 */
export async function getEntryForEdit(entryId: string): Promise<EntryFormData> {
  const { data: entry, error } = await supabase
    .from('entries')
    .select(`
      *,
      entry_tags (
        tags (
          name
        )
      ),
      viva_questions (
        id,
        question,
        answer,
        difficulty
      )
    `)
    .eq('id', entryId)
    .single();

  if (error || !entry) {
    throw new Error(`Failed to fetch entry for edit: ${error?.message ?? 'not found'}`);
  }

  const tags = (entry.entry_tags || [])
    .map((et: any) => et?.tags?.name)
    .filter(Boolean);

  const vivaQuestions = (entry.viva_questions || []).map((v: any) => ({
    question: v.question,
    answer: v.answer || '',
    difficulty: v.difficulty as 'easy' | 'medium' | 'hard',
  }));

  const vivaQuestionsDetailed = (entry.viva_questions || []).map((v: any) => ({
    id: v.id,
    question: v.question,
    answer: v.answer || '',
    difficulty: v.difficulty as 'easy' | 'medium' | 'hard',
    frequency: 'often' as const,
    followUpQuestions: [],
    answerTip: null,
  }));

  return {
    id: entry.id,
    title: entry.title,
    description: entry.description,
    type: entry.type as EntryType,
    subject: entry.subject || '',
    semester: entry.semester ? String(entry.semester) : '',
    tags,
    projectDetails: entry.project_details || null,
    vivaDetails: entry.viva_details || null,
    mistakeDetails: entry.mistake_details || null,
    resourceDetails: entry.resource_details || null,
    rejectionReason: entry.rejection_reason || null,
    vivaQuestions,
    vivaQuestionsDetailed,
  };
}

/**
 * Updates an existing entry and resets its status to 'pending' for re-moderation.
 */
export async function updateEntry(
  entryId: string,
  updates: Partial<EntryFormData>,
): Promise<void> {
  const updatePayload: Record<string, any> = {
    status: 'pending',
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) updatePayload.title = updates.title;
  if (updates.description !== undefined) updatePayload.description = updates.description;
  if (updates.subject !== undefined) updatePayload.subject = updates.subject;
  if (updates.semester !== undefined) {
    const sem = parseInt(updates.semester, 10);
    if (!isNaN(sem)) updatePayload.semester = sem;
  }
  if (updates.projectDetails !== undefined) updatePayload.project_details = updates.projectDetails;
  if (updates.vivaDetails !== undefined) updatePayload.viva_details = updates.vivaDetails;
  if (updates.mistakeDetails !== undefined) updatePayload.mistake_details = updates.mistakeDetails;
  if (updates.resourceDetails !== undefined) updatePayload.resource_details = updates.resourceDetails;

  const { error } = await supabase
    .from('entries')
    .update(updatePayload)
    .eq('id', entryId);

  if (error) {
    throw new Error(`Failed to update entry: ${error.message}`);
  }

  // Update tags if provided
  if (updates.tags && updates.tags.length > 0) {
    await supabase.from('entry_tags').delete().eq('entry_id', entryId);

    for (const tagName of updates.tags) {
      const cleanName = tagName.trim();
      if (!cleanName) continue;

      let tagId: string | null = null;
      const { data: existingTag } = await supabase
        .from('tags')
        .select('id')
        .eq('name', cleanName)
        .maybeSingle();

      if (existingTag) {
        tagId = existingTag.id;
      } else {
        const { data: newTag } = await supabase
          .from('tags')
          .insert({ name: cleanName, is_predefined: false })
          .select('id')
          .single();
        if (newTag) tagId = newTag.id;
      }

      if (tagId) {
        await supabase.from('entry_tags').insert({
          entry_id: entryId,
          tag_id: tagId,
        });
      }
    }
  }
}

/**
 * Marks an entry as outdated. Increments outdated_count and sets is_marked_outdated when count >= 3.
 */
export async function markOutdated(
  entryId: string,
  userId: string,
  reason: string,
): Promise<void> {
  if (!entryId || !userId) {
    throw new Error('entryId and userId are required to mark outdated');
  }

  // Check if user already marked this entry
  const { data: existingMark } = await supabase
    .from('outdated_marks')
    .select('entry_id')
    .eq('entry_id', entryId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingMark) {
    return; // Already marked by user
  }

  // Insert into outdated_marks
  const { error: markError } = await supabase
    .from('outdated_marks')
    .insert({
      entry_id: entryId,
      user_id: userId,
      reason: reason || 'Outdated information',
    });

  if (markError) {
    throw new Error(`Failed to mark outdated: ${markError.message}`);
  }

  // Fetch count and update entry
  const { data: entry } = await supabase
    .from('entries')
    .select('outdated_count')
    .eq('id', entryId)
    .single();

  const newCount = (entry?.outdated_count ?? 0) + 1;
  const isMarkedOutdated = newCount >= 3;

  await supabase
    .from('entries')
    .update({
      outdated_count: newCount,
      is_marked_outdated: isMarkedOutdated,
    })
    .eq('id', entryId);
}

/**
 * Searches approved entries by title, description, viva questions, and tags.
 * Uses search_vault_entries RPC with PostgREST fallback.
 */
export async function searchEntries(params: {
  query: string;
  type?: EntryType;
  collegeId: string;
  limit?: number;
  offset?: number;
}): Promise<Entry[]> {
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;

  // 1. Attempt unified RPC search (entries, viva questions, and tags)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'search_vault_entries',
      {
        search_query: params.query,
        p_college_id: params.collegeId,
        p_entry_type: params.type ?? null,
        p_limit: limit,
        p_offset: offset,
      },
    );

    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      return rpcData.map((row: any) => ({
        id: row.id,
        authorId: row.author_id,
        collegeId: row.college_id,
        authorName: 'Verified Author',
        authorAvatarUrl: null,
        title: row.title,
        description: row.description,
        type: row.type as EntryType,
        status: row.status as EntryStatus,
        tags: [],
        subject: '',
        semester: 0,
        upvoteCount: row.upvote_count ?? 0,
        viewCount: row.view_count ?? 0,
        isUpvotedByCurrentUser: false,
        matchSource: row.match_source,
        matchSnippet: row.match_snippet,
        createdAt: row.created_at,
        updatedAt: row.created_at,
      }));
    }
  } catch {}

  // 2. Fallback query with PostgREST foreign key disambiguation (users!author_id)
  // and college_id NULL support (allowing platform-wide resources)
  let query = supabase
    .from('entries')
    .select(`
      *,
      author:users!author_id (
        display_name,
        department,
        college_id
      ),
      users!author_id (
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
    `)
    .or(`college_id.eq.${params.collegeId},college_id.is.null`)
    .eq('status', 'approved')
    .eq('is_deleted', false)
    .or(`title.ilike.%${params.query}%,description.ilike.%${params.query}%`);

  if (params.type) {
    query = query.eq('type', params.type);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return (data as unknown as RawEntryRow[]).map((raw) =>
    mapRawEntryToEntry(raw, false),
  );
}

/**
 * Fetches moderation entries (pending, approved, or rejected) for a college.
 */
export async function getCollegeModerationEntries(
  collegeId?: string | null,
  status: 'pending' | 'approved' | 'rejected' = 'pending',
): Promise<Entry[]> {
  let query = supabase
    .from('entries')
    .select(ENTRY_SELECT_QUERY)
    .eq('status', status)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (collegeId) {
    query = query.or(`college_id.eq.${collegeId},college_id.is.null`);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.warn('Error fetching moderation entries:', error);
    return [];
  }

  return (data as unknown as RawEntryRow[]).map((raw) =>
    mapRawEntryToEntry(raw, false),
  );
}

/**
 * Approves a pending entry.
 */
export async function approveEntry(
  entryId: string,
  reviewerId: string,
): Promise<boolean> {
  const { data: entryData } = await supabase
    .from('entries')
    .select('author_id, title')
    .eq('id', entryId)
    .single();

  const { error } = await supabase
    .from('entries')
    .update({
      status: 'approved',
      approved_by: reviewerId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', entryId);

  if (error) {
    console.error('Error approving entry:', error);
    throw new Error(error.message);
  }

  if (entryData?.author_id) {
    notifyEntryApproved(entryData.author_id, entryId, entryData.title || 'Untitled').catch((e) => {
      console.warn('Failed to send approval notification:', e);
    });
  }

  return true;
}

/**
 * Rejects a pending entry with reason.
 */
export async function rejectEntry(
  entryId: string,
  reviewerId: string,
  reason: string,
): Promise<boolean> {
  const { data: entryData } = await supabase
    .from('entries')
    .select('author_id, title')
    .eq('id', entryId)
    .single();

  const { error } = await supabase
    .from('entries')
    .update({
      status: 'rejected',
      approved_by: reviewerId,
      approved_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', entryId);

  if (error) {
    console.error('Error rejecting entry:', error);
    throw new Error(error.message);
  }

  if (entryData?.author_id) {
    notifyEntryRejected(entryData.author_id, entryId, entryData.title || 'Untitled', reason).catch((e) => {
      console.warn('Failed to send rejection notification:', e);
    });
  }

  return true;
}



/**
 * Storage Service
 * College Knowledge Vault
 *
 * Phase 1: Typed function signatures only — no implementation.
 * Uses AsyncStorage for non-sensitive data and MMKV for tokens.
 */

/**
 * Gets a value from AsyncStorage.
 * @param key - The storage key.
 * @returns The stored value or null.
 */
export async function getItem(key: string): Promise<string | null> {
  void key;
  // TODO: Phase 2 — AsyncStorage.getItem
  throw new Error('Not implemented');
}

/**
 * Sets a value in AsyncStorage.
 * @param key - The storage key.
 * @param value - The value to store.
 */
export async function setItem(key: string, value: string): Promise<void> {
  void key;
  void value;
  // TODO: Phase 2 — AsyncStorage.setItem
  throw new Error('Not implemented');
}

/**
 * Removes a value from AsyncStorage.
 * @param key - The storage key.
 */
export async function removeItem(key: string): Promise<void> {
  void key;
  // TODO: Phase 2 — AsyncStorage.removeItem
  throw new Error('Not implemented');
}

/**
 * Checks if onboarding has been completed.
 * @returns Whether onboarding is complete.
 */
export async function getOnboardingComplete(): Promise<boolean> {
  // TODO: Phase 2 — check AsyncStorage flag
  throw new Error('Not implemented');
}

/**
 * Marks onboarding as complete.
 */
export async function setOnboardingComplete(): Promise<void> {
  // TODO: Phase 2 — set AsyncStorage flag
  throw new Error('Not implemented');
}

/**
 * Gets recent search queries from AsyncStorage.
 * @returns Array of recent search strings.
 */
export async function getRecentSearches(): Promise<string[]> {
  // TODO: Phase 2 — parse JSON from AsyncStorage
  throw new Error('Not implemented');
}

/**
 * Saves a search query to the recent searches list.
 * @param query - The search query to save.
 */
export async function addRecentSearch(query: string): Promise<void> {
  void query;
  // TODO: Phase 2 — prepend to stored array, limit to 10
  throw new Error('Not implemented');
}

/**
 * Clears all recent searches.
 */
export async function clearRecentSearches(): Promise<void> {
  // TODO: Phase 2 — remove from AsyncStorage
  throw new Error('Not implemented');
}

/**
 * Stores auth token securely using MMKV.
 * @param token - The token string.
 */
export function setAuthToken(token: string): void {
  void token;
  // TODO: Phase 2 — MMKV.set
  throw new Error('Not implemented');
}

/**
 * Retrieves auth token from MMKV.
 * @returns The stored token or null.
 */
export function getAuthToken(): string | null {
  // TODO: Phase 2 — MMKV.getString
  throw new Error('Not implemented');
}

/**
 * Removes auth token from MMKV.
 */
export function removeAuthToken(): void {
  // TODO: Phase 2 — MMKV.delete
  throw new Error('Not implemented');
}

/**
 * Uploads a project report PDF to Supabase Storage 'project-reports' bucket.
 */
export async function uploadProjectReport(
  userId: string,
  fileName: string,
  fileData: Blob | ArrayBuffer | FormData,
): Promise<string> {
  const { supabase } = await import('./supabase');
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${userId}/${Date.now()}_${sanitizedFileName}`;

  const { data, error } = await supabase.storage
    .from('project-reports')
    .upload(filePath, fileData, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload project report: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('project-reports')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}


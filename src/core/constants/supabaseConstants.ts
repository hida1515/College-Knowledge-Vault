/**
 * Supabase & Third-party Service Constants
 * College Knowledge Vault
 *
 * Replace placeholder values with your actual credentials.
 */

// Supabase
export const SUPABASE_URL = 'https://utgkawcshgqsbvvvmizv.supabase.co'; // TODO: replace with your Supabase project URL
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0Z2thd2NzaGdxc2J2dnZtaXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTk1OTMsImV4cCI6MjEwMDU3NTU5M30.tFGa2c0D8trLAwMTAicLF5iIK90TKZeCmZQlnNshRss'; // TODO: replace with your Supabase anon key

// Algolia
export const ALGOLIA_APP_ID = 'YOUR_ALGOLIA_APP_ID'; // TODO: replace with your Algolia app ID
export const ALGOLIA_SEARCH_KEY = 'YOUR_SEARCH_KEY'; // TODO: replace with your Algolia search-only API key
export const ALGOLIA_INDEX_NAME = 'entries'; // TODO: update if using a different index name

// Google Sign-In
export const GOOGLE_WEB_CLIENT_ID = '408757967741-0haige928hocri51g74t87jeg5uqct4b.apps.googleusercontent.com'; // TODO: replace with Google OAuth Web Client ID

// TO SET YOURSELF AS SUPER ADMIN:
// 1. Sign in to the app with your Google account first
// 2. Go to Supabase Dashboard → Table Editor → users
// 3. Find your row by email
// 4. Set is_super_admin = true
// 5. Sign out and sign back in to the app
// 6. You will see the Super Admin tab in the app
// This only needs to be done ONCE for the platform owner


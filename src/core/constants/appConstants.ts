/**
 * App Constants
 * College Knowledge Vault
 *
 * All UI strings, error messages, and validation messages.
 * No hardcoded strings should appear elsewhere in the codebase.
 */

export const APP_NAME = 'College Knowledge Vault';
export const APP_TAGLINE = 'Learn from those who came before you';

/** Onboarding */
export const ONBOARDING = {
  PAGE_1_TITLE: 'Learn from Seniors',
  PAGE_1_DESCRIPTION:
    'Access real viva questions, project insights, and tech stack recommendations from graduating seniors.',
  PAGE_2_TITLE: 'Share Your Knowledge',
  PAGE_2_DESCRIPTION:
    'Submit your academic experiences to help juniors avoid the mistakes you made.',
  PAGE_3_TITLE: 'Build Together',
  PAGE_3_DESCRIPTION:
    'Upvote the best content, search by topic, and build a knowledge base that grows every year.',
  BUTTON_NEXT: 'Next',
  BUTTON_GET_STARTED: 'Get Started',
  BUTTON_SKIP: 'Skip',
} as const;

/** Auth */
export const AUTH = {
  SIGN_IN_TITLE: 'Welcome Back',
  SIGN_IN_SUBTITLE: 'Sign in with your Google account to continue',
  SIGN_IN_BUTTON: 'Continue with Google',
  SIGN_OUT_BUTTON: 'Sign Out',
  ROLE_SELECTION_TITLE: 'Choose Your Role',
  ROLE_SELECTION_SUBTITLE: 'This helps us personalize your experience',
  ROLE_STUDENT_TITLE: 'Student',
  ROLE_STUDENT_DESCRIPTION: 'Browse, search, and upvote knowledge entries',
  ROLE_SENIOR_TITLE: 'Senior',
  ROLE_SENIOR_DESCRIPTION: 'Submit and manage your academic experiences',
  ROLE_FACULTY_TITLE: 'Faculty',
  ROLE_FACULTY_DESCRIPTION: 'Moderate content and manage users',
  BUTTON_CONFIRM_ROLE: 'Confirm Role',
} as const;

/** Navigation */
export const NAV = {
  TAB_HOME: 'Home',
  TAB_SEARCH: 'Search',
  TAB_SUBMIT: 'Submit',
  TAB_PROFILE: 'Profile',
} as const;

/** Home */
export const HOME = {
  TITLE: 'Knowledge Vault',
  FILTER_ALL: 'All',
  FILTER_PROJECT: 'Projects',
  FILTER_VIVA: 'Viva',
  FILTER_MISTAKE: 'Mistakes',
  FILTER_RESOURCE: 'Resources',
  SORT_RECENT: 'Recent',
  SORT_POPULAR: 'Popular',
  EMPTY_TITLE: 'No entries yet',
  EMPTY_DESCRIPTION: 'Be the first to share your knowledge!',
} as const;

/** Search */
export const SEARCH = {
  PLACEHOLDER: 'Search viva questions, projects, resources...',
  RECENT_TITLE: 'Recent Searches',
  CLEAR_RECENT: 'Clear All',
  NO_RESULTS_TITLE: 'No results found',
  NO_RESULTS_DESCRIPTION: 'Try adjusting your search terms or filters',
} as const;

/** Submit Entry */
export const SUBMIT = {
  TITLE: 'Share Knowledge',
  STEP_1_TITLE: 'Entry Type',
  STEP_1_SUBTITLE: 'What kind of knowledge are you sharing?',
  STEP_2_TITLE: 'Details',
  STEP_2_SUBTITLE: 'Tell us more about your experience',
  STEP_3_TITLE: 'Tags',
  STEP_3_SUBTITLE: 'Add relevant tags for discoverability',
  STEP_4_TITLE: 'Viva Questions',
  STEP_4_SUBTITLE: 'Add viva questions if applicable',
  STEP_5_TITLE: 'Review',
  STEP_5_SUBTITLE: 'Review your entry before submitting',
  BUTTON_NEXT: 'Next Step',
  BUTTON_PREVIOUS: 'Previous',
  BUTTON_SUBMIT: 'Submit for Review',
  SUCCESS_TITLE: 'Entry Submitted!',
  SUCCESS_DESCRIPTION: 'Your entry has been submitted for moderation review.',
} as const;

/** Entry Detail */
export const ENTRY_DETAIL = {
  VIVA_SECTION_TITLE: 'Viva Questions',
  RELATED_SECTION_TITLE: 'Related Entries',
  BUTTON_UPVOTE: 'Upvote',
  BUTTON_SHARE: 'Share',
  BUTTON_REPORT: 'Report',
  BUTTON_EDIT: 'Edit',
  BUTTON_DELETE: 'Delete',
} as const;

/** Dashboard */
export const DASHBOARD = {
  TITLE: 'My Dashboard',
  MY_ENTRIES_TITLE: 'My Entries',
  STATS_ENTRIES: 'Total Entries',
  STATS_UPVOTES: 'Total Upvotes',
  STATS_VIEWS: 'Total Views',
  STATS_APPROVED: 'Approved',
  EMPTY_TITLE: 'No entries yet',
  EMPTY_DESCRIPTION: 'Start sharing your knowledge with juniors!',
} as const;

/** Admin / Moderation */
export const ADMIN = {
  TITLE: 'Moderation Panel',
  QUEUE_TITLE: 'Moderation Queue',
  USER_MANAGEMENT_TITLE: 'User Management',
  BUTTON_APPROVE: 'Approve',
  BUTTON_REJECT: 'Reject',
  APPROVED_MESSAGE: 'Entry approved successfully',
  REJECTED_MESSAGE: 'Entry rejected',
  STATS_PENDING: 'Pending',
  STATS_APPROVED_TODAY: 'Approved Today',
  STATS_REJECTED_TODAY: 'Rejected Today',
  STATS_TOTAL_USERS: 'Total Users',
} as const;

/** Profile */
export const PROFILE = {
  TITLE: 'Profile',
  BUTTON_EDIT_PROFILE: 'Edit Profile',
  BUTTON_MY_DASHBOARD: 'My Dashboard',
  BUTTON_SETTINGS: 'Settings',
  CONTRIBUTION_TITLE: 'Contributions',
} as const;

/** Error Messages */
export const ERRORS = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your internet connection.',
  AUTH_FAILED: 'Authentication failed. Please try again.',
  AUTH_CANCELLED: 'Sign in was cancelled.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_REQUIRED: 'This field is required.',
  VALIDATION_MIN_LENGTH: 'Must be at least {min} characters.',
  VALIDATION_MAX_LENGTH: 'Must be no more than {max} characters.',
  SUBMIT_FAILED: 'Failed to submit entry. Please try again.',
  LOAD_FAILED: 'Failed to load data. Pull to refresh.',
} as const;

/** Validation */
export const VALIDATION = {
  TITLE_MIN_LENGTH: 5,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MIN_LENGTH: 20,
  DESCRIPTION_MAX_LENGTH: 5000,
  TAG_MAX_COUNT: 10,
  VIVA_QUESTION_MIN_LENGTH: 5,
  VIVA_ANSWER_MAX_LENGTH: 2000,
} as const;

/** Storage Keys */
export const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'onboarding_complete',
  RECENT_SEARCHES: 'recent_searches',
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

/** Pagination */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  SEARCH_PAGE_SIZE: 15,
  MODERATION_PAGE_SIZE: 10,
} as const;

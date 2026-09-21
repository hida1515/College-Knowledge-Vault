/**
 * Entry Types
 * College Knowledge Vault
 */

export enum EntryType {
  Project = 'project',
  Viva = 'viva',
  Mistake = 'mistake',
  Resource = 'resource',
}

export enum EntryStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export interface TeamMember {
  name: string;
  linkedinUrl: string | null;
  githubUrl: string | null;
  email: string | null;
  openToConnect: boolean;
}

export interface ProjectDetails {
  projectType: 'individual' | 'group';
  teamMembers: TeamMember[];
  category: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  githubUrl: string | null;
  reportUrl: string | null;
  demoUrl: string | null;
  otherLinks: Array<{ label: string; url: string }>;
  description: string;
  challenges: string;
  solutions: string;
  whatWorkedWell: string | null;
  whatToDoDifferently: string | null;
  timeTaken: string | null;
  gradeReceived: string | null;
  gradeVisible: boolean;
  tipsForFuture: string | null;
}

export interface VivaDetails {
  subject: string;
  semester: number;
  academicYear: string;
  examType: 'internal' | 'external' | 'both';
  relatedTopics: string[];
  resourceLinks: Array<{ label: string; url: string }>;
}

export interface VivaQuestionDetailed {
  id: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  frequency: 'rarely' | 'sometimes' | 'often' | 'always';
  followUpQuestions: string[];
  answerTip: string | null;
}

export interface MistakeDetails {
  context: 'project' | 'lab' | 'theory' | 'assignment' | 'viva' | 'internship' | 'other';
  category: 'conceptual' | 'implementation' | 'design' | 'time_management' | 'communication' | 'other';
  subject: string | null;
  semester: number | null;
  mistake: string;
  rootCause: string;
  howDiscovered: string | null;
  solution: string;
  prevention: string;
  impact: string | null;
}

export interface ResourceDetails {
  url: string;
  resourceType: 'youtube_video' | 'youtube_playlist' | 'article' |
                'documentation' | 'github_repo' | 'online_course' |
                'book_pdf' | 'tool' | 'research_paper' | 'other';
  isPaid: boolean;
  cost: string | null;
  subjectsCovered: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  review: string;
  bestTimeToUse: string | null;
}

export interface Entry {
  id: string;
  authorId: string;
  collegeId?: string | null;
  authorName: string;
  authorAvatarUrl: string | null;
  authorCollege?: string;
  authorDepartment?: string;
  authorGraduationYear?: number | null;
  title: string;
  description: string;
  type: EntryType;
  status: EntryStatus;
  tags: string[];
  subject: string;
  semester: number;
  upvoteCount: number;
  viewCount: number;
  isUpvotedByCurrentUser: boolean;
  isBookmarkedByCurrentUser?: boolean;
  outdatedCount?: number;
  isMarkedOutdated?: boolean;
  rejectionReason?: string | null;
  projectDetails?: ProjectDetails | null;
  vivaDetails?: VivaDetails | null;
  mistakeDetails?: MistakeDetails | null;
  resourceDetails?: ResourceDetails | null;
  vivaQuestionsDetailed?: VivaQuestionDetailed[];
  matchSource?: 'entry' | 'viva_question' | 'tag' | string;
  matchSnippet?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VivaQuestion {
  id: string;
  entryId: string;
  question: string;
  answer: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  frequency: 'rare' | 'common' | 'very_common';
  createdAt: string;
}

export interface EntryWithViva extends Entry {
  vivaQuestions: VivaQuestion[];
}

export interface CreateEntryPayload {
  authorId: string;
  collegeId?: string | null;
  title: string;
  description: string;
  type: EntryType;
  tags: string[];
  subject: string;
  semester: number;
  vivaQuestions?: Array<{
    question: string;
    answer: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  projectDetails?: ProjectDetails | null;
  vivaDetails?: VivaDetails | null;
  mistakeDetails?: MistakeDetails | null;
  resourceDetails?: ResourceDetails | null;
  vivaQuestionsDetailed?: VivaQuestionDetailed[];
}

export interface EntryFormData {
  id?: string;
  title: string;
  description: string;
  type: EntryType;
  subject: string;
  semester: string;
  tags: string[];
  projectDetails?: ProjectDetails | null;
  vivaDetails?: VivaDetails | null;
  mistakeDetails?: MistakeDetails | null;
  resourceDetails?: ResourceDetails | null;
  rejectionReason?: string | null;
  vivaQuestions?: Array<{ question: string; answer: string; difficulty: 'easy' | 'medium' | 'hard' }>;
  vivaQuestionsDetailed?: VivaQuestionDetailed[];
}

export interface UpdateEntryPayload {
  id: string;
  title?: string;
  description?: string;
  tags?: string[];
  subject?: string;
  semester?: number;
  projectDetails?: ProjectDetails | null;
  vivaDetails?: VivaDetails | null;
  mistakeDetails?: MistakeDetails | null;
  resourceDetails?: ResourceDetails | null;
  vivaQuestionsDetailed?: VivaQuestionDetailed[];
}

export interface EntryFilters {
  type: EntryType | null;
  sortBy: 'recent' | 'popular';
  subject: string | null;
  semester: number | null;
  collegeId?: string | null;
  department?: string | null;
}

export interface PaginatedEntries {
  entries: Entry[];
  totalCount: number;
  hasMore: boolean;
  nextPage: number | null;
}

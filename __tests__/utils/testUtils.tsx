/**
 * Test Utilities
 * College Knowledge Vault
 *
 * Shared helpers for rendering components with required providers
 * and creating mock data objects.
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { UserRole, User, UserProfile } from '../../src/core/types/user.types';
import {
  Entry,
  EntryType,
  EntryStatus,
  VivaQuestion,
} from '../../src/core/types/entry.types';

// ─── Provider Wrapper ───

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export async function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const queryClient = createTestQueryClient();

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        {children}
      </NavigationContainer>
    </QueryClientProvider>
  );

  const res = await render(ui, { wrapper, ...options });

  return {
    ...res,
    queryClient,
  };
}

// ─── Mock Factories ───

let mockIdCounter = 0;
function nextId(prefix = 'mock') {
  mockIdCounter += 1;
  return `${prefix}-${mockIdCounter}`;
}

export function createMockUser(
  role: UserRole = UserRole.Student,
  overrides?: Partial<User>,
): UserProfile {
  const currentYear = new Date().getFullYear();
  return {
    id: nextId('user'),
    email: 'test@college.edu',
    displayName: 'Test User',
    avatarUrl: null,
    role,
    college: 'Test College',
    collegeId: 'college-1',
    collegeName: 'Test College',
    department: 'MCA',
    graduationYear: currentYear + 1,
    joiningYear: currentYear - 1,
    program: 'BTech / BE',
    programType: 'ug',
    programDuration: 4,
    isVerified: role === UserRole.Faculty,
    isSuperAdmin: false,
    isCollegeAdmin: false,
    isSeniorRevoked: false,
    facultyVerifiedBy: null,
    facultyVerifiedAt: null,
    collegeAdminVerifiedBy: null,
    collegeAdminVerifiedAt: null,
    pendingRoleRequest: null,
    fcmToken: null,
    entryCount: 5,
    totalUpvotesReceived: 12,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-06-01T00:00:00Z',
    totalEntries: 5,
    totalUpvotes: 12,
    totalViews: 100,
    ...overrides,
  };
}

export function createMockEntry(overrides?: Partial<Entry>): Entry {
  return {
    id: nextId('entry'),
    authorId: nextId('author'),
    authorName: 'Senior Student',
    authorAvatarUrl: null,
    authorCollege: 'Test College',
    authorDepartment: 'MCA',
    authorGraduationYear: 2025,
    title: 'React Native Build Optimization Tips',
    description:
      'A comprehensive guide to optimizing React Native builds for production deployment.',
    type: EntryType.Project,
    status: EntryStatus.Approved,
    tags: ['React Native', 'TypeScript', 'Android'],
    subject: 'Mobile Development',
    semester: 3,
    upvoteCount: 7,
    viewCount: 42,
    isUpvotedByCurrentUser: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    ...overrides,
  };
}

export function createMockVivaQuestion(
  overrides?: Partial<VivaQuestion>,
): VivaQuestion {
  return {
    id: nextId('vq'),
    entryId: nextId('entry'),
    question: 'Explain the difference between state and props in React.',
    answer: 'State is internal mutable data, props are external read-only data passed from parent.',
    difficulty: 'medium',
    frequency: 'common',
    createdAt: '2025-06-01T00:00:00Z',
    ...overrides,
  };
}

export interface UserStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export function createMockStats(overrides?: Partial<UserStats>): UserStats {
  return {
    total: 10,
    approved: 6,
    pending: 3,
    rejected: 1,
    ...overrides,
  };
}

/**
 * Helper to mock the useAuthStore hook with a specific user.
 * Call this INSIDE the jest.mock factory or in beforeEach.
 */
export function mockAuthStoreReturn(user: UserProfile | null, extras?: Record<string, unknown>) {
  return {
    user,
    session: user ? { access_token: 'mock-token', user: { id: user.id } } : null,
    isLoading: false,
    isAuthenticating: false,
    isAuthenticated: user !== null,
    hasOnboarded: true,
    isNewUser: false,
    selectedContextRole: null,
    error: null,
    setUser: jest.fn(),
    setSession: jest.fn(),
    setLoading: jest.fn(),
    setAuthenticating: jest.fn(),
    setError: jest.fn(),
    setHasOnboarded: jest.fn(),
    setIsNewUser: jest.fn(),
    setSelectedContextRole: jest.fn(),
    initializeAuth: jest.fn(),
    signOut: jest.fn(),
    reset: jest.fn(),
    ...extras,
  };
}

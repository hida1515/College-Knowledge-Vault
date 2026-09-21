/**
 * Profile & Analytics Service Unit Tests
 * College Knowledge Vault
 */

import {
  getUserUpvoteCount,
  getFacultyModerationStats,
  getCollegeStats,
  getPlatformStats,
  cancelFacultyRequest,
  getTopContributors,
  getRecentActivity,
} from '../../src/core/services/profileService';
import { supabase } from '../../src/core/services/supabase';

jest.mock('../../src/core/services/supabase', () => {
  const mockFrom = jest.fn();
  return {
    supabase: {
      from: mockFrom,
    },
  };
});

describe('Profile & Analytics Service', () => {
  const mockFrom = supabase.from as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserUpvoteCount()', () => {
    test('returns sum of upvotes on approved entries', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ upvote_count: 5 }, { upvote_count: 12 }, { upvote_count: null }],
              error: null,
            }),
          }),
        }),
      });

      const count = await getUserUpvoteCount('user-1');
      expect(count).toBe(17);
    });

    test('returns 0 when error occurs or no entries exist', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'DB Error' },
            }),
          }),
        }),
      });

      const count = await getUserUpvoteCount('user-err');
      expect(count).toBe(0);
    });
  });

  describe('getFacultyModerationStats()', () => {
    test('returns approved, rejected, and pending counts', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'entries') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ count: 7, data: null, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const stats = await getFacultyModerationStats('fac-1', 'col-1');
      expect(stats.approved).toBeDefined();
      expect(stats.rejected).toBeDefined();
      expect(stats.pending).toBeDefined();
    });
  });

  describe('getCollegeStats()', () => {
    test('computes counts scoped to collegeId', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 'u1',
                    email: 'u1@test.com',
                    display_name: 'Student 1',
                    role: 'student',
                    joining_year: 2024,
                    program_duration: 4,
                    is_verified: false,
                    is_senior_revoked: false,
                  },
                  {
                    id: 'u2',
                    email: 'u2@test.com',
                    display_name: 'Faculty 1',
                    role: 'faculty',
                    is_verified: true,
                    is_senior_revoked: false,
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === 'entries') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [{ status: 'approved' }, { status: 'pending' }],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const stats = await getCollegeStats('col-1');
      expect(stats.totalStudents).toBe(1);
      expect(stats.verifiedFaculty).toBe(1);
      expect(stats.approvedEntries).toBe(1);
      expect(stats.pendingEntries).toBe(1);
    });
  });

  describe('getPlatformStats()', () => {
    test('returns platform global metrics', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'colleges') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 12, error: null }),
            }),
          };
        }
        if (table === 'users') {
          return {
            select: jest.fn().mockResolvedValue({ count: 450, error: null }),
          };
        }
        if (table === 'entries') {
          return {
            select: jest.fn().mockResolvedValue({ count: 900, error: null }),
          };
        }
        if (table === 'college_admin_requests') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 3, error: null }),
            }),
          };
        }
        return {};
      });

      const stats = await getPlatformStats();
      expect(stats.totalColleges).toBe(12);
      expect(stats.totalUsers).toBe(450);
      expect(stats.totalEntries).toBe(900);
      expect(stats.pendingAdminRequests).toBe(3);
    });
  });

  describe('cancelFacultyRequest()', () => {
    test('deletes request and resets user role to student', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'faculty_requests') {
          return { delete: mockDelete };
        }
        if (table === 'users') {
          return { update: mockUpdate };
        }
        return {};
      });

      await cancelFacultyRequest('user-to-cancel');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'student',
          is_verified: false,
          pending_role_request: null,
        }),
      );
    });

    test('throws error if delete fails', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'faculty_requests') {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: { message: 'Delete Failed' } }),
            }),
          };
        }
        return {};
      });

      await expect(cancelFacultyRequest('user-fail')).rejects.toThrow('Failed to cancel request');
    });
  });

  describe('getTopContributors() and getRecentActivity()', () => {
    test('returns top contributors sorted by upvotes', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 'u1',
                    display_name: 'Top Contributor',
                    avatar_url: null,
                    entry_count: 10,
                    total_upvotes_received: 55,
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      });

      const contribs = await getTopContributors('col-1', 5);
      expect(contribs.length).toBe(1);
      expect(contribs[0].displayName).toBe('Top Contributor');
      expect(contribs[0].upvoteCount).toBe(55);
    });

    test('returns recent activity', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 'e1',
                    title: 'Database Normalization',
                    status: 'approved',
                    created_at: '2026-09-12T10:00:00Z',
                    users: { display_name: 'Senior Alice' },
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      });

      const activity = await getRecentActivity('col-1', 10);
      expect(activity.length).toBe(1);
      expect(activity[0].type).toBe('entry_approved');
      expect(activity[0].actorName).toBe('Senior Alice');
    });
  });
});

/**
 * College Service Unit Tests
 * College Knowledge Vault
 */

import {
  getColleges,
  searchColleges,
  submitCollegeAdminRequest,
  approveCollegeAdminRequest,
  rejectCollegeAdminRequest,
  getCollegeUsers,
} from '../../src/core/services/collegeService';
import { supabase } from '../../src/core/services/supabase';

// Mock Supabase
jest.mock('../../src/core/services/supabase', () => {
  const mockFrom = jest.fn();
  return {
    supabase: {
      from: mockFrom,
    },
  };
});

describe('College Service', () => {
  const mockFrom = supabase.from as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TEST GROUP 1: getColleges()', () => {
    test('1a: returns list of active colleges', async () => {
      const mockColleges = [
        { id: 'c1', name: 'IIT Bombay', city: 'Mumbai', state: 'MH', country: 'India', is_active: true },
        { id: 'c2', name: 'IIT Delhi', city: 'Delhi', state: 'DL', country: 'India', is_active: true },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockColleges, error: null }),
          }),
        }),
      });

      const result = await getColleges();
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('IIT Bombay');
    });

    test('1b: throws error on database failure', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
          }),
        }),
      });

      await expect(getColleges()).rejects.toThrow('Failed to fetch colleges: DB Error');
    });
  });

  describe('TEST GROUP 2: searchColleges()', () => {
    test('2a: returns colleges matching query', async () => {
      const mockResults = [
        { id: 'c1', name: 'IIT Bombay', city: 'Mumbai', state: 'MH', country: 'India', is_active: true },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            ilike: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: mockResults, error: null }),
              }),
            }),
          }),
        }),
      });

      const result = await searchColleges('Bombay');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('IIT Bombay');
    });

    test('2b: returns all colleges when query empty', async () => {
      const mockColleges = [
        { id: 'c1', name: 'IIT Bombay', city: 'Mumbai', state: 'MH', country: 'India', is_active: true },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockColleges, error: null }),
          }),
        }),
      });

      const result = await searchColleges('  ');
      expect(result.length).toBe(1);
    });
  });

  describe('TEST GROUP 3: submitCollegeAdminRequest()', () => {
    test('3a: inserts record with correct fields', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'college_admin_requests') {
          return { insert: mockInsert };
        }
        if (table === 'users') {
          return { update: mockUpdate };
        }
        return {};
      });

      await submitCollegeAdminRequest({
        userId: 'user-1',
        collegeId: 'c1',
        collegeName: 'IIT Bombay',
        collegeCity: 'Mumbai',
        collegeState: 'MH',
        designation: 'HOD',
        reason: 'Coordinator',
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          college_id: 'c1',
          college_name: 'IIT Bombay',
          designation: 'HOD',
        }),
      );
    });
  });

  describe('TEST GROUP 4: approveCollegeAdminRequest()', () => {
    test('4a: sets user is_college_admin=true and updates request status', async () => {
      const mockReqUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const mockUserUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'college_admin_requests') {
          return { update: mockReqUpdate };
        }
        if (table === 'users') {
          return { update: mockUserUpdate };
        }
        return {};
      });

      const reqItem = {
        id: 'req-1',
        userId: 'user-1',
        collegeId: 'c1',
        collegeName: 'IIT Bombay',
        collegeCity: 'Mumbai',
        collegeState: 'MH',
        designation: 'HOD',
        employeeId: 'emp-1',
        reason: 'Coordinating',
        status: 'pending' as const,
        reviewedBy: null,
        reviewNote: null,
        createdAt: '2025-01-01T00:00:00Z',
        reviewedAt: null,
      };

      await approveCollegeAdminRequest(reqItem, 'admin-1');

      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_college_admin: true,
          college_id: 'c1',
        }),
      );
    });
  });

  describe('TEST GROUP 5: rejectCollegeAdminRequest()', () => {
    test('5a: updates request status to rejected and clears pending flag', async () => {
      const mockReqUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const mockUserUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'college_admin_requests') {
          return { update: mockReqUpdate };
        }
        if (table === 'users') {
          return { update: mockUserUpdate };
        }
        return {};
      });

      await rejectCollegeAdminRequest('req-1', 'user-1', 'admin-1', 'Incomplete');

      expect(mockReqUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rejected',
          review_note: 'Incomplete',
        }),
      );
    });
  });

  describe('TEST GROUP 6: getCollegeUsers()', () => {
    test('6a: returns users scoped to college_id', async () => {
      const mockDbUsers = [
        {
          id: 'user-1',
          email: 'u1@test.com',
          display_name: 'User 1',
          avatar_url: null,
          role: 'student',
          college: 'IIT Bombay',
          college_id: 'c1',
          department: 'MCA',
          graduation_year: 2026,
          is_verified: false,
          entry_count: 3,
          total_upvotes_received: 5,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockDbUsers, error: null }),
          }),
        }),
      });

      const users = await getCollegeUsers('c1');
      expect(users.length).toBe(1);
      expect(users[0].collegeId).toBe('c1');
    });
  });
});

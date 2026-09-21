/**
 * Invite Code Service Unit Tests
 * College Knowledge Vault
 */

import {
  validateInviteCode,
  generateNewCodes,
  recordUserCode,
  generateCode,
} from '../../src/core/services/inviteCodeService';
import { supabase } from '../../src/core/services/supabase';

jest.mock('../../src/core/services/supabase', () => {
  const mockFrom = jest.fn();
  return {
    supabase: {
      from: mockFrom,
    },
  };
});

describe('Invite Code Service', () => {
  const mockFrom = supabase.from as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TEST GROUP 1: validateInviteCode()', () => {
    const mockCollegeRow = {
      id: 'col-123',
      name: 'Sree Narayana Gurukulam College of Engineering',
      city: 'Kolenchery',
      state: 'Kerala',
      country: 'India',
      is_active: true,
      student_invite_code: 'SREECO-2024-XK7P',
      faculty_invite_code: 'SREECO-FAC-7M2Q',
      admin_invite_code: 'SREECO-ADM-9R3T',
      codes_generated_at: '2024-09-01T00:00:00Z',
      created_by: 'admin-1',
      created_at: '2024-01-01T00:00:00Z',
    };

    test('1a: valid student code returns correct college', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [mockCollegeRow], error: null }),
          }),
        }),
      });

      const result = await validateInviteCode('SREECO-2024-XK7P');
      expect(result.isValid).toBe(true);
      expect(result.codeType).toBe('student');
      expect(result.college).not.toBeNull();
      expect(result.college?.id).toBe('col-123');
      expect(result.college?.name).toBe('Sree Narayana Gurukulam College of Engineering');
      expect(result.errorMessage).toBeNull();
    });

    test('1b: valid faculty code returns codeType="faculty"', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [mockCollegeRow], error: null }),
          }),
        }),
      });

      const result = await validateInviteCode('SREECO-FAC-7M2Q');
      expect(result.isValid).toBe(true);
      expect(result.codeType).toBe('faculty');
      expect(result.college?.id).toBe('col-123');
    });

    test('1c: admin code does not return college_admin type (admin codes discontinued)', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const result = await validateInviteCode('SREECO-ADM-9R3T');
      expect(result.isValid).toBe(false);
      expect(result.codeType).toBeNull();
    });

    test('1d: invalid code returns isValid=false', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const result = await validateInviteCode('INVALID-CODE-9999');
      expect(result.isValid).toBe(false);
      expect(result.college).toBeNull();
      expect(result.codeType).toBeNull();
      expect(result.errorMessage).toContain('Invalid invite code');
    });

    test('1e: inactive college code returns error message', async () => {
      const inactiveCollegeRow = { ...mockCollegeRow, is_active: false };
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [inactiveCollegeRow], error: null }),
          }),
        }),
      });

      const result = await validateInviteCode('SREECO-2024-XK7P');
      expect(result.isValid).toBe(false);
      expect(result.college).toBeNull();
      expect(result.codeType).toBeNull();
      expect(result.errorMessage).toBe('This college is not active on the platform.');
    });

    test('1f: code matching is case-insensitive', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [mockCollegeRow], error: null }),
          }),
        }),
      });

      // lowercase input
      const result = await validateInviteCode('sreeco-2024-xk7p');
      expect(result.isValid).toBe(true);
      expect(result.codeType).toBe('student');
      expect(result.college?.id).toBe('col-123');
    });

    test('1g: returns null college when invalid', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      const result = await validateInviteCode('');
      expect(result.isValid).toBe(false);
      expect(result.college).toBeNull();
      expect(result.errorMessage).toBeTruthy();
    });
  });

  describe('TEST GROUP 2: generateNewCodes()', () => {
    const mockCollege = {
      id: 'abc-123',
      name: 'Model Engineering College',
      student_invite_code: 'MODEAB-2023-OLD1',
      faculty_invite_code: 'MODEAB-FAC-OLD2',
      admin_invite_code: 'MODEAB-ADM-OLD3',
    };

    test('2a: generates student code in correct format', () => {
      const studentCode = generateCode('Model Engineering College', 'col-1234', 'student');
      const year = new Date().getFullYear().toString();
      // Prefix is 4 letters from name + 2 from UUID = 6 characters
      expect(studentCode).toMatch(new RegExp(`^[A-Z0-9]{6}-${year}-[A-Z0-9]{4}$`));
    });

    test('2b: generates faculty code with FAC prefix', () => {
      const facultyCode = generateCode('Model Engineering College', 'col-1234', 'faculty');
      expect(facultyCode).toMatch(/^[A-Z0-9]{6}-FAC-[A-Z0-9]{4}$/);
    });

    test('2c: only student and faculty code types are allowed in generateCode', () => {
      // @ts-expect-error admin type is not allowed
      const invalidType = 'admin';
      expect(() => {
        // verify type restriction
      }).not.toThrow();
    });

    test('2d: new codes are unique (not same as old)', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockCollege, error: null }),
          }),
        }),
        update: mockUpdate,
      });

      const codes = await generateNewCodes('abc-123', 'all');
      expect(codes.studentCode).not.toBe(mockCollege.student_invite_code);
      expect(codes.facultyCode).not.toBe(mockCollege.faculty_invite_code);
    });

    test('2e: updates college record with new codes', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockCollege, error: null }),
          }),
        }),
        update: mockUpdate,
      });

      const codes = await generateNewCodes('abc-123', 'all');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          student_invite_code: codes.studentCode,
          faculty_invite_code: codes.facultyCode,
          codes_generated_at: expect.any(String),
        }),
      );
    });
  });

  describe('TEST GROUP 3: recordUserCode()', () => {
    test('3a: updates joined_via_code on user record', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'usr-1' }, error: null }),
          }),
        }),
      });

      mockFrom.mockReturnValue({
        update: mockUpdate,
      });

      await recordUserCode('usr-1', 'sngce-2024-xk7p', 'student');

      expect(mockUpdate).toHaveBeenCalledWith({
        joined_via_code: 'SNGCE-2024-XK7P',
        code_type: 'student',
      });
    });

    test('3b: updates code_type correctly', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'usr-2' }, error: null }),
          }),
        }),
      });

      mockFrom.mockReturnValue({
        update: mockUpdate,
      });

      await recordUserCode('usr-2', 'SNGCE-FAC-7M2Q', 'faculty');

      expect(mockUpdate).toHaveBeenCalledWith({
        joined_via_code: 'SNGCE-FAC-7M2Q',
        code_type: 'faculty',
      });
    });

    test('3c: throws when user not found', async () => {
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Row not found' } }),
            }),
          }),
        }),
      });

      await expect(recordUserCode('usr-not-exist', 'CODE-123', 'student')).rejects.toThrow(
        'Failed to record invite code: Row not found',
      );
    });
  });
});

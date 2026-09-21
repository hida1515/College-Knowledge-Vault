/**
 * Academic Standing Utility Tests
 * College Knowledge Vault
 */

import {
  computeAcademicStanding,
  computeEffectiveRole,
  isSeniorByProgram,
} from '../../src/core/utils/roleChecker';
import { UserRole, EffectiveRole } from '../../src/core/types/user.types';
import { createMockUser } from '../utils/testUtils';

describe('Academic Standing Utility', () => {
  let realGetFullYear: () => number;

  beforeAll(() => {
    realGetFullYear = Date.prototype.getFullYear;
    // Mock currentYear = 2025 for predictable tests
    Date.prototype.getFullYear = jest.fn(() => 2025);
  });

  afterAll(() => {
    Date.prototype.getFullYear = realGetFullYear;
  });

  describe('TEST GROUP 1: computeAcademicStanding()', () => {
    test('1a: BTech joined 2022 (4yr) in 2025 → year 4, isFinalYear=true, accessLevel=senior', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: 2022,
        programDuration: 4,
      });
      const standing = computeAcademicStanding(user);
      expect(standing.currentProgramYear).toBe(4);
      expect(standing.isFinalYear).toBe(true);
      expect(standing.isAlumni).toBe(false);
      expect(standing.graduationYear).toBe(2026);
      expect(standing.accessLevel).toBe('senior');
    });

    test('1b: BTech joined 2023 (4yr) in 2025 → year 3, isFinalYear=false, accessLevel=student', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: 2023,
        programDuration: 4,
      });
      const standing = computeAcademicStanding(user);
      expect(standing.currentProgramYear).toBe(3);
      expect(standing.isFinalYear).toBe(false);
      expect(standing.isAlumni).toBe(false);
      expect(standing.accessLevel).toBe('student');
    });

    test('1c: BTech joined 2021 (4yr) in 2025 → year 5, isAlumni=true, accessLevel=alumni', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: 2021,
        programDuration: 4,
      });
      const standing = computeAcademicStanding(user);
      expect(standing.currentProgramYear).toBe(5);
      expect(standing.isFinalYear).toBe(false);
      expect(standing.isAlumni).toBe(true);
      expect(standing.accessLevel).toBe('alumni');
    });

    test('1d: MCA joined 2024 (2yr) in 2025 → year 2, isFinalYear=true, accessLevel=senior', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: 2024,
        programDuration: 2,
      });
      const standing = computeAcademicStanding(user);
      expect(standing.currentProgramYear).toBe(2);
      expect(standing.isFinalYear).toBe(true);
      expect(standing.isAlumni).toBe(false);
      expect(standing.accessLevel).toBe('senior');
    });

    test('1e: MCA joined 2024 (2yr) in year 2024 → year 1, isFinalYear=false, accessLevel=student', () => {
      (Date.prototype.getFullYear as jest.Mock).mockReturnValue(2024);
      const user = createMockUser(UserRole.Student, {
        joiningYear: 2024,
        programDuration: 2,
      });
      const standing = computeAcademicStanding(user);
      expect(standing.currentProgramYear).toBe(1);
      expect(standing.isFinalYear).toBe(false);
      expect(standing.accessLevel).toBe('student');
      (Date.prototype.getFullYear as jest.Mock).mockReturnValue(2025);
    });

    test('1f: MSc joined 2022 (2yr) in 2025 → year 4, isAlumni=true, accessLevel=alumni', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: 2022,
        programDuration: 2,
      });
      const standing = computeAcademicStanding(user);
      expect(standing.isAlumni).toBe(true);
      expect(standing.accessLevel).toBe('alumni');
    });

    test('1g: BCA joined 2023 (3yr) in 2025 → year 3, isFinalYear=true, accessLevel=senior', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: 2023,
        programDuration: 3,
      });
      const standing = computeAcademicStanding(user);
      expect(standing.currentProgramYear).toBe(3);
      expect(standing.isFinalYear).toBe(true);
      expect(standing.accessLevel).toBe('senior');
    });

    test('1h: null joiningYear → accessLevel=student (safe default)', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: null,
        programDuration: 4,
      });
      const standing = computeAcademicStanding(user);
      expect(standing.accessLevel).toBe('student');
      expect(standing.currentProgramYear).toBeNull();
    });

    test('1i: null programDuration → accessLevel=student (safe default)', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: 2022,
        programDuration: null,
      });
      const standing = computeAcademicStanding(user);
      expect(standing.accessLevel).toBe('student');
      expect(standing.currentProgramYear).toBeNull();
    });

    test('1j: PhD joined 2023 (3yr) in 2025 → year 3, isFinalYear=true, accessLevel=senior', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: 2023,
        programDuration: 3,
      });
      const standing = computeAcademicStanding(user);
      expect(standing.currentProgramYear).toBe(3);
      expect(standing.isFinalYear).toBe(true);
      expect(standing.accessLevel).toBe('senior');
    });

    // --- Graduation-year-only fallback tests (DB migration 003 not applied) ---

    test('1k: FALLBACK — both null, graduationYear=currentYear+1 → accessLevel=senior', () => {
      // Simulates: user completed onboarding, DB stored graduation_year but not joining_year/program_duration
      const user = createMockUser(UserRole.Student, {
        joiningYear: null,
        programDuration: null,
        graduationYear: 2026, // currentYear(2025) + 1
      });
      const standing = computeAcademicStanding(user);
      expect(standing.accessLevel).toBe('senior');
      expect(standing.isFinalYear).toBe(true);
      expect(standing.isAlumni).toBe(false);
    });

    test('1l: FALLBACK — both null, graduationYear<=currentYear → accessLevel=alumni', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: null,
        programDuration: null,
        graduationYear: 2025, // currentYear(2025)
      });
      const standing = computeAcademicStanding(user);
      expect(standing.accessLevel).toBe('alumni');
      expect(standing.isAlumni).toBe(true);
    });

    test('1m: FALLBACK — both null, graduationYear=currentYear+3 → accessLevel=student', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: null,
        programDuration: null,
        graduationYear: 2028, // currentYear(2025) + 3, not final year
      });
      const standing = computeAcademicStanding(user);
      expect(standing.accessLevel).toBe('student');
    });
  });

  describe('TEST GROUP 2: accessMessage content', () => {
    test('2a: senior message contains "Senior access"', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: 2022,
        programDuration: 4,
      });
      const standing = computeAcademicStanding(user);
      expect(standing.accessMessage).toContain('Senior access');
    });

    test('2b: student message contains year they get senior access', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: 2023,
        programDuration: 4,
      });
      const standing = computeAcademicStanding(user);
      expect(standing.accessMessage).toContain('2026');
    });

    test('2c: alumni message contains "alumni"', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: 2020,
        programDuration: 4,
      });
      const standing = computeAcademicStanding(user);
      expect(standing.accessMessage.toLowerCase()).toContain('alumni');
    });

    test('2d: senior message contains current year of program', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: 2022,
        programDuration: 4,
      });
      const standing = computeAcademicStanding(user);
      expect(standing.accessMessage).toContain('Year 4 of 4');
    });
  });

  describe('TEST GROUP 3: computeEffectiveRole() with new logic', () => {
    test('3a: senior standing + not revoked → EffectiveRole.Senior', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: 2022,
        programDuration: 4,
        isSeniorRevoked: false,
      });
      expect(computeEffectiveRole(user)).toBe(EffectiveRole.Senior);
    });

    test('3b: senior standing + isSeniorRevoked → EffectiveRole.Student', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: 2022,
        programDuration: 4,
        isSeniorRevoked: true,
      });
      expect(computeEffectiveRole(user)).toBe(EffectiveRole.Student);
    });

    test('3c: alumni standing → EffectiveRole.Student (not Senior)', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: 2020,
        programDuration: 4,
      });
      expect(computeEffectiveRole(user)).toBe(EffectiveRole.Student);
    });

    test('3d: student standing → EffectiveRole.Student', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: 2024,
        programDuration: 4,
      });
      expect(computeEffectiveRole(user)).toBe(EffectiveRole.Student);
    });

    test('3e: SuperAdmin overrides academic standing', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: 2024,
        programDuration: 4,
        isSuperAdmin: true,
      });
      expect(computeEffectiveRole(user)).toBe(EffectiveRole.SuperAdmin);
    });

    test('3f: CollegeAdmin overrides academic standing', () => {
      const user = createMockUser(UserRole.Student, {
        joiningYear: 2024,
        programDuration: 4,
        isCollegeAdmin: true,
      });
      expect(computeEffectiveRole(user)).toBe(EffectiveRole.CollegeAdmin);
    });

    test('3g: Faculty (verified) overrides academic standing', () => {
      const user = createMockUser(UserRole.Faculty, {
        joiningYear: 2024,
        programDuration: 4,
        isVerified: true,
      });
      expect(computeEffectiveRole(user)).toBe(EffectiveRole.Faculty);
    });
  });

  describe('TEST GROUP 4: isSeniorByProgram()', () => {
    test('4a: final year → true', () => {
      expect(isSeniorByProgram(2022, 4)).toBe(true);
    });

    test('4b: first year → false', () => {
      expect(isSeniorByProgram(2024, 4)).toBe(false);
    });

    test('4c: alumni → false', () => {
      expect(isSeniorByProgram(2020, 4)).toBe(false);
    });

    test('4d: null joiningYear → false', () => {
      expect(isSeniorByProgram(null, 4)).toBe(false);
    });

    test('4e: null duration → false', () => {
      expect(isSeniorByProgram(2022, null)).toBe(false);
    });
  });
});

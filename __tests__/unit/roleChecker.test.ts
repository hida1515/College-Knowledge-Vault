/**
 * Role Checker Utility Tests
 * College Knowledge Vault
 */

import {
  computeEffectiveRole,
  canSubmitEntries,
  canModerate,
  canManageCollege,
  canAccessSuperAdmin,
} from '../../src/core/utils/roleChecker';
import { UserRole, EffectiveRole } from '../../src/core/types/user.types';
import { createMockUser } from '../utils/testUtils';

describe('Role Checker Utility', () => {
  const currentYear = new Date().getFullYear();
  const seniorJoiningYear = currentYear - 3; // Year 4 of 4
  const studentJoiningYear = currentYear - 1; // Year 2 of 4

  describe('TEST GROUP 1: computeEffectiveRole() priority', () => {
    test('1a: isSuperAdmin=true returns SuperAdmin regardless of other fields', () => {
      const user = createMockUser(UserRole.Student, { isSuperAdmin: true, isCollegeAdmin: true, joiningYear: studentJoiningYear, programDuration: 4 });
      expect(computeEffectiveRole(user)).toBe(EffectiveRole.SuperAdmin);
    });

    test('1b: isCollegeAdmin=true returns CollegeAdmin', () => {
      const user = createMockUser(UserRole.Student, { isCollegeAdmin: true, joiningYear: seniorJoiningYear, programDuration: 4 });
      expect(computeEffectiveRole(user)).toBe(EffectiveRole.CollegeAdmin);
    });

    test('1c: faculty role + isVerified=true returns Faculty', () => {
      const user = createMockUser(UserRole.Faculty, { isVerified: true });
      expect(computeEffectiveRole(user)).toBe(EffectiveRole.Faculty);
    });

    test('1d: faculty role + isVerified=false returns PendingFaculty', () => {
      const user = createMockUser(UserRole.Faculty, { isVerified: false });
      expect(computeEffectiveRole(user)).toBe(EffectiveRole.PendingFaculty);
    });

    test('1e: final year student returns Senior', () => {
      const user = createMockUser(UserRole.Student, { joiningYear: seniorJoiningYear, programDuration: 4 });
      expect(computeEffectiveRole(user)).toBe(EffectiveRole.Senior);
    });

    test('1f: non-final year student returns Student', () => {
      const user = createMockUser(UserRole.Student, { joiningYear: studentJoiningYear, programDuration: 4 });
      expect(computeEffectiveRole(user)).toBe(EffectiveRole.Student);
    });

    test('1g: final year student + isSeniorRevoked=true returns Student', () => {
      const user = createMockUser(UserRole.Student, { joiningYear: seniorJoiningYear, programDuration: 4, isSeniorRevoked: true });
      expect(computeEffectiveRole(user)).toBe(EffectiveRole.Student);
    });

    test('1h: SuperAdmin overrides CollegeAdmin check', () => {
      const user = createMockUser(UserRole.Faculty, { isSuperAdmin: true, isCollegeAdmin: true });
      expect(computeEffectiveRole(user)).toBe(EffectiveRole.SuperAdmin);
    });

    test('1i: CollegeAdmin overrides Faculty check', () => {
      const user = createMockUser(UserRole.Faculty, { isCollegeAdmin: true, isVerified: true });
      expect(computeEffectiveRole(user)).toBe(EffectiveRole.CollegeAdmin);
    });

    test('1j: null joiningYear returns Student', () => {
      const user = createMockUser(UserRole.Student, { joiningYear: null, programDuration: 4 });
      expect(computeEffectiveRole(user)).toBe(EffectiveRole.Student);
    });
  });

  describe('TEST GROUP 2: canSubmitEntries()', () => {
    test('2a: SuperAdmin can submit', () => {
      const user = createMockUser(UserRole.Student, { isSuperAdmin: true });
      expect(canSubmitEntries(user)).toBe(true);
    });

    test('2b: CollegeAdmin can submit', () => {
      const user = createMockUser(UserRole.Student, { isCollegeAdmin: true });
      expect(canSubmitEntries(user)).toBe(true);
    });

    test('2c: Faculty (verified) can submit', () => {
      const user = createMockUser(UserRole.Faculty, { isVerified: true });
      expect(canSubmitEntries(user)).toBe(true);
    });

    test('2d: PendingFaculty cannot submit', () => {
      const user = createMockUser(UserRole.Faculty, { isVerified: false });
      expect(canSubmitEntries(user)).toBe(false);
    });

    test('2e: Senior (final year) can submit', () => {
      const user = createMockUser(UserRole.Student, { joiningYear: seniorJoiningYear, programDuration: 4 });
      expect(canSubmitEntries(user)).toBe(true);
    });

    test('2f: Revoked senior cannot submit', () => {
      const user = createMockUser(UserRole.Student, { joiningYear: seniorJoiningYear, programDuration: 4, isSeniorRevoked: true });
      expect(canSubmitEntries(user)).toBe(false);
    });

    test('2g: Student cannot submit', () => {
      const user = createMockUser(UserRole.Student, { joiningYear: studentJoiningYear, programDuration: 4 });
      expect(canSubmitEntries(user)).toBe(false);
    });
  });

  describe('TEST GROUP 3: canModerate()', () => {
    test('3a: Faculty can moderate', () => {
      const user = createMockUser(UserRole.Faculty, { isVerified: true });
      expect(canModerate(user)).toBe(true);
    });

    test('3b: CollegeAdmin can moderate', () => {
      const user = createMockUser(UserRole.Student, { isCollegeAdmin: true });
      expect(canModerate(user)).toBe(true);
    });

    test('3c: SuperAdmin can moderate', () => {
      const user = createMockUser(UserRole.Student, { isSuperAdmin: true });
      expect(canModerate(user)).toBe(true);
    });

    test('3d: Senior cannot moderate', () => {
      const user = createMockUser(UserRole.Student, { joiningYear: seniorJoiningYear, programDuration: 4 });
      expect(canModerate(user)).toBe(false);
    });

    test('3e: Student cannot moderate', () => {
      const user = createMockUser(UserRole.Student, { joiningYear: studentJoiningYear, programDuration: 4 });
      expect(canModerate(user)).toBe(false);
    });

    test('3f: PendingFaculty cannot moderate', () => {
      const user = createMockUser(UserRole.Faculty, { isVerified: false });
      expect(canModerate(user)).toBe(false);
    });
  });

  describe('TEST GROUP 4: canManageCollege()', () => {
    test('4a: CollegeAdmin can manage college', () => {
      const user = createMockUser(UserRole.Student, { isCollegeAdmin: true });
      expect(canManageCollege(user)).toBe(true);
    });

    test('4b: SuperAdmin can manage college', () => {
      const user = createMockUser(UserRole.Student, { isSuperAdmin: true });
      expect(canManageCollege(user)).toBe(true);
    });

    test('4c: Faculty cannot manage college', () => {
      const user = createMockUser(UserRole.Faculty, { isVerified: true });
      expect(canManageCollege(user)).toBe(false);
    });

    test('4d: Senior cannot manage college', () => {
      const user = createMockUser(UserRole.Student, { joiningYear: seniorJoiningYear, programDuration: 4 });
      expect(canManageCollege(user)).toBe(false);
    });

    test('4e: Student cannot manage college', () => {
      const user = createMockUser(UserRole.Student, { joiningYear: studentJoiningYear, programDuration: 4 });
      expect(canManageCollege(user)).toBe(false);
    });
  });

  describe('TEST GROUP 5: canAccessSuperAdmin()', () => {
    test('5a: SuperAdmin returns true', () => {
      const user = createMockUser(UserRole.Student, { isSuperAdmin: true });
      expect(canAccessSuperAdmin(user)).toBe(true);
    });

    test('5b: CollegeAdmin returns false', () => {
      const user = createMockUser(UserRole.Student, { isCollegeAdmin: true });
      expect(canAccessSuperAdmin(user)).toBe(false);
    });

    test('5c: Faculty returns false', () => {
      const user = createMockUser(UserRole.Faculty, { isVerified: true });
      expect(canAccessSuperAdmin(user)).toBe(false);
    });

    test('5d: Student returns false', () => {
      const user = createMockUser(UserRole.Student, { joiningYear: studentJoiningYear, programDuration: 4 });
      expect(canAccessSuperAdmin(user)).toBe(false);
    });
  });
});

/**
 * Programs Utility Tests
 * College Knowledge Vault
 */

import {
  getProgramDuration,
  getDepartmentsForProgram,
} from '../../src/core/constants/programs';

describe('Programs Utility', () => {
  describe('TEST GROUP 1: getProgramDuration()', () => {
    test('1a: BTech / BE returns 4', () => {
      expect(getProgramDuration('BTech / BE')).toBe(4);
    });

    test('1b: MCA returns 2', () => {
      expect(getProgramDuration('MCA')).toBe(2);
    });

    test('1c: BCA returns 3', () => {
      expect(getProgramDuration('BCA')).toBe(3);
    });

    test('1d: PhD returns 3', () => {
      expect(getProgramDuration('PhD')).toBe(3);
    });

    test('1e: unknown program returns 4 (safe default)', () => {
      expect(getProgramDuration('Unknown Degree')).toBe(4);
    });
  });

  describe('TEST GROUP 2: getDepartmentsForProgram()', () => {
    test('2a: BTech returns CSE, IT etc', () => {
      const depts = getDepartmentsForProgram('BTech / BE');
      expect(depts).toContain('Computer Science Engineering');
      expect(depts).toContain('Information Technology');
    });

    test('2b: MCA returns Computer Applications', () => {
      const depts = getDepartmentsForProgram('MCA');
      expect(depts).toEqual(['Computer Applications']);
    });

    test('2c: unknown program returns empty array', () => {
      const depts = getDepartmentsForProgram('Unknown Degree');
      expect(depts).toEqual([]);
    });
  });
});

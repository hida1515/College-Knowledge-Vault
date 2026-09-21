/**
 * Role Checker & Academic Standing Utility — Single Source of Truth
 * College Knowledge Vault
 *
 * Provides computed effective role logic, program-based academic standing,
 * and multi-tenant access controls.
 * NEVER check user.role directly anywhere in the app; always call computeEffectiveRole(user).
 */

import { UserProfile, User, EffectiveRole, UserRole, AcademicStanding } from '../types/user.types';

/**
 * Computes academic standing based on joining_year and program_duration.
 */
export function computeAcademicStanding(
  user: UserProfile | User,
): AcademicStanding {
  const currentYear = new Date().getFullYear();

  if (!user.joiningYear || !user.programDuration) {
    // Fallback using graduationYear ONLY when both program columns are null
    // (i.e., 003_program_based_seniority.sql migration hasn't been applied yet).
    // When only one is null, the profile is inconsistent → default to student.
    const bothMissing = !user.joiningYear && !user.programDuration;

    if (bothMissing && user.graduationYear !== null && user.graduationYear !== undefined) {
      // graduation_year = joiningYear + programDuration (computed during onboarding).
      // A student with graduation_year=2027 is in their final academic year during 2026.
      // Senior window: graduationYear === currentYear + 1
      // Alumni: graduationYear <= currentYear
      if (user.graduationYear <= currentYear) {
        // Already graduated → alumni (browse only)
        return {
          currentProgramYear: null,
          isFinalYear: false,
          isAlumni: true,
          graduationYear: user.graduationYear,
          accessLevel: 'alumni',
          accessMessage: 'You are an alumni. You can browse but not submit entries.',
          accessColor: '#6C757D',
        };
      }
      if (user.graduationYear === currentYear + 1) {
        // Final academic year → senior (can submit)
        return {
          currentProgramYear: null,
          isFinalYear: true,
          isAlumni: false,
          graduationYear: user.graduationYear,
          accessLevel: 'senior',
          accessMessage: 'You have Senior access. Share your knowledge!',
          accessColor: '#28A745',
        };
      }
    }
    return {
      currentProgramYear: null,
      isFinalYear: false,
      isAlumni: false,
      graduationYear: user.graduationYear ?? null,
      accessLevel: 'student',
      accessMessage: 'Complete your profile to unlock full access',
      accessColor: '#6C757D',
    };
  }

  const graduationYear = user.joiningYear + user.programDuration;
  const currentProgramYear = currentYear - user.joiningYear + 1;
  const isFinalYear = currentProgramYear === user.programDuration;
  const isAlumni = currentYear > graduationYear || currentProgramYear > user.programDuration;

  if (isAlumni) {
    return {
      currentProgramYear,
      isFinalYear: false,
      isAlumni: true,
      graduationYear,
      accessLevel: 'alumni',
      accessMessage:
        'You are an alumni. You can browse but not submit entries.',
      accessColor: '#6C757D',
    };
  }

  if (isFinalYear) {
    return {
      currentProgramYear,
      isFinalYear: true,
      isAlumni: false,
      graduationYear,
      accessLevel: 'senior',
      accessMessage:
        `Year ${currentProgramYear} of ${user.programDuration} — ` +
        'You have Senior access. Share your knowledge!',
      accessColor: '#28A745',
    };
  }

  return {
    currentProgramYear,
    isFinalYear: false,
    isAlumni: false,
    graduationYear,
    accessLevel: 'student',
    accessMessage:
      `Year ${currentProgramYear} of ${user.programDuration} — ` +
      `You will get Senior access in ${graduationYear - 1}`,
    accessColor: '#185FA5',
  };
}

/**
 * Computes the single effective role for a user based on their profile data.
 * Priority order:
 * 1. SuperAdmin (isSuperAdmin === true)
 * 2. CollegeAdmin (isCollegeAdmin === true)
 * 3. Faculty (role === 'faculty' && isVerified === true)
 * 4. PendingFaculty (role === 'faculty' && isVerified === false)
 * 5. Senior (final year student && !isSeniorRevoked)
 * 6. Student (default fallback)
 */
export function computeEffectiveRole(user: UserProfile | User): EffectiveRole {
  if (user.isSuperAdmin) {
    return EffectiveRole.SuperAdmin;
  }

  if (user.isCollegeAdmin) {
    return EffectiveRole.CollegeAdmin;
  }

  if (user.role === UserRole.Faculty) {
    return user.isVerified
      ? EffectiveRole.Faculty
      : EffectiveRole.PendingFaculty;
  }

  if (
    (user.role === UserRole.Senior || (user.role as string) === 'senior') &&
    !user.isSeniorRevoked
  ) {
    return EffectiveRole.Senior;
  }

  const standing = computeAcademicStanding(user);
  if (standing.accessLevel === 'senior' && !user.isSeniorRevoked) {
    return EffectiveRole.Senior;
  }

  return EffectiveRole.Student;
}

/**
 * Returns true if the user can submit knowledge entries.
 * Permitted: Senior, Faculty, CollegeAdmin, SuperAdmin.
 */
export function canSubmitEntries(user: UserProfile | User): boolean {
  const role = computeEffectiveRole(user);
  return (
    role === EffectiveRole.Senior ||
    role === EffectiveRole.Faculty ||
    role === EffectiveRole.CollegeAdmin ||
    role === EffectiveRole.SuperAdmin ||
    ((user.role === UserRole.Senior || (user.role as string) === 'senior') &&
      !user.isSeniorRevoked)
  );
}

/**
 * Returns true if the user can access moderation workflows for their college.
 * Permitted: Faculty, CollegeAdmin, SuperAdmin.
 */
export function canModerate(user: UserProfile): boolean {
  const role = computeEffectiveRole(user);
  return (
    role === EffectiveRole.Faculty ||
    role === EffectiveRole.CollegeAdmin ||
    role === EffectiveRole.SuperAdmin
  );
}

/**
 * Returns true if the user can manage their college's platform (faculty requests, users).
 * Permitted: CollegeAdmin, SuperAdmin.
 */
export function canManageCollege(user: UserProfile): boolean {
  const role = computeEffectiveRole(user);
  return role === EffectiveRole.CollegeAdmin || role === EffectiveRole.SuperAdmin;
}

/**
 * Returns true if the user can access the platform Super Admin panel.
 * Permitted: SuperAdmin only.
 */
export function canAccessSuperAdmin(user: UserProfile): boolean {
  return computeEffectiveRole(user) === EffectiveRole.SuperAdmin;
}

/**
 * Checks if joiningYear and programDuration place a student in Senior status.
 */
export function isSeniorByProgram(
  joiningYear: number | null,
  programDuration: number | null,
): boolean {
  if (!joiningYear || !programDuration) return false;
  const currentYear = new Date().getFullYear();
  const currentProgramYear = currentYear - joiningYear + 1;
  const isAlumni = currentYear > joiningYear + programDuration || currentProgramYear > programDuration;
  return currentProgramYear === programDuration && !isAlumni;
}

/**
 * Returns true if the user's computed effective role is Senior.
 */
export function isSenior(user: UserProfile | User): boolean {
  return computeEffectiveRole(user) === EffectiveRole.Senior;
}

/**
 * Returns true if the user's computed effective role is Student.
 */
export function isStudent(user: UserProfile | User): boolean {
  return computeEffectiveRole(user) === EffectiveRole.Student;
}


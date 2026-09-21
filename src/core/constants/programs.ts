/**
 * Program & Department Definitions
 * College Knowledge Vault
 */

export interface Program {
  name: string;           // Display name e.g. "BTech / BE"
  type: 'ug' | 'pg' | 'phd';
  duration: number;       // Years
  commonDepartments: string[]; // Common specializations
}

export const PROGRAMS: Program[] = [
  {
    name: 'BTech / BE',
    type: 'ug',
    duration: 4,
    commonDepartments: [
      'Computer Science Engineering',
      'Information Technology',
      'Electronics & Communication',
      'Electrical Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
    ],
  },
  {
    name: 'BCA',
    type: 'ug',
    duration: 3,
    commonDepartments: ['Computer Applications'],
  },
  {
    name: 'BSc Computer Science',
    type: 'ug',
    duration: 3,
    commonDepartments: ['Computer Science', 'Information Technology'],
  },
  {
    name: 'BSc',
    type: 'ug',
    duration: 3,
    commonDepartments: ['Mathematics', 'Physics', 'Chemistry', 'Statistics'],
  },
  {
    name: 'BCom',
    type: 'ug',
    duration: 3,
    commonDepartments: ['Commerce', 'Finance', 'Accounting'],
  },
  {
    name: 'BA',
    type: 'ug',
    duration: 3,
    commonDepartments: ['English', 'Economics', 'History', 'Political Science'],
  },
  {
    name: 'BBA',
    type: 'ug',
    duration: 3,
    commonDepartments: ['Business Administration', 'Marketing', 'Finance'],
  },
  {
    name: 'MCA',
    type: 'pg',
    duration: 2,
    commonDepartments: ['Computer Applications'],
  },
  {
    name: 'MTech / ME',
    type: 'pg',
    duration: 2,
    commonDepartments: [
      'Computer Science Engineering',
      'Information Technology',
      'Electronics & Communication',
      'VLSI Design',
      'Embedded Systems',
    ],
  },
  {
    name: 'MSc',
    type: 'pg',
    duration: 2,
    commonDepartments: [
      'Computer Science',
      'Information Technology',
      'Mathematics',
      'Physics',
      'Data Science',
    ],
  },
  {
    name: 'MBA',
    type: 'pg',
    duration: 2,
    commonDepartments: [
      'Marketing',
      'Finance',
      'Human Resources',
      'Operations',
      'Business Analytics',
    ],
  },
  {
    name: 'MA',
    type: 'pg',
    duration: 2,
    commonDepartments: ['English', 'Economics', 'History'],
  },
  {
    name: 'PhD',
    type: 'phd',
    duration: 3,
    commonDepartments: [
      'Computer Science',
      'Mathematics',
      'Physics',
      'Engineering',
    ],
  },
];

// Helper to get duration for a program name
export function getProgramDuration(programName: string): number {
  const program = PROGRAMS.find(p => p.name === programName);
  return program?.duration ?? 4; // Default 4 years
}

// Helper to get program type
export function getProgramType(
  programName: string,
): 'ug' | 'pg' | 'phd' {
  const program = PROGRAMS.find(p => p.name === programName);
  return program?.type ?? 'ug';
}

// Helper to get departments for a program
export function getDepartmentsForProgram(
  programName: string,
): string[] {
  const program = PROGRAMS.find(p => p.name === programName);
  return program?.commonDepartments ?? [];
}

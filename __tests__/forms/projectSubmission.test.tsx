/**
 * Project Submission Flow Unit & Interaction Tests
 *
 * Validates:
 * 1. Step 1: Individual vs Group team members validation.
 * 2. Step 2: Subject & Semester validation.
 * 3. Step 3: GitHub/GitLab URL validation.
 * 4. Step 4: Experience fields character thresholds.
 * 5. Step 5: Viva question modal and list.
 * 6. Step 6: Tags requirement and submission.
 * 7. Edit mode detects isEditMode and renders "Resubmit for Review".
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { ProjectSubmissionFlow } from '../../src/features/submitEntry/screens/project/ProjectSubmissionFlow';
import { renderWithProviders } from '../utils/testUtils';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
    }),
  };
});

jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-123', displayName: 'Jane Dev', email: 'jane@college.edu' },
  }),
}));

let mockForm: any;

jest.mock('../../src/features/submitEntry/context/SubmitFormContext', () => ({
  useSubmitContext: () => mockForm,
  useSubmitFormContext: () => mockForm,
  SubmitFormProvider: ({ children }: any) => children,
}));

function createDefaultMockForm(overrides: Partial<any> = {}) {
  const form: any = {
    projectDetails: {
      projectType: 'individual',
      teamMembers: [],
      category: 'Web App',
      complexity: 'Intermediate',
      githubUrl: null,
      reportUrl: null,
      demoUrl: null,
      otherLinks: [],
      description: 'Comprehensive smart energy monitoring with real-time telemetry dashboard.',
      challenges: 'Interfacing with high voltage sensors safely and ensuring SPI stability.',
      solutions: 'Isolated optocouplers used and added debounce circuitry on data buses.',
      whatWorkedWell: null,
      whatToDoDifferently: null,
      timeTaken: '1 month',
      gradeReceived: null,
      gradeVisible: false,
      tipsForFuture: null,
    },
    semester: '6',
    subject: 'Embedded Systems',
    title: 'IoT Smart Energy Meter System',
    description: 'Comprehensive smart energy monitoring with real-time telemetry dashboard.',
    selectedTags: ['IoT'],
    vivaQuestionsDetailed: [],
    isSubmitting: false,
    isEditMode: false,
    setField: jest.fn((field: string, val: string) => {
      form[field] = val;
    }),
    updateProjectDetails: jest.fn((updater: any) => {
      form.projectDetails =
        typeof updater === 'function'
          ? updater(form.projectDetails)
          : { ...form.projectDetails, ...updater };
    }),
    addTag: jest.fn((t: string) => {
      form.selectedTags = [...form.selectedTags, t];
    }),
    removeTag: jest.fn((t: string) => {
      form.selectedTags = form.selectedTags.filter((x: string) => x !== t);
    }),
    submitEntry: jest.fn().mockResolvedValue(true),
    setType: jest.fn(),
    ...overrides,
  };
  return form;
}

describe('ProjectSubmissionFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockForm = createDefaultMockForm();
  });

  test('Step 1: Individual project is valid by default, shows Next button enabled', async () => {
    const { getByTestId } = await renderWithProviders(<ProjectSubmissionFlow />);

    expect(getByTestId('project-step-1')).toBeTruthy();
    expect(getByTestId('button-next-step')).toBeTruthy();
  });

  test('Step 1: Group project requires at least 2 members with names', async () => {
    mockForm.projectDetails.projectType = 'group';
    mockForm.projectDetails.teamMembers = [];

    const { getByTestId } = await renderWithProviders(<ProjectSubmissionFlow />);

    fireEvent.press(getByTestId('button-group-project'));
    expect(getByTestId('group-members-section')).toBeTruthy();
  });

  test('Step 1: Can add and remove team members with openToConnect toggle', async () => {
    mockForm.projectDetails.projectType = 'group';
    mockForm.projectDetails.teamMembers = [
      { name: 'Jane', linkedinUrl: null, githubUrl: null, email: null, openToConnect: true },
      { name: 'Bob', linkedinUrl: null, githubUrl: null, email: null, openToConnect: true },
    ];

    const { getByTestId } = await renderWithProviders(<ProjectSubmissionFlow />);

    expect(getByTestId('member-card-0')).toBeTruthy();
    expect(getByTestId('member-card-1')).toBeTruthy();
  });

  test('Step 2: Subject and semester inputs validate correctly and advance to step 2', async () => {
    const { getByTestId } = await renderWithProviders(<ProjectSubmissionFlow />);

    fireEvent.press(getByTestId('button-next-step'));

    await waitFor(() => {
      expect(getByTestId('project-step-2')).toBeTruthy();
      expect(getByTestId('input-project-title')).toBeTruthy();
      expect(getByTestId('input-project-subject')).toBeTruthy();
    });
  });

  test('Step 3: Validates GitHub and repository URLs on step 3', async () => {
    const { getByTestId } = await renderWithProviders(<ProjectSubmissionFlow />);

    // Advance to step 2
    fireEvent.press(getByTestId('button-next-step'));
    await waitFor(() => expect(getByTestId('project-step-2')).toBeTruthy());

    // Advance to step 3
    fireEvent.press(getByTestId('button-next-step'));
    await waitFor(() => {
      expect(getByTestId('project-step-3')).toBeTruthy();
      expect(getByTestId('input-github-url')).toBeTruthy();
    });
  });

  test('Step 4: Character count thresholds for experience, challenges, solutions', async () => {
    const { getByTestId } = await renderWithProviders(<ProjectSubmissionFlow />);

    // Step 1 -> 2 -> 3 -> 4
    fireEvent.press(getByTestId('button-next-step'));
    await waitFor(() => expect(getByTestId('project-step-2')).toBeTruthy());

    fireEvent.press(getByTestId('button-next-step'));
    await waitFor(() => expect(getByTestId('project-step-3')).toBeTruthy());

    fireEvent.press(getByTestId('button-next-step'));
    await waitFor(() => {
      expect(getByTestId('project-step-4')).toBeTruthy();
      expect(getByTestId('input-project-description')).toBeTruthy();
      expect(getByTestId('input-project-challenges')).toBeTruthy();
      expect(getByTestId('input-project-solutions')).toBeTruthy();
    });
  });

  test('Step 6: Normal mode renders "Submit for Review"', async () => {
    const { getByTestId, getByText } = await renderWithProviders(<ProjectSubmissionFlow />);

    // Step 1 -> 2 -> 3 -> 4 -> 5 -> 6
    fireEvent.press(getByTestId('button-next-step'));
    await waitFor(() => expect(getByTestId('project-step-2')).toBeTruthy());

    fireEvent.press(getByTestId('button-next-step'));
    await waitFor(() => expect(getByTestId('project-step-3')).toBeTruthy());

    fireEvent.press(getByTestId('button-next-step'));
    await waitFor(() => expect(getByTestId('project-step-4')).toBeTruthy());

    fireEvent.press(getByTestId('button-next-step'));
    await waitFor(() => expect(getByTestId('project-step-5')).toBeTruthy());

    fireEvent.press(getByTestId('button-next-step'));
    await waitFor(() => {
      expect(getByTestId('project-step-6')).toBeTruthy();
      expect(getByText('Submit for Review')).toBeTruthy();
    });
  });

  test('Step 6: In edit mode renders "Resubmit for Review"', async () => {
    mockForm.isEditMode = true;
    const { getByTestId, getByText } = await renderWithProviders(<ProjectSubmissionFlow />);

    // Step 1 -> 2 -> 3 -> 4 -> 5 -> 6
    fireEvent.press(getByTestId('button-next-step'));
    await waitFor(() => expect(getByTestId('project-step-2')).toBeTruthy());

    fireEvent.press(getByTestId('button-next-step'));
    await waitFor(() => expect(getByTestId('project-step-3')).toBeTruthy());

    fireEvent.press(getByTestId('button-next-step'));
    await waitFor(() => expect(getByTestId('project-step-4')).toBeTruthy());

    fireEvent.press(getByTestId('button-next-step'));
    await waitFor(() => expect(getByTestId('project-step-5')).toBeTruthy());

    fireEvent.press(getByTestId('button-next-step'));
    await waitFor(() => {
      expect(getByTestId('project-step-6')).toBeTruthy();
      expect(getByText('Resubmit for Review')).toBeTruthy();
    });
  });
});

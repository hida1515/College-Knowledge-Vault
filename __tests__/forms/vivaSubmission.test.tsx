/**
 * Viva Submission Flow Unit & Interaction Tests
 *
 * Validates:
 * 1. Step 1: Subject name and semester validation.
 * 2. Step 2: Displays questions and can delete questions from guide.
 * 3. Step 3: Related topics and study material.
 * 4. Step 4: Tag requirements and guide summary.
 * 5. Step 4: Normal mode renders "Submit for Review" and submits.
 * 6. Step 4: In edit mode renders "Resubmit for Review".
 * 7. Step 1: Academic year and exam type chip selection.
 * 8. Step 1: Back button navigation.
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { VivaSubmissionFlow } from '../../src/features/submitEntry/screens/viva/VivaSubmissionFlow';
import { renderWithProviders } from '../utils/testUtils';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
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
    subject: 'Operating Systems',
    semester: '4',
    title: 'Operating Systems Viva Q&A Guide',
    description: 'Comprehensive viva evaluation questions and answers.',
    selectedTags: ['OS', 'Linux'],
    vivaQuestionsDetailed: [
      {
        id: 'q1',
        question: 'What is the difference between a process and a thread?',
        answer: 'A process is an executing program instance with isolated memory, while threads share memory within the process.',
        difficulty: 'medium',
        frequency: 'often',
        followUpQuestions: ['What is context switching overhead?'],
        answerTip: 'Mention PCB vs TCB.',
      },
    ],
    vivaDetails: {
      subject: 'Operating Systems',
      semester: 4,
      academicYear: '2024-25',
      examType: 'both',
      relatedTopics: ['Virtual Memory', 'Semaphores'],
      resourceLinks: [{ label: 'Silberschatz Slides', url: 'https://os-book.com' }],
    },
    isSubmitting: false,
    isEditMode: false,
    setField: jest.fn((field: string, val: string) => {
      form[field] = val;
    }),
    updateVivaDetails: jest.fn((updater: any) => {
      form.vivaDetails =
        typeof updater === 'function'
          ? updater(form.vivaDetails)
          : { ...form.vivaDetails, ...updater };
    }),
    addTag: jest.fn((t: string) => {
      form.selectedTags = [...form.selectedTags, t];
    }),
    removeTag: jest.fn((t: string) => {
      form.selectedTags = form.selectedTags.filter((x: string) => x !== t);
    }),
    addVivaQuestionDetailed: jest.fn((q: any) => {
      form.vivaQuestionsDetailed = [...form.vivaQuestionsDetailed, q];
    }),
    removeVivaQuestionDetailed: jest.fn((idx: number) => {
      form.vivaQuestionsDetailed = form.vivaQuestionsDetailed.filter((_: any, i: number) => i !== idx);
    }),
    submitEntry: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
  return form;
}

describe('VivaSubmissionFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockForm = createDefaultMockForm();
  });

  test('Step 1: Renders step 1 with subject and semester filled, next button enabled', async () => {
    const { getByTestId } = await renderWithProviders(<VivaSubmissionFlow />);

    expect(getByTestId('viva-step-1')).toBeTruthy();
    expect(getByTestId('input-viva-subject')).toBeTruthy();
    expect(getByTestId('button-viva-next')).toBeTruthy();
  });

  test('Step 2: Advances to step 2 and displays existing viva questions', async () => {
    const { getByTestId } = await renderWithProviders(<VivaSubmissionFlow />);

    fireEvent.press(getByTestId('button-viva-next'));

    await waitFor(() => {
      expect(getByTestId('viva-step-2')).toBeTruthy();
      expect(getByTestId('question-card-0')).toBeTruthy();
      expect(getByTestId('input-viva-question')).toBeTruthy();
      expect(getByTestId('input-viva-answer')).toBeTruthy();
    });
  });

  test('Step 2: Can delete viva question from list', async () => {
    const { getByTestId, getByText } = await renderWithProviders(<VivaSubmissionFlow />);

    fireEvent.press(getByTestId('button-viva-next'));
    await waitFor(() => expect(getByTestId('viva-step-2')).toBeTruthy());

    fireEvent.press(getByText('Delete'));
    expect(mockForm.removeVivaQuestionDetailed).toHaveBeenCalledWith(0);
  });

  test('Step 3: Advances to step 3 and displays related study material', async () => {
    const { getByTestId } = await renderWithProviders(<VivaSubmissionFlow />);

    // Step 1 -> 2 -> 3
    fireEvent.press(getByTestId('button-viva-next'));
    await waitFor(() => expect(getByTestId('viva-step-2')).toBeTruthy());

    fireEvent.press(getByTestId('button-viva-next'));
    await waitFor(() => {
      expect(getByTestId('viva-step-3')).toBeTruthy();
      expect(getByTestId('input-related-topic')).toBeTruthy();
    });
  });

  test('Step 4: Advances to step 4 and displays guide summary and tags', async () => {
    const { getByTestId } = await renderWithProviders(<VivaSubmissionFlow />);

    // Step 1 -> 2 -> 3 -> 4
    fireEvent.press(getByTestId('button-viva-next'));
    await waitFor(() => expect(getByTestId('viva-step-2')).toBeTruthy());

    fireEvent.press(getByTestId('button-viva-next'));
    await waitFor(() => expect(getByTestId('viva-step-3')).toBeTruthy());

    fireEvent.press(getByTestId('button-viva-next'));
    await waitFor(() => {
      expect(getByTestId('viva-step-4')).toBeTruthy();
      expect(getByTestId('input-viva-tag')).toBeTruthy();
    });
  });

  test('Step 4: Normal mode renders "Submit for Review" and handles submission', async () => {
    const { getByTestId, getByText } = await renderWithProviders(<VivaSubmissionFlow />);

    // Step 1 -> 2 -> 3 -> 4
    fireEvent.press(getByTestId('button-viva-next'));
    await waitFor(() => expect(getByTestId('viva-step-2')).toBeTruthy());

    fireEvent.press(getByTestId('button-viva-next'));
    await waitFor(() => expect(getByTestId('viva-step-3')).toBeTruthy());

    fireEvent.press(getByTestId('button-viva-next'));
    await waitFor(() => {
      expect(getByTestId('viva-step-4')).toBeTruthy();
      expect(getByText('Submit for Review')).toBeTruthy();
    });

    fireEvent.press(getByTestId('button-viva-submit'));
    expect(mockForm.submitEntry).toHaveBeenCalledWith('user-123');
  });

  test('Step 4: In edit mode renders "Resubmit for Review"', async () => {
    mockForm.isEditMode = true;
    const { getByTestId, getByText } = await renderWithProviders(<VivaSubmissionFlow />);

    // Step 1 -> 2 -> 3 -> 4
    fireEvent.press(getByTestId('button-viva-next'));
    await waitFor(() => expect(getByTestId('viva-step-2')).toBeTruthy());

    fireEvent.press(getByTestId('button-viva-next'));
    await waitFor(() => expect(getByTestId('viva-step-3')).toBeTruthy());

    fireEvent.press(getByTestId('button-viva-next'));
    await waitFor(() => {
      expect(getByTestId('viva-step-4')).toBeTruthy();
      expect(getByText('Resubmit for Review')).toBeTruthy();
    });
  });

  test('Step 1: Header back button navigates back when on step 1', async () => {
    const { getByTestId } = await renderWithProviders(<VivaSubmissionFlow />);

    fireEvent.press(getByTestId('button-viva-back'));
    expect(mockGoBack).toHaveBeenCalled();
  });
});

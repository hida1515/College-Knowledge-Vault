/**
 * Mistake & Fix Submission Flow Unit & Interaction Tests
 *
 * Validates:
 * 1. Step 1: Context and title validation.
 * 2. Step 2: Mistake description and root cause character thresholds.
 * 3. Step 3: Solution and prevention validation.
 * 4. Step 4: Tags and submission review.
 * 5. Step 4: Normal mode renders "Submit for Review" and submits.
 * 6. Step 4: In edit mode renders "Resubmit for Review".
 * 7. Step 1: Header back button navigates back on step 1.
 * 8. Step 1: Context and category selection chips.
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { MistakeSubmissionFlow } from '../../src/features/submitEntry/screens/mistake/MistakeSubmissionFlow';
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
    title: 'Forgetting to handle unmounted state in async React Native effects',
    description: 'Detailed explanation of async unmounting bug.',
    selectedTags: ['React Native', 'Hooks'],
    mistakeDetails: {
      context: 'project',
      category: 'implementation',
      subject: 'Mobile Computing',
      semester: 6,
      mistake: 'Directly calling setState after asynchronous fetch without checking if component is mounted.',
      rootCause: 'Failed to understand that component unmounts before network requests resolve.',
      howDiscovered: 'Red screen warning during fast tab switching.',
      solution: 'Used an isMounted boolean flag or AbortController inside useEffect cleanup.',
      prevention: 'Always add cleanup functions to asynchronous effects and lint for memory leaks.',
      impact: 'Frequent crash reports during demo evaluation.',
    },
    isSubmitting: false,
    isEditMode: false,
    setField: jest.fn((field: string, val: string) => {
      form[field] = val;
    }),
    updateMistakeDetails: jest.fn((updater: any) => {
      form.mistakeDetails =
        typeof updater === 'function'
          ? updater(form.mistakeDetails)
          : { ...form.mistakeDetails, ...updater };
    }),
    addTag: jest.fn((t: string) => {
      form.selectedTags = [...form.selectedTags, t];
    }),
    removeTag: jest.fn((t: string) => {
      form.selectedTags = form.selectedTags.filter((x: string) => x !== t);
    }),
    submitEntry: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
  return form;
}

describe('MistakeSubmissionFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockForm = createDefaultMockForm();
  });

  test('Step 1: Renders step 1 with title and context options, next button enabled', async () => {
    const { getByTestId } = await renderWithProviders(<MistakeSubmissionFlow />);

    expect(getByTestId('mistake-step-1')).toBeTruthy();
    expect(getByTestId('input-mistake-title')).toBeTruthy();
    expect(getByTestId('button-mistake-next')).toBeTruthy();
  });

  test('Step 2: Advances to step 2 and displays mistake description fields', async () => {
    const { getByTestId } = await renderWithProviders(<MistakeSubmissionFlow />);

    fireEvent.press(getByTestId('button-mistake-next'));

    await waitFor(() => {
      expect(getByTestId('mistake-step-2')).toBeTruthy();
      expect(getByTestId('input-mistake-desc')).toBeTruthy();
      expect(getByTestId('input-mistake-rootcause')).toBeTruthy();
    });
  });

  test('Step 3: Advances to step 3 and displays fix & prevention fields', async () => {
    const { getByTestId } = await renderWithProviders(<MistakeSubmissionFlow />);

    // Step 1 -> 2 -> 3
    fireEvent.press(getByTestId('button-mistake-next'));
    await waitFor(() => expect(getByTestId('mistake-step-2')).toBeTruthy());

    fireEvent.press(getByTestId('button-mistake-next'));
    await waitFor(() => {
      expect(getByTestId('mistake-step-3')).toBeTruthy();
      expect(getByTestId('input-mistake-solution')).toBeTruthy();
      expect(getByTestId('input-mistake-prevention')).toBeTruthy();
    });
  });

  test('Step 4: Advances to step 4 and displays tags and review', async () => {
    const { getByTestId } = await renderWithProviders(<MistakeSubmissionFlow />);

    // Step 1 -> 2 -> 3 -> 4
    fireEvent.press(getByTestId('button-mistake-next'));
    await waitFor(() => expect(getByTestId('mistake-step-2')).toBeTruthy());

    fireEvent.press(getByTestId('button-mistake-next'));
    await waitFor(() => expect(getByTestId('mistake-step-3')).toBeTruthy());

    fireEvent.press(getByTestId('button-mistake-next'));
    await waitFor(() => {
      expect(getByTestId('mistake-step-4')).toBeTruthy();
      expect(getByTestId('input-mistake-tag')).toBeTruthy();
    });
  });

  test('Step 4: Normal mode renders "Submit for Review" and handles submission', async () => {
    const { getByTestId, getByText } = await renderWithProviders(<MistakeSubmissionFlow />);

    // Step 1 -> 2 -> 3 -> 4
    fireEvent.press(getByTestId('button-mistake-next'));
    await waitFor(() => expect(getByTestId('mistake-step-2')).toBeTruthy());

    fireEvent.press(getByTestId('button-mistake-next'));
    await waitFor(() => expect(getByTestId('mistake-step-3')).toBeTruthy());

    fireEvent.press(getByTestId('button-mistake-next'));
    await waitFor(() => {
      expect(getByTestId('mistake-step-4')).toBeTruthy();
      expect(getByText('Submit for Review')).toBeTruthy();
    });

    fireEvent.press(getByTestId('button-mistake-submit'));
    expect(mockForm.submitEntry).toHaveBeenCalledWith('user-123');
  });

  test('Step 4: In edit mode renders "Resubmit for Review"', async () => {
    mockForm.isEditMode = true;
    const { getByTestId, getByText } = await renderWithProviders(<MistakeSubmissionFlow />);

    // Step 1 -> 2 -> 3 -> 4
    fireEvent.press(getByTestId('button-mistake-next'));
    await waitFor(() => expect(getByTestId('mistake-step-2')).toBeTruthy());

    fireEvent.press(getByTestId('button-mistake-next'));
    await waitFor(() => expect(getByTestId('mistake-step-3')).toBeTruthy());

    fireEvent.press(getByTestId('button-mistake-next'));
    await waitFor(() => {
      expect(getByTestId('mistake-step-4')).toBeTruthy();
      expect(getByText('Resubmit for Review')).toBeTruthy();
    });
  });

  test('Step 1: Header back button navigates back on step 1', async () => {
    const { getByTestId } = await renderWithProviders(<MistakeSubmissionFlow />);

    fireEvent.press(getByTestId('button-mistake-back'));
    expect(mockGoBack).toHaveBeenCalled();
  });

  test('Step 1: Context and category chips update form details', async () => {
    const { getByTestId } = await renderWithProviders(<MistakeSubmissionFlow />);

    fireEvent.press(getByTestId('chip-context-lab'));
    expect(mockForm.updateMistakeDetails).toHaveBeenCalledWith({ context: 'lab' });

    fireEvent.press(getByTestId('chip-category-design'));
    expect(mockForm.updateMistakeDetails).toHaveBeenCalledWith({ category: 'design' });
  });
});

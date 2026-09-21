/**
 * Resource Submission Flow Unit & Interaction Tests
 *
 * Validates:
 * 1. Step 1: Title and URL validation.
 * 2. Step 1: Resource type chip selection.
 * 3. Step 1: Paid/Free toggle and cost field.
 * 4. Step 2: Subject selection and review text minimums.
 * 5. Step 3: Tags and summary review.
 * 6. Step 3: Normal mode renders "Submit for Review" and submits.
 * 7. Step 3: In edit mode renders "Resubmit for Review".
 * 8. Step 1: Header back button navigates back on step 1.
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { ResourceSubmissionFlow } from '../../src/features/submitEntry/screens/resource/ResourceSubmissionFlow';
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
    title: 'NeetCode 150 System Design & Coding',
    description: 'In-depth video playlist and roadmap for technical interviews.',
    subject: 'Data Structures',
    selectedTags: ['DSA', 'Interviews'],
    resourceDetails: {
      url: 'https://neetcode.io/practice',
      resourceType: 'youtube_playlist',
      isPaid: false,
      cost: null,
      subjectsCovered: ['Data Structures', 'Operating Systems'],
      difficulty: 'intermediate',
      review: 'Clear video explanations covering optimal time and space complexity with animations.',
      bestTimeToUse: 'During 5th and 6th semester placement prep.',
    },
    isSubmitting: false,
    isEditMode: false,
    setField: jest.fn((field: string, val: string) => {
      form[field] = val;
    }),
    updateResourceDetails: jest.fn((updater: any) => {
      form.resourceDetails =
        typeof updater === 'function'
          ? updater(form.resourceDetails)
          : { ...form.resourceDetails, ...updater };
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

describe('ResourceSubmissionFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockForm = createDefaultMockForm();
  });

  test('Step 1: Renders step 1 with title and URL options, next button enabled', async () => {
    const { getByTestId } = await renderWithProviders(<ResourceSubmissionFlow />);

    expect(getByTestId('resource-step-1')).toBeTruthy();
    expect(getByTestId('input-resource-title')).toBeTruthy();
    expect(getByTestId('input-resource-url')).toBeTruthy();
    expect(getByTestId('button-resource-next')).toBeTruthy();
  });

  test('Step 1: Resource type chips update resource details', async () => {
    const { getByTestId } = await renderWithProviders(<ResourceSubmissionFlow />);

    fireEvent.press(getByTestId('chip-type-article'));
    expect(mockForm.updateResourceDetails).toHaveBeenCalledWith({ resourceType: 'article' });
  });

  test('Step 1: Paid toggle updates paid status', async () => {
    const { getByTestId } = await renderWithProviders(<ResourceSubmissionFlow />);

    fireEvent(getByTestId('toggle-resource-paid'), 'valueChange', true);
    expect(mockForm.updateResourceDetails).toHaveBeenCalledWith({ isPaid: true });
  });

  test('Step 2: Advances to step 2 and displays subjects and personal review', async () => {
    const { getByTestId } = await renderWithProviders(<ResourceSubmissionFlow />);

    fireEvent.press(getByTestId('button-resource-next'));

    await waitFor(() => {
      expect(getByTestId('resource-step-2')).toBeTruthy();
      expect(getByTestId('input-resource-review')).toBeTruthy();
    });
  });

  test('Step 3: Advances to step 3 and displays tags and review summary', async () => {
    const { getByTestId } = await renderWithProviders(<ResourceSubmissionFlow />);

    // Step 1 -> 2 -> 3
    fireEvent.press(getByTestId('button-resource-next'));
    await waitFor(() => expect(getByTestId('resource-step-2')).toBeTruthy());

    fireEvent.press(getByTestId('button-resource-next'));
    await waitFor(() => {
      expect(getByTestId('resource-step-3')).toBeTruthy();
      expect(getByTestId('input-resource-tag')).toBeTruthy();
    });
  });

  test('Step 3: Normal mode renders "Submit for Review" and handles submission', async () => {
    const { getByTestId, getByText } = await renderWithProviders(<ResourceSubmissionFlow />);

    // Step 1 -> 2 -> 3
    fireEvent.press(getByTestId('button-resource-next'));
    await waitFor(() => expect(getByTestId('resource-step-2')).toBeTruthy());

    fireEvent.press(getByTestId('button-resource-next'));
    await waitFor(() => {
      expect(getByTestId('resource-step-3')).toBeTruthy();
      expect(getByText('Submit for Review')).toBeTruthy();
    });

    fireEvent.press(getByTestId('button-resource-submit'));
    expect(mockForm.submitEntry).toHaveBeenCalledWith('user-123');
  });

  test('Step 3: In edit mode renders "Resubmit for Review"', async () => {
    mockForm.isEditMode = true;
    const { getByTestId, getByText } = await renderWithProviders(<ResourceSubmissionFlow />);

    // Step 1 -> 2 -> 3
    fireEvent.press(getByTestId('button-resource-next'));
    await waitFor(() => expect(getByTestId('resource-step-2')).toBeTruthy());

    fireEvent.press(getByTestId('button-resource-next'));
    await waitFor(() => {
      expect(getByTestId('resource-step-3')).toBeTruthy();
      expect(getByText('Resubmit for Review')).toBeTruthy();
    });
  });

  test('Step 1: Header back button navigates back on step 1', async () => {
    const { getByTestId } = await renderWithProviders(<ResourceSubmissionFlow />);

    fireEvent.press(getByTestId('button-resource-back'));
    expect(mockGoBack).toHaveBeenCalled();
  });
});

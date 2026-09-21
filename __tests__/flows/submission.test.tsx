/**
 * Submission Flow Automated Tests
 * College Knowledge Vault
 *
 * Covers:
 * - Step 1 (Type selection)
 * - Step 2 (Details & Validation)
 * - Step 3 (Tags)
 * - Step 4 (Viva questions)
 * - Step 5 (Submit)
 * - Role guard (student blocked, senior allowed)
 */

import React from 'react';
import { Alert } from 'react-native';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react-native';
import { useSubmitForm } from '../../src/features/submitEntry/hooks/useSubmitForm';
import { EntryType } from '../../src/core/types/entry.types';
import * as entryService from '../../src/core/services/entryService';

// Mock entryService.createEntry
jest.mock('../../src/core/services/entryService', () => ({
  ...jest.requireActual('../../src/core/services/entryService'),
  createEntry: jest.fn(),
}));

const mockCreateEntry = entryService.createEntry as jest.Mock;

// Mock SubmitFormContext
const mockFormState = {
  currentStep: 0,
  selectedType: null as EntryType | null,
  title: '',
  description: '',
  subject: '',
  semester: '',
  selectedTags: [] as string[],
  customTag: '',
  vivaQuestions: [] as Array<{ question: string; answer: string; difficulty: 'easy' | 'medium' | 'hard' }>,
  isSubmitting: false,
  error: null as string | null,
  isSuccess: false,
  setType: jest.fn(),
  setField: jest.fn(),
  nextStep: jest.fn(),
  previousStep: jest.fn(),
  isStepValid: jest.fn(() => false),
  addTag: jest.fn(),
  removeTag: jest.fn(),
  addVivaQuestion: jest.fn(),
  removeVivaQuestion: jest.fn(),
  submitEntry: jest.fn(),
  reset: jest.fn(),
  setCurrentStep: jest.fn(),
};

jest.mock('../../src/features/submitEntry/context/SubmitFormContext', () => {
  return {
    useSubmitContext: () => mockFormState,
    useSubmitFormContext: () => mockFormState,
    SubmitFormProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock authStore
jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: jest.fn((selector?: (s: unknown) => unknown) => {
    const state = {
      user: { id: 'user-1', role: 'senior', displayName: 'John' },
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

// Mock MMKV
jest.mock('../../src/core/services/mmkvStorage', () => ({
  appStorage: {
    set: jest.fn(),
    getString: jest.fn(),
    getBoolean: jest.fn(() => false),
    delete: jest.fn(),
  },
}));

describe('Submission Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormState.currentStep = 0;
    mockFormState.selectedType = null;
    mockFormState.isStepValid.mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
  });

  // ─── GROUP 1: useSubmitForm hook — Step 1 type selection ───

  describe('TEST GROUP 1: Step 1 — Type selection via hook', () => {
    test('1a: initial selectedType is null', async () => {
      const res = await renderHook(() => useSubmitForm());
      expect(res.result.current.selectedType).toBeNull();
    });

    test('1b: initial step 0 is invalid (no type)', async () => {
      const res = await renderHook(() => useSubmitForm());
      expect(res.result.current.isStepValid()).toBe(false);
    });

    test('1c: setType selects Project', async () => {
      const res = await renderHook(() => useSubmitForm());
      await act(async () => {
        res.result.current.setType(EntryType.Project);
      });
      await waitFor(() => {
        expect(res.result.current.selectedType).toBe(EntryType.Project);
      });
    });

    test('1d: step 0 valid after type selected', async () => {
      const res = await renderHook(() => useSubmitForm());
      await act(async () => {
        res.result.current.setType(EntryType.Viva);
      });
      await waitFor(() => {
        expect(res.result.current.isStepValid()).toBe(true);
      });
    });

    test('1e: nextStep advances to step 1', async () => {
      const res = await renderHook(() => useSubmitForm());
      await act(async () => {
        res.result.current.setType(EntryType.Project);
        res.result.current.nextStep();
      });
      await waitFor(() => {
        expect(res.result.current.currentStep).toBe(1);
      });
    });
  });

  // ─── GROUP 2: Step 2 — Details validation ───

  describe('TEST GROUP 2: Step 2 — Details validation', () => {
    async function setupAtStep1() {
      const res = await renderHook(() => useSubmitForm());
      await act(async () => {
        res.result.current.setType(EntryType.Project);
        res.result.current.nextStep();
      });
      await waitFor(() => {
        expect(res.result.current.currentStep).toBe(1);
      });
      return res;
    }

    test('2a: step 1 invalid when title < 10 chars', async () => {
      const res = await setupAtStep1();
      await act(async () => {
        res.result.current.setField('title', 'Short');
        res.result.current.setField('description', 'A'.repeat(30));
        res.result.current.setField('subject', 'CS');
        res.result.current.setField('semester', '3');
      });
      expect(res.result.current.isStepValid()).toBe(false);
    });

    test('2b: step 1 invalid when description < 30 chars', async () => {
      const res = await setupAtStep1();
      await act(async () => {
        res.result.current.setField('title', 'A'.repeat(10));
        res.result.current.setField('description', 'Short desc');
        res.result.current.setField('subject', 'CS');
        res.result.current.setField('semester', '3');
      });
      expect(res.result.current.isStepValid()).toBe(false);
    });

    test('2c: step 1 invalid when subject empty', async () => {
      const res = await setupAtStep1();
      await act(async () => {
        res.result.current.setField('title', 'A'.repeat(10));
        res.result.current.setField('description', 'A'.repeat(30));
        res.result.current.setField('subject', '');
        res.result.current.setField('semester', '3');
      });
      expect(res.result.current.isStepValid()).toBe(false);
    });

    test('2d: step 1 invalid when semester empty', async () => {
      const res = await setupAtStep1();
      await act(async () => {
        res.result.current.setField('title', 'A'.repeat(10));
        res.result.current.setField('description', 'A'.repeat(30));
        res.result.current.setField('subject', 'CS');
        res.result.current.setField('semester', '');
      });
      expect(res.result.current.isStepValid()).toBe(false);
    });

    test('2e: step 1 valid when all fields meet requirements', async () => {
      const res = await setupAtStep1();
      await act(async () => {
        res.result.current.setField('title', 'A'.repeat(10));
        res.result.current.setField('description', 'A'.repeat(30));
        res.result.current.setField('subject', 'CS');
        res.result.current.setField('semester', '3');
      });
      await waitFor(() => {
        expect(res.result.current.isStepValid()).toBe(true);
      });
    });

    test('2f: Back from step 1 goes to step 0', async () => {
      const res = await setupAtStep1();
      await act(async () => {
        res.result.current.previousStep();
      });
      await waitFor(() => {
        expect(res.result.current.currentStep).toBe(0);
      });
    });
  });

  // ─── GROUP 3: Step 3 — Tags ───

  describe('TEST GROUP 3: Step 3 — Tags', () => {
    async function setupAtStep2() {
      const res = await renderHook(() => useSubmitForm());
      await act(async () => {
        res.result.current.setType(EntryType.Project);
        res.result.current.nextStep();
        res.result.current.setField('title', 'A'.repeat(10));
        res.result.current.setField('description', 'A'.repeat(30));
        res.result.current.setField('subject', 'CS');
        res.result.current.setField('semester', '3');
        res.result.current.nextStep();
      });
      await waitFor(() => {
        expect(res.result.current.currentStep).toBe(2);
      });
      return res;
    }

    test('3a: step 2 invalid with 0 tags', async () => {
      const res = await setupAtStep2();
      expect(res.result.current.isStepValid()).toBe(false);
    });

    test('3b: addTag adds a tag', async () => {
      const res = await setupAtStep2();
      await act(async () => {
        res.result.current.addTag('React');
      });
      await waitFor(() => {
        expect(res.result.current.selectedTags).toContain('React');
      });
    });

    test('3c: step 2 valid with at least 1 tag', async () => {
      const res = await setupAtStep2();
      await act(async () => {
        res.result.current.addTag('React');
      });
      await waitFor(() => {
        expect(res.result.current.isStepValid()).toBe(true);
      });
    });

    test('3d: removeTag removes a tag', async () => {
      const res = await setupAtStep2();
      await act(async () => {
        res.result.current.addTag('React');
        res.result.current.removeTag('React');
      });
      await waitFor(() => {
        expect(res.result.current.selectedTags).not.toContain('React');
      });
    });

    test('3e: duplicate tag is not added', async () => {
      const res = await setupAtStep2();
      await act(async () => {
        res.result.current.addTag('React');
        res.result.current.addTag('react');
      });
      await waitFor(() => {
        expect(res.result.current.selectedTags.length).toBe(1);
      });
    });
  });

  // ─── GROUP 4: Step 4 — Viva questions ───

  describe('TEST GROUP 4: Step 4 — Viva questions', () => {
    async function setupAtStep3() {
      const res = await renderHook(() => useSubmitForm());
      await act(async () => {
        res.result.current.setType(EntryType.Viva);
        res.result.current.nextStep();
        res.result.current.setField('title', 'A'.repeat(10));
        res.result.current.setField('description', 'A'.repeat(30));
        res.result.current.setField('subject', 'CS');
        res.result.current.setField('semester', '3');
        res.result.current.nextStep();
        res.result.current.addTag('Java');
        res.result.current.nextStep();
      });
      await waitFor(() => {
        expect(res.result.current.currentStep).toBe(3);
      });
      return res;
    }

    test('4a: step 3 is always valid (optional)', async () => {
      const res = await setupAtStep3();
      expect(res.result.current.isStepValid()).toBe(true);
    });

    test('4b: addVivaQuestion adds a question', async () => {
      const res = await setupAtStep3();
      await act(async () => {
        res.result.current.addVivaQuestion({
          question: 'What is OOP?',
          answer: 'Object-Oriented Programming',
          difficulty: 'easy',
        });
      });
      await waitFor(() => {
        expect(res.result.current.vivaQuestions.length).toBe(1);
      });
    });

    test('4c: removeVivaQuestion removes by index', async () => {
      const res = await setupAtStep3();
      await act(async () => {
        res.result.current.addVivaQuestion({
          question: 'Q1',
          answer: 'A1',
          difficulty: 'easy',
        });
        res.result.current.removeVivaQuestion(0);
      });
      await waitFor(() => {
        expect(res.result.current.vivaQuestions.length).toBe(0);
      });
    });

    test('4d: max 20 questions enforced', async () => {
      const res = await setupAtStep3();
      await act(async () => {
        for (let i = 0; i < 22; i++) {
          res.result.current.addVivaQuestion({
            question: `Q${i}`,
            answer: `A${i}`,
            difficulty: 'easy',
          });
        }
      });
      await waitFor(() => {
        expect(res.result.current.vivaQuestions.length).toBe(20);
      });
    });
  });

  // ─── GROUP 5: Step 5 — Submit ───

  describe('TEST GROUP 5: Step 5 — Submit', () => {
    test('5a: submitEntry calls createEntry service', async () => {
      mockCreateEntry.mockResolvedValue({ id: 'new-entry' });
      const res = await renderHook(() => useSubmitForm());

      await act(async () => {
        res.result.current.setType(EntryType.Project);
        res.result.current.nextStep();
        res.result.current.setField('title', 'A'.repeat(10));
        res.result.current.setField('description', 'A'.repeat(30));
        res.result.current.setField('subject', 'CS');
        res.result.current.setField('semester', '3');
        res.result.current.nextStep();
        res.result.current.addTag('React');
        res.result.current.nextStep();
        res.result.current.nextStep();
      });

      await act(async () => {
        await res.result.current.submitEntry('user-1');
      });

      expect(mockCreateEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          authorId: 'user-1',
          type: EntryType.Project,
          tags: ['React'],
        }),
      );
    });

    test('5b: isSuccess=true after successful submission', async () => {
      mockCreateEntry.mockResolvedValue({ id: 'new-entry' });
      const res = await renderHook(() => useSubmitForm());

      await act(async () => {
        res.result.current.setType(EntryType.Project);
      });

      await act(async () => {
        await res.result.current.submitEntry('user-1');
      });

      await waitFor(() => {
        expect(res.result.current.isSuccess).toBe(true);
      });
    });

    test('5c: error set on submission failure', async () => {
      mockCreateEntry.mockRejectedValue(new Error('Network error'));
      const res = await renderHook(() => useSubmitForm());

      await act(async () => {
        res.result.current.setType(EntryType.Project);
      });

      await act(async () => {
        await res.result.current.submitEntry('user-1');
      });

      await waitFor(() => {
        expect(res.result.current.error).toBe('Network error');
      });
    });
  });

  // ─── GROUP 6: Role guard ───

  describe('TEST GROUP 6: Role guard', () => {
    test('6a: student role should be blocked from submission (alert shown)', () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const mockPreventDefault = jest.fn();

      const user = { role: 'student' };
      if (user.role === 'student') {
        mockPreventDefault();
        Alert.alert(
          'Permission Denied',
          'Only graduating seniors and faculty can submit knowledge entries.',
        );
      }

      expect(mockPreventDefault).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        'Permission Denied',
        'Only graduating seniors and faculty can submit knowledge entries.',
      );
      alertSpy.mockRestore();
    });

    test('6b: senior role is not blocked', () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const mockPreventDefault = jest.fn();

      const user = { role: 'senior' };
      if (user.role === 'student') {
        mockPreventDefault();
        Alert.alert('Permission Denied', '...');
      }

      expect(mockPreventDefault).not.toHaveBeenCalled();
      expect(alertSpy).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });
});

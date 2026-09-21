import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useSubmitForm } from '../../src/features/submitEntry/hooks/useSubmitForm';
import { EntryType } from '../../src/core/types/entry.types';
import * as entryService from '../../src/core/services/entryService';

jest.mock('../../src/core/services/entryService');

describe('useSubmitForm hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TEST GROUP 1: Step validation', () => {
    test('1a & 1b: step 0 invalid when type null, valid when selected', async () => {
      const { result } = await renderHook(() => useSubmitForm());

      expect(result.current.currentStep).toBe(0);
      expect(result.current.isStepValid()).toBe(false);

      await act(async () => {
        result.current.setType(EntryType.Project);
      });

      await waitFor(() => {
        expect(result.current.selectedType).toBe(EntryType.Project);
        expect(result.current.isStepValid()).toBe(true);
      });
    });

    test('1c, 1d & 1e: step 1 requirements for title, description, subject, semester', async () => {
      const { result } = await renderHook(() => useSubmitForm());

      await act(async () => {
        result.current.setType(EntryType.Project);
      });
      await act(async () => {
        result.current.nextStep();
      });

      await waitFor(() => {
        expect(result.current.currentStep).toBe(1);
      });
      expect(result.current.isStepValid()).toBe(false);

      await act(async () => {
        result.current.setField('title', 'Short');
        result.current.setField('description', 'Short description');
        result.current.setField('subject', 'Math');
        result.current.setField('semester', '5');
      });
      expect(result.current.isStepValid()).toBe(false);

      await act(async () => {
        result.current.setField('title', 'Valid Title 123');
        result.current.setField(
          'description',
          'Valid Description long enough for 30 chars min requirement',
        );
      });
      await waitFor(() => {
        expect(result.current.isStepValid()).toBe(true);
      });
    });

    test('1f & 1g: step 2 requires at least 1 tag', async () => {
      const { result } = await renderHook(() => useSubmitForm());

      await act(async () => {
        result.current.setCurrentStep(2);
      });

      await waitFor(() => {
        expect(result.current.currentStep).toBe(2);
      });
      expect(result.current.isStepValid()).toBe(false);

      await act(async () => {
        result.current.addTag('React Native');
      });

      await waitFor(() => {
        expect(result.current.isStepValid()).toBe(true);
      });
    });

    test('1h: step 3 is always valid (viva optional)', async () => {
      const { result } = await renderHook(() => useSubmitForm());

      await act(async () => {
        result.current.setCurrentStep(3);
      });

      await waitFor(() => {
        expect(result.current.isStepValid()).toBe(true);
      });
    });
  });

  describe('TEST GROUP 2: Navigation', () => {
    test('2a & 2b: nextStep only advances when step is valid', async () => {
      const { result } = await renderHook(() => useSubmitForm());

      await act(async () => {
        result.current.nextStep();
      });
      expect(result.current.currentStep).toBe(0);

      await act(async () => {
        result.current.setType(EntryType.Viva);
      });
      await act(async () => {
        result.current.nextStep();
      });
      await waitFor(() => {
        expect(result.current.currentStep).toBe(1);
      });
    });

    test('2c & 2d: previousStep decrements step and stops at 0', async () => {
      const { result } = await renderHook(() => useSubmitForm());

      await act(async () => {
        result.current.setCurrentStep(2);
      });

      await act(async () => {
        result.current.previousStep();
      });
      await waitFor(() => {
        expect(result.current.currentStep).toBe(1);
      });

      await act(async () => {
        result.current.previousStep();
      });
      await waitFor(() => {
        expect(result.current.currentStep).toBe(0);
      });

      await act(async () => {
        result.current.previousStep();
      });
      expect(result.current.currentStep).toBe(0);
    });
  });

  describe('TEST GROUP 3: Tag & Viva Management', () => {
    test('3a, 3b, 3c: adds tag, ignores duplicate, removes tag', async () => {
      const { result } = await renderHook(() => useSubmitForm());

      await act(async () => {
        result.current.addTag('React');
      });
      await act(async () => {
        result.current.addTag('react'); // duplicate
      });

      await waitFor(() => {
        expect(result.current.selectedTags).toEqual(['React']);
      });

      await act(async () => {
        result.current.removeTag('React');
      });

      await waitFor(() => {
        expect(result.current.selectedTags).toEqual([]);
      });
    });

    test('3d & 3e: adds viva question and removes by index', async () => {
      const { result } = await renderHook(() => useSubmitForm());

      await act(async () => {
        result.current.addVivaQuestion({
          question: 'Q1',
          answer: 'A1',
          difficulty: 'easy',
        });
      });

      await waitFor(() => {
        expect(result.current.vivaQuestions.length).toBe(1);
      });

      await act(async () => {
        result.current.removeVivaQuestion(0);
      });

      await waitFor(() => {
        expect(result.current.vivaQuestions.length).toBe(0);
      });
    });
  });

  describe('TEST GROUP 4: submitEntry()', () => {
    test('4a, 4b, 4c: manages isSubmitting, calls createEntry, sets isSuccess', async () => {
      (entryService.createEntry as jest.Mock).mockResolvedValue('new-id-123');

      const { result } = await renderHook(() => useSubmitForm());

      await act(async () => {
        result.current.setType(EntryType.Project);
      });
      await act(async () => {
        result.current.setField('title', 'Valid Title Long');
        result.current.setField(
          'description',
          'Valid Description long enough for 30 chars min requirement',
        );
        result.current.setField('subject', 'Math');
        result.current.setField('semester', '6');
      });
      await act(async () => {
        result.current.addTag('React');
      });

      await act(async () => {
        await result.current.submitEntry('user-1');
      });

      expect(entryService.createEntry).toHaveBeenCalledWith({
        authorId: 'user-1',
        title: 'Valid Title Long',
        description:
          'Valid Description long enough for 30 chars min requirement',
        type: EntryType.Project,
        subject: 'Math',
        semester: 6,
        tags: ['React'],
        vivaQuestions: [],
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isSubmitting).toBe(false);
    });

    test('4d: sets error on submit failure', async () => {
      (entryService.createEntry as jest.Mock).mockRejectedValue(
        new Error('Network error'),
      );

      const { result } = await renderHook(() => useSubmitForm());

      await act(async () => {
        result.current.setType(EntryType.Project);
      });

      await act(async () => {
        await result.current.submitEntry('user-1');
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.isSuccess).toBe(false);
    });
  });
});

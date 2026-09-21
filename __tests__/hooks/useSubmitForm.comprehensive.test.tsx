/**
 * useSubmitForm Comprehensive Hook Tests
 * College Knowledge Vault
 */

import { renderHook, act, cleanup } from '@testing-library/react-native';
import { useSubmitForm } from '../../src/features/submitEntry/hooks/useSubmitForm';
import { EntryType } from '../../src/core/types/entry.types';

describe('useSubmitForm Hook Comprehensive Tests', () => {
  afterEach(() => {
    cleanup();
  });

  describe('TEST GROUP 1: Initial state', () => {
    test('1a: currentStep starts at 0', async () => {
      const { result } = await renderHook(() => useSubmitForm());
      expect(result.current.currentStep).toBe(0);
    });

    test('1b: selectedType starts null', async () => {
      const { result } = await renderHook(() => useSubmitForm());
      expect(result.current.selectedType).toBeNull();
    });

    test('1c: title starts empty string', async () => {
      const { result } = await renderHook(() => useSubmitForm());
      expect(result.current.title).toBe('');
    });

    test('1d: selectedTags starts empty array', async () => {
      const { result } = await renderHook(() => useSubmitForm());
      expect(result.current.selectedTags).toEqual([]);
    });

    test('1e: vivaQuestions starts empty array', async () => {
      const { result } = await renderHook(() => useSubmitForm());
      expect(result.current.vivaQuestions).toEqual([]);
    });

    test('1f: isSubmitting starts false', async () => {
      const { result } = await renderHook(() => useSubmitForm());
      expect(result.current.isSubmitting).toBe(false);
    });

    test('1g: isSuccess starts false', async () => {
      const { result } = await renderHook(() => useSubmitForm());
      expect(result.current.isSuccess).toBe(false);
    });
  });

  describe('TEST GROUP 2: All validation scenarios', () => {
    test('2a: step 0 — null type is invalid', async () => {
      const { result } = await renderHook(() => useSubmitForm());
      expect(result.current.isStepValid()).toBe(false);
    });

    test('2b: step 0 — any EntryType is valid', async () => {
      const { result } = await renderHook(() => useSubmitForm());
      await act(async () => {
        result.current.setType(EntryType.Project);
      });
      expect(result.current.isStepValid()).toBe(true);

      await act(async () => {
        result.current.setType(EntryType.Viva);
      });
      expect(result.current.isStepValid()).toBe(true);
    });

    test('2c: step 1 — title with 9 chars is invalid', async () => {
      const { result } = await renderHook(() => useSubmitForm());
      await act(async () => {
        result.current.setType(EntryType.Project);
        result.current.nextStep();
      });

      await act(async () => {
        result.current.setField('title', '123456789');
        result.current.setField('description', 'A'.repeat(30));
        result.current.setField('subject', 'Math');
        result.current.setField('semester', '2');
      });

      expect(result.current.isStepValid()).toBe(false);
    });

    test('2d: step 1 — title with 10 chars is valid', async () => {
      const { result } = await renderHook(() => useSubmitForm());
      await act(async () => {
        result.current.setType(EntryType.Project);
        result.current.nextStep();
      });

      await act(async () => {
        result.current.setField('title', '1234567890');
        result.current.setField('description', 'A'.repeat(30));
        result.current.setField('subject', 'Math');
        result.current.setField('semester', '2');
      });

      expect(result.current.isStepValid()).toBe(true);
    });

    test('2e: step 1 — description with 29 chars is invalid', async () => {
      const { result } = await renderHook(() => useSubmitForm());
      await act(async () => {
        result.current.setType(EntryType.Project);
        result.current.nextStep();
      });

      await act(async () => {
        result.current.setField('title', 'Valid Title Length');
        result.current.setField('description', 'A'.repeat(29));
        result.current.setField('subject', 'Math');
        result.current.setField('semester', '2');
      });

      expect(result.current.isStepValid()).toBe(false);
    });

    test('2f: step 1 — description with 30 chars is valid', async () => {
      const { result } = await renderHook(() => useSubmitForm());
      await act(async () => {
        result.current.setType(EntryType.Project);
        result.current.nextStep();
      });

      await act(async () => {
        result.current.setField('title', 'Valid Title Length');
        result.current.setField('description', 'A'.repeat(30));
        result.current.setField('subject', 'Math');
        result.current.setField('semester', '2');
      });

      expect(result.current.isStepValid()).toBe(true);
    });

    test('2g: step 1 — empty subject is invalid', async () => {
      const { result } = await renderHook(() => useSubmitForm());
      await act(async () => {
        result.current.setType(EntryType.Project);
        result.current.nextStep();
      });

      await act(async () => {
        result.current.setField('title', 'Valid Title Length');
        result.current.setField('description', 'A'.repeat(30));
        result.current.setField('subject', '   ');
        result.current.setField('semester', '2');
      });

      expect(result.current.isStepValid()).toBe(false);
    });

    test('2h: step 1 — empty semester is invalid', async () => {
      const { result } = await renderHook(() => useSubmitForm());
      await act(async () => {
        result.current.setType(EntryType.Project);
        result.current.nextStep();
      });

      await act(async () => {
        result.current.setField('title', 'Valid Title Length');
        result.current.setField('description', 'A'.repeat(30));
        result.current.setField('subject', 'Math');
        result.current.setField('semester', '');
      });

      expect(result.current.isStepValid()).toBe(false);
    });

    test('2i: step 2 — 0 tags is invalid', async () => {
      const { result } = await renderHook(() => useSubmitForm());
      await act(async () => {
        result.current.setType(EntryType.Project);
        result.current.nextStep();
        result.current.setField('title', 'Valid Title Length');
        result.current.setField('description', 'A'.repeat(30));
        result.current.setField('subject', 'Math');
        result.current.setField('semester', '2');
        result.current.nextStep();
      });

      expect(result.current.isStepValid()).toBe(false);
    });

    test('2j: step 2 — 1 tag is valid', async () => {
      const { result } = await renderHook(() => useSubmitForm());
      await act(async () => {
        result.current.setType(EntryType.Project);
        result.current.nextStep();
        result.current.setField('title', 'Valid Title Length');
        result.current.setField('description', 'A'.repeat(30));
        result.current.setField('subject', 'Math');
        result.current.setField('semester', '2');
        result.current.nextStep();
        result.current.addTag('React');
      });

      expect(result.current.isStepValid()).toBe(true);
    });

    test('2k: step 3 — always valid regardless of questions', async () => {
      const { result } = await renderHook(() => useSubmitForm());
      await act(async () => {
        result.current.setType(EntryType.Project);
        result.current.nextStep();
        result.current.setField('title', 'Valid Title Length');
        result.current.setField('description', 'A'.repeat(30));
        result.current.setField('subject', 'Math');
        result.current.setField('semester', '2');
        result.current.nextStep();
        result.current.addTag('React');
        result.current.nextStep();
      });

      expect(result.current.isStepValid()).toBe(true);
    });

    test('2l: step 4 — always valid (review step)', async () => {
      const { result } = await renderHook(() => useSubmitForm());
      await act(async () => {
        result.current.setType(EntryType.Project);
        result.current.nextStep();
        result.current.setField('title', 'Valid Title Length');
        result.current.setField('description', 'A'.repeat(30));
        result.current.setField('subject', 'Math');
        result.current.setField('semester', '2');
        result.current.nextStep();
        result.current.addTag('React');
        result.current.nextStep();
        result.current.nextStep();
      });

      expect(result.current.isStepValid()).toBe(true);
    });
  });

  describe('TEST GROUP 3: reset() function', () => {
    test('3a-3f: reset restores initial state', async () => {
      const { result } = await renderHook(() => useSubmitForm());

      await act(async () => {
        result.current.setType(EntryType.Project);
        result.current.nextStep();
        result.current.setField('title', 'Valid Title Length');
        result.current.setField('description', 'A'.repeat(30));
        result.current.addTag('React');
        result.current.addVivaQuestion({
          question: 'Q',
          answer: 'A',
          difficulty: 'easy',
        });
      });

      await act(async () => {
        result.current.reset();
      });

      expect(result.current.currentStep).toBe(0);
      expect(result.current.selectedType).toBeNull();
      expect(result.current.title).toBe('');
      expect(result.current.selectedTags).toEqual([]);
      expect(result.current.vivaQuestions).toEqual([]);
      expect(result.current.isSuccess).toBe(false);
    });
  });
});

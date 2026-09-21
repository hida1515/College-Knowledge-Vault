/**
 * Draft Saving Tests
 * College Knowledge Vault
 *
 * Validates:
 * TEST GROUP 1: Draft persistence
 *   test 1a: draft saved to AsyncStorage after field change
 *   test 1b: draft loaded on mount when exists
 *   test 1c: draft not loaded when older than 24 hours
 *   test 1d: draft cleared after successful submission
 *   test 1e: draft cleared after reset()
 *   test 1f: resume draft alert shown when draft exists
 *   test 1g: start fresh clears draft
 */

import React from 'react';
import { renderHook, act, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import {
  useSubmitForm,
  SUBMISSION_DRAFT_KEY,
} from '../../src/features/submitEntry/hooks/useSubmitForm';
import SubmitStep1Type from '../../src/features/submitEntry/screens/SubmitStep1Type';
import { SubmitFormProvider } from '../../src/features/submitEntry/context/SubmitFormContext';
import { EntryType } from '../../src/core/types/entry.types';
import { useAuthStore } from '../../src/core/store/authStore';

jest.mock('../../src/core/services/entryService', () => ({
  createEntry: jest.fn().mockResolvedValue('entry-123'),
  updateEntry: jest.fn().mockResolvedValue(undefined),
  getEntryForEdit: jest.fn().mockResolvedValue(null),
  checkDuplicate: jest.fn().mockResolvedValue({ isDuplicate: false }),
}));

describe('Draft Persistence Tests', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    useAuthStore.setState({
      user: {
        id: 'user-1',
        displayName: 'Senior User',
        email: 'senior@example.com',
        role: 'senior',
        college: 'Test College',
        collegeId: 'college-1',
        department: 'CS',
        graduationYear: 2024,
        joiningYear: 2020,
        programDuration: 4,
        program: 'B.Tech',
        programType: 'ug',
        isVerified: true,
      } as any,
      isAuthenticated: true,
    });
  });

  describe('TEST GROUP 1: Draft persistence', () => {
    test('1a: draft saved to AsyncStorage after field change', async () => {
      const { result } = await renderHook(() => useSubmitForm());

      await act(async () => {
        result.current.setType(EntryType.Project);
        result.current.setField('title', 'My Draft Project');
      });

      // Allow useEffect auto-save to run
      await waitFor(async () => {
        const saved = await AsyncStorage.getItem(SUBMISSION_DRAFT_KEY);
        expect(saved).not.toBeNull();
        const parsed = JSON.parse(saved!);
        expect(parsed.selectedType).toBe(EntryType.Project);
        expect(parsed.title).toBe('My Draft Project');
        expect(parsed.savedAt).toBeDefined();
      });
    });

    test('1b: draft loaded on mount when exists', async () => {
      const mockDraft = {
        selectedType: EntryType.Viva,
        title: 'Draft Viva Title',
        description: 'Draft Viva Description',
        subject: 'Database Systems',
        semester: '5',
        currentStep: 0,
        selectedTags: ['SQL', 'DBMS'],
        vivaQuestions: [],
        vivaQuestionsDetailed: [],
        savedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(SUBMISSION_DRAFT_KEY, JSON.stringify(mockDraft));

      const { result } = await renderHook(() => useSubmitForm());

      await waitFor(() => {
        expect(result.current.selectedType).toBe(EntryType.Viva);
        expect(result.current.title).toBe('Draft Viva Title');
        expect(result.current.subject).toBe('Database Systems');
      });
    });

    test('1c: draft not loaded when older than 24 hours', async () => {
      const expiredDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      const mockDraft = {
        selectedType: EntryType.Resource,
        title: 'Old Resource Title',
        savedAt: expiredDate,
      };
      await AsyncStorage.setItem(SUBMISSION_DRAFT_KEY, JSON.stringify(mockDraft));

      const { result } = await renderHook(() => useSubmitForm());

      await waitFor(async () => {
        expect(result.current.selectedType).toBeNull();
        const saved = await AsyncStorage.getItem(SUBMISSION_DRAFT_KEY);
        expect(saved).toBeNull();
      });
    });

    test('1d: draft cleared after successful submission', async () => {
      const mockDraft = {
        selectedType: EntryType.Project,
        title: 'Valid Project Title Long Enough',
        description: 'Valid Description with enough length for thirty characters',
        subject: 'Computer Science',
        semester: '4',
        selectedTags: ['React'],
        savedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(SUBMISSION_DRAFT_KEY, JSON.stringify(mockDraft));

      const { result } = await renderHook(() => useSubmitForm());

      await waitFor(() => {
        expect(result.current.selectedType).toBe(EntryType.Project);
      });

      await act(async () => {
        await result.current.submitEntry('user-1', true);
      });

      expect(result.current.isSuccess).toBe(true);
      const saved = await AsyncStorage.getItem(SUBMISSION_DRAFT_KEY);
      expect(saved).toBeNull();
    });

    test('1e: draft cleared after reset()', async () => {
      const mockDraft = {
        selectedType: EntryType.Mistake,
        title: 'Mistake Draft',
        savedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(SUBMISSION_DRAFT_KEY, JSON.stringify(mockDraft));

      const { result } = await renderHook(() => useSubmitForm());

      await act(async () => {
        result.current.reset();
      });

      expect(result.current.selectedType).toBeNull();
      const saved = await AsyncStorage.getItem(SUBMISSION_DRAFT_KEY);
      expect(saved).toBeNull();
    });

    test('1f: resume draft alert shown when draft exists', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const mockDraft = {
        selectedType: EntryType.Project,
        title: 'Draft Project',
        savedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(SUBMISSION_DRAFT_KEY, JSON.stringify(mockDraft));

      await render(
        React.createElement(
          SubmitFormProvider,
          null,
          React.createElement(SubmitStep1Type, null),
        ),
      );

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Resume Draft?',
          expect.stringContaining('You have an unfinished entry'),
          expect.any(Array),
        );
      });
    });

    test('1g: start fresh clears draft', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const mockDraft = {
        selectedType: EntryType.Project,
        title: 'Draft Project',
        savedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(SUBMISSION_DRAFT_KEY, JSON.stringify(mockDraft));

      await render(
        React.createElement(
          SubmitFormProvider,
          null,
          React.createElement(SubmitStep1Type, null),
        ),
      );

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });

      // Find Start Fresh action and invoke it
      const buttons = alertSpy.mock.calls[0][2];
      const startFreshBtn = buttons?.find((b) => b.text === 'Start Fresh');
      expect(startFreshBtn).toBeDefined();

      await act(async () => {
        await startFreshBtn?.onPress?.();
      });

      const saved = await AsyncStorage.getItem(SUBMISSION_DRAFT_KEY);
      expect(saved).toBeNull();
    });
  });
});


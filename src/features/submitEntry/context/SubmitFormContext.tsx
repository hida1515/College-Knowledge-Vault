/**
 * Submit Form Context
 * College Knowledge Vault
 *
 * Provides shared state across all 5 submit step screens in the navigation stack.
 */

import React, { createContext, useContext } from 'react';
import { useSubmitForm } from '../hooks/useSubmitForm';

type SubmitFormContextType = ReturnType<typeof useSubmitForm>;

const SubmitFormContext = createContext<SubmitFormContextType | null>(null);

export const SubmitFormProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const formState = useSubmitForm();
  return (
    <SubmitFormContext.Provider value={formState}>
      {children}
    </SubmitFormContext.Provider>
  );
};

export function useSubmitContext(): SubmitFormContextType {
  const ctx = useContext(SubmitFormContext);
  if (ctx) return ctx;
  return {
    currentStep: 0,
    setCurrentStep: () => {},
    selectedType: null,
    title: '',
    description: '',
    subject: '',
    semester: '',
    selectedTags: [],
    customTag: '',
    vivaQuestions: [],
    vivaQuestionsDetailed: [],
    projectDetails: {
      projectType: 'individual',
      teamMembers: [],
      category: 'Web App',
      complexity: 'intermediate',
      githubUrl: null,
      reportUrl: null,
      demoUrl: null,
      otherLinks: [],
      description: '',
      challenges: '',
      solutions: '',
      whatWorkedWell: null,
      whatToDoDifferently: null,
      timeTaken: '1 month',
      gradeReceived: null,
      gradeVisible: false,
      tipsForFuture: null,
    },
    vivaDetails: {
      subject: '',
      semester: 1,
      academicYear: '2024-25',
      examType: 'both',
      relatedTopics: [],
      resourceLinks: [],
    },
    mistakeDetails: {
      context: 'project',
      category: 'implementation',
      subject: null,
      semester: null,
      mistake: '',
      rootCause: '',
      howDiscovered: null,
      solution: '',
      prevention: '',
      impact: null,
    },
    resourceDetails: {
      url: '',
      resourceType: 'article',
      isPaid: false,
      cost: null,
      subjectsCovered: [],
      difficulty: 'intermediate',
      review: '',
      bestTimeToUse: null,
    },
    isSubmitting: false,
    error: null,
    isSuccess: false,
    isEditMode: false,
    editEntryId: null,
    setType: () => {},
    setField: () => {},
    updateProjectDetails: () => {},
    updateVivaDetails: () => {},
    updateMistakeDetails: () => {},
    updateResourceDetails: () => {},
    nextStep: () => {},
    previousStep: () => {},
    isStepValid: () => false,
    addTag: () => {},
    removeTag: () => {},
    addVivaQuestion: () => {},
    removeVivaQuestion: () => {},
    addVivaQuestionDetailed: () => {},
    removeVivaQuestionDetailed: () => {},
    loadEntryForEdit: async () => {},
    setEditMode: () => {},
    submitEntry: async () => {},
    reset: () => {},
    loadDraft: async () => false,
    clearDraft: async () => {},
  };
}

export const useSubmitFormContext = useSubmitContext;

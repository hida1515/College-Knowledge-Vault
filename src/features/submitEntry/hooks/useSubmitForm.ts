/**
 * Custom Hook — Submit Form State Management
 * College Knowledge Vault
 *
 * Multi-step form state machine managing type-specific flows (Project, Viva, Mistake, Resource),
 * validation, duplicate checking, editing rejected entries, and Supabase submission.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EntryType,
  ProjectDetails,
  VivaDetails,
  VivaQuestionDetailed,
  MistakeDetails,
  ResourceDetails,
  CreateEntryPayload,
} from '../../../core/types/entry.types';
import {
  createEntry,
  updateEntry,
  getEntryForEdit,
  checkDuplicate,
} from '../../../core/services/entryService';
import { useAuthStore } from '../../../core/store/authStore';
import { UserRole } from '../../../core/types/user.types';
import { queryClient } from '../../../app/QueryClient';

export const SUBMISSION_DRAFT_KEY = '@submission_draft';

export interface VivaQuestionInput {
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const defaultProjectDetails: ProjectDetails = {
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
};

const defaultVivaDetails: VivaDetails = {
  subject: '',
  semester: 1,
  academicYear: '2024-25',
  examType: 'both',
  relatedTopics: [],
  resourceLinks: [],
};

const defaultMistakeDetails: MistakeDetails = {
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
};

const defaultResourceDetails: ResourceDetails = {
  url: '',
  resourceType: 'article',
  isPaid: false,
  cost: null,
  subjectsCovered: [],
  difficulty: 'intermediate',
  review: '',
  bestTimeToUse: null,
};

export function useSubmitForm() {
  const [currentStep, _setCurrentStep] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<EntryType | null>(null);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [semester, setSemester] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [, setCustomTag] = useState<string>('');
  const [vivaQuestions, setVivaQuestions] = useState<VivaQuestionInput[]>([]);
  const [vivaQuestionsDetailed, setVivaQuestionsDetailed] = useState<VivaQuestionDetailed[]>([]);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>(defaultProjectDetails);
  const [vivaDetails, setVivaDetails] = useState<VivaDetails>(defaultVivaDetails);
  const [mistakeDetails, setMistakeDetails] = useState<MistakeDetails>(defaultMistakeDetails);
  const [resourceDetails, setResourceDetails] = useState<ResourceDetails>(defaultResourceDetails);
  const [, setIsSubmitting] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);
  const [, setIsSuccess] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [, setEditEntryId] = useState<string | null>(null);

  const selectedTypeRef = useRef<EntryType | null>(null);
  const titleRef = useRef<string>('');
  const descriptionRef = useRef<string>('');
  const subjectRef = useRef<string>('');
  const semesterRef = useRef<string>('');
  const selectedTagsRef = useRef<string[]>([]);
  const currentStepRef = useRef<number>(0);
  const customTagRef = useRef<string>('');
  const vivaQuestionsRef = useRef<VivaQuestionInput[]>([]);
  const vivaQuestionsDetailedRef = useRef<VivaQuestionDetailed[]>([]);
  const projectDetailsRef = useRef<ProjectDetails>(defaultProjectDetails);
  const vivaDetailsRef = useRef<VivaDetails>(defaultVivaDetails);
  const mistakeDetailsRef = useRef<MistakeDetails>(defaultMistakeDetails);
  const resourceDetailsRef = useRef<ResourceDetails>(defaultResourceDetails);
  const isSubmittingRef = useRef<boolean>(false);
  const errorRef = useRef<string | null>(null);
  const isSuccessRef = useRef<boolean>(false);
  const isEditModeRef = useRef<boolean>(false);
  const editEntryIdRef = useRef<string | null>(null);
  const hasCustomDetailsRef = useRef<boolean>(false);
  const isDraftLoadingRef = useRef<boolean>(false);

  const setCurrentStep = useCallback((step: number | ((prev: number) => number)) => {
    const next = typeof step === 'function' ? step(currentStepRef.current) : step;
    currentStepRef.current = next;
    _setCurrentStep(next);
  }, []);

  const setType = useCallback((type: EntryType) => {
    selectedTypeRef.current = type;
    setSelectedType(type);
  }, []);

  const setField = useCallback((field: string, value: string) => {
    if (field === 'title') {
      titleRef.current = value;
      setTitle(value);
    } else if (field === 'description') {
      descriptionRef.current = value;
      setDescription(value);
    } else if (field === 'subject') {
      subjectRef.current = value;
      setSubject(value);
    } else if (field === 'semester') {
      semesterRef.current = value;
      setSemester(value);
    } else if (field === 'customTag') {
      customTagRef.current = value;
      setCustomTag(value);
    }
  }, []);

  const updateProjectDetails = useCallback((updater: Partial<ProjectDetails> | ((prev: ProjectDetails) => ProjectDetails)) => {
    hasCustomDetailsRef.current = true;
    const updated = typeof updater === 'function' ? updater(projectDetailsRef.current) : { ...projectDetailsRef.current, ...updater };
    projectDetailsRef.current = updated;
    setProjectDetails({ ...updated });
  }, []);

  const updateVivaDetails = useCallback((updater: Partial<VivaDetails> | ((prev: VivaDetails) => VivaDetails)) => {
    hasCustomDetailsRef.current = true;
    const updated = typeof updater === 'function' ? updater(vivaDetailsRef.current) : { ...vivaDetailsRef.current, ...updater };
    vivaDetailsRef.current = updated;
    setVivaDetails({ ...updated });
  }, []);

  const updateMistakeDetails = useCallback((updater: Partial<MistakeDetails> | ((prev: MistakeDetails) => MistakeDetails)) => {
    hasCustomDetailsRef.current = true;
    const updated = typeof updater === 'function' ? updater(mistakeDetailsRef.current) : { ...mistakeDetailsRef.current, ...updater };
    mistakeDetailsRef.current = updated;
    setMistakeDetails({ ...updated });
  }, []);

  const updateResourceDetails = useCallback((updater: Partial<ResourceDetails> | ((prev: ResourceDetails) => ResourceDetails)) => {
    hasCustomDetailsRef.current = true;
    const updated = typeof updater === 'function' ? updater(resourceDetailsRef.current) : { ...resourceDetailsRef.current, ...updater };
    resourceDetailsRef.current = updated;
    setResourceDetails({ ...updated });
  }, []);

  const clearDraft = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(SUBMISSION_DRAFT_KEY);
    } catch {}
  }, []);

  const loadDraft = useCallback(async (): Promise<boolean> => {
    try {
      isDraftLoadingRef.current = true;
      const saved = await AsyncStorage.getItem(SUBMISSION_DRAFT_KEY);
      if (!saved) return false;
      const draft = JSON.parse(saved);
      const age = Date.now() - new Date(draft.savedAt).getTime();
      if (age > 24 * 60 * 60 * 1000) {
        await AsyncStorage.removeItem(SUBMISSION_DRAFT_KEY);
        return false;
      }

      if (draft.selectedType) {
        selectedTypeRef.current = draft.selectedType;
        setSelectedType(draft.selectedType);
      }
      if (draft.title !== undefined) {
        titleRef.current = draft.title;
        setTitle(draft.title);
      }
      if (draft.description !== undefined) {
        descriptionRef.current = draft.description;
        setDescription(draft.description);
      }
      if (draft.subject !== undefined) {
        subjectRef.current = draft.subject;
        setSubject(draft.subject);
      }
      if (draft.semester !== undefined) {
        semesterRef.current = draft.semester;
        setSemester(draft.semester);
      }
      if (draft.selectedTags) {
        selectedTagsRef.current = draft.selectedTags;
        setSelectedTags(draft.selectedTags);
      }
      if (draft.vivaQuestions) {
        vivaQuestionsRef.current = draft.vivaQuestions;
        setVivaQuestions(draft.vivaQuestions);
      }
      if (draft.vivaQuestionsDetailed) {
        vivaQuestionsDetailedRef.current = draft.vivaQuestionsDetailed;
        setVivaQuestionsDetailed(draft.vivaQuestionsDetailed);
      }
      if (draft.projectDetails) {
        projectDetailsRef.current = draft.projectDetails;
        setProjectDetails(draft.projectDetails);
      }
      if (draft.vivaDetails) {
        vivaDetailsRef.current = draft.vivaDetails;
        setVivaDetails(draft.vivaDetails);
      }
      if (draft.mistakeDetails) {
        mistakeDetailsRef.current = draft.mistakeDetails;
        setMistakeDetails(draft.mistakeDetails);
      }
      if (draft.resourceDetails) {
        resourceDetailsRef.current = draft.resourceDetails;
        setResourceDetails(draft.resourceDetails);
      }
      if (draft.hasCustomDetails) {
        hasCustomDetailsRef.current = true;
      }

      currentStepRef.current = 0;
      _setCurrentStep(0);
      return true;
    } catch {
      return false;
    } finally {
      isDraftLoadingRef.current = false;
    }
  }, []);

  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  // Auto-save on every state change
  useEffect(() => {
    if (isEditMode) return;
    if (isDraftLoadingRef.current) return;
    if (isSubmittingRef.current || isSuccessRef.current) return;

    const hasContent =
      selectedType !== null ||
      title.length > 0 ||
      description.length > 0 ||
      subject.length > 0 ||
      semester.length > 0 ||
      selectedTags.length > 0 ||
      vivaQuestions.length > 0 ||
      vivaQuestionsDetailed.length > 0;

    if (!hasContent) return;

    const draft = {
      selectedType,
      projectDetails,
      vivaDetails,
      mistakeDetails,
      resourceDetails,
      currentStep,
      selectedTags,
      vivaQuestions,
      vivaQuestionsDetailed,
      title,
      description,
      subject,
      semester,
      savedAt: new Date().toISOString(),
    };
    AsyncStorage.setItem(SUBMISSION_DRAFT_KEY, JSON.stringify(draft)).catch(() => {});
  }, [
    selectedType,
    projectDetails,
    vivaDetails,
    mistakeDetails,
    resourceDetails,
    currentStep,
    selectedTags,
    vivaQuestions,
    vivaQuestionsDetailed,
    title,
    description,
    subject,
    semester,
    isEditMode,
  ]);

  const isStepValid = useCallback((explicitStep?: number): boolean => {
    const activeStep = explicitStep !== undefined ? explicitStep : (currentStepRef.current || 0);
    const activeType = selectedTypeRef.current;
    const activeTitle = titleRef.current || '';
    const activeDescription = descriptionRef.current || '';
    const activeSubject = subjectRef.current || '';
    const activeSemester = semesterRef.current || '';
    const activeTags = selectedTagsRef.current || [];

    if (activeStep === 0) {
      return activeType !== null;
    }

    // Generic backward-compatible checks for legacy tests
    if (activeStep === 1) {
      const parsedSemester = parseInt(activeSemester.trim(), 10);
      return (
        activeTitle.trim().length >= 10 &&
        activeDescription.trim().length >= 30 &&
        activeSubject.trim() !== '' &&
        activeSemester.trim() !== '' &&
        !isNaN(parsedSemester) &&
        parsedSemester >= 1 &&
        parsedSemester <= 8
      );
    }
    if (activeStep === 2) {
      return activeTags.length >= 1;
    }
    if (activeStep === 3) {
      return true; // Optional viva step
    }
    if (activeStep === 4) {
      return true; // Review step
    }
    return false;
  }, []);

  const nextStep = useCallback(() => {
    if (isStepValid()) {
      currentStepRef.current += 1;
      const next = currentStepRef.current;
      _setCurrentStep(next);
    }
  }, [isStepValid]);

  const previousStep = useCallback(() => {
    if (currentStepRef.current > 0) {
      currentStepRef.current -= 1;
      const prev = currentStepRef.current;
      _setCurrentStep(prev);
    }
  }, []);

  const addTag = useCallback((tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    if (selectedTagsRef.current.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      return;
    }
    selectedTagsRef.current.push(clean);
    setSelectedTags([...selectedTagsRef.current]);
  }, []);

  const removeTag = useCallback((tag: string) => {
    selectedTagsRef.current = selectedTagsRef.current.filter((t) => t !== tag);
    setSelectedTags([...selectedTagsRef.current]);
  }, []);

  const addVivaQuestion = useCallback((q: VivaQuestionInput) => {
    if (vivaQuestionsRef.current.length >= 20) return;
    vivaQuestionsRef.current.push(q);
    setVivaQuestions([...vivaQuestionsRef.current]);
  }, []);

  const removeVivaQuestion = useCallback((index: number) => {
    vivaQuestionsRef.current = vivaQuestionsRef.current.filter((_, i) => i !== index);
    setVivaQuestions([...vivaQuestionsRef.current]);
  }, []);

  const addVivaQuestionDetailed = useCallback((q: Omit<VivaQuestionDetailed, 'id'>) => {
    if (vivaQuestionsDetailedRef.current.length >= 50) return;
    const newQ: VivaQuestionDetailed = {
      ...q,
      id: String(Date.now() + Math.random()),
    };
    vivaQuestionsDetailedRef.current.push(newQ);
    setVivaQuestionsDetailed([...vivaQuestionsDetailedRef.current]);
  }, []);

  const removeVivaQuestionDetailed = useCallback((index: number) => {
    vivaQuestionsDetailedRef.current = vivaQuestionsDetailedRef.current.filter((_, i) => i !== index);
    setVivaQuestionsDetailed([...vivaQuestionsDetailedRef.current]);
  }, []);

  const loadEntryForEdit = useCallback(async (entryId: string) => {
    try {
      const data = await getEntryForEdit(entryId);
      isEditModeRef.current = true;
      editEntryIdRef.current = entryId;
      setIsEditMode(true);
      setEditEntryId(entryId);

      selectedTypeRef.current = data.type;
      setSelectedType(data.type);

      titleRef.current = data.title;
      setTitle(data.title);

      descriptionRef.current = data.description;
      setDescription(data.description);

      subjectRef.current = data.subject;
      setSubject(data.subject);

      semesterRef.current = data.semester;
      setSemester(data.semester);

      selectedTagsRef.current = data.tags || [];
      setSelectedTags(data.tags || []);

      if (data.projectDetails) {
        projectDetailsRef.current = data.projectDetails;
        setProjectDetails(data.projectDetails);
      }
      if (data.vivaDetails) {
        vivaDetailsRef.current = data.vivaDetails;
        setVivaDetails(data.vivaDetails);
      }
      if (data.mistakeDetails) {
        mistakeDetailsRef.current = data.mistakeDetails;
        setMistakeDetails(data.mistakeDetails);
      }
      if (data.resourceDetails) {
        resourceDetailsRef.current = data.resourceDetails;
        setResourceDetails(data.resourceDetails);
      }
      if (data.vivaQuestions) {
        vivaQuestionsRef.current = data.vivaQuestions;
        setVivaQuestions(data.vivaQuestions);
      }
      if (data.vivaQuestionsDetailed) {
        vivaQuestionsDetailedRef.current = data.vivaQuestionsDetailed;
        setVivaQuestionsDetailed(data.vivaQuestionsDetailed);
      }
      hasCustomDetailsRef.current = true;
    } catch {
      Alert.alert('Error', 'Failed to load entry for editing.');
    }
  }, []);

  const setEditMode = useCallback((editMode: boolean, entryId: string | null = null) => {
    isEditModeRef.current = editMode;
    editEntryIdRef.current = entryId;
    setIsEditMode(editMode);
    setEditEntryId(entryId);
  }, []);

  const reset = useCallback(() => {
    currentStepRef.current = 0;
    selectedTypeRef.current = null;
    titleRef.current = '';
    descriptionRef.current = '';
    subjectRef.current = '';
    semesterRef.current = '';
    selectedTagsRef.current = [];
    customTagRef.current = '';
    vivaQuestionsRef.current = [];
    vivaQuestionsDetailedRef.current = [];
    projectDetailsRef.current = defaultProjectDetails;
    vivaDetailsRef.current = defaultVivaDetails;
    mistakeDetailsRef.current = defaultMistakeDetails;
    resourceDetailsRef.current = defaultResourceDetails;
    isSubmittingRef.current = false;
    errorRef.current = null;
    isSuccessRef.current = false;
    isEditModeRef.current = false;
    editEntryIdRef.current = null;
    hasCustomDetailsRef.current = false;

    _setCurrentStep(0);
    setSelectedType(null);
    setTitle('');
    setDescription('');
    setSubject('');
    setSemester('');
    setSelectedTags([]);
    setCustomTag('');
    setVivaQuestions([]);
    setVivaQuestionsDetailed([]);
    setProjectDetails(defaultProjectDetails);
    setVivaDetails(defaultVivaDetails);
    setMistakeDetails(defaultMistakeDetails);
    setResourceDetails(defaultResourceDetails);
    setIsSubmitting(false);
    setError(null);
    setIsSuccess(false);
    setIsEditMode(false);
    setEditEntryId(null);
    clearDraft();
  }, [clearDraft]);

  const doSubmit = useCallback(async (userId: string) => {
    const activeType = selectedTypeRef.current || selectedType;
    const activeTitle = titleRef.current || '';
    const activeDescription = descriptionRef.current || projectDetailsRef.current.description || 'Project Guide submission';
    const activeSubject = subjectRef.current || '';
    const activeSemester = semesterRef.current || '1';
    const activeTags = selectedTagsRef.current || [];
    const activeViva = vivaQuestionsRef.current || [];
    const activeVivaDetailed = vivaQuestionsDetailedRef.current || [];

    if (!activeType) {
      throw new Error('Please select an entry type before submitting.');
    }
    try {
      isSubmittingRef.current = true;
      errorRef.current = null;
      setIsSubmitting(true);
      setError(null);

      // Check academic profile completeness for student/senior
      const currentUser = typeof useAuthStore.getState === 'function' ? useAuthStore.getState().user : null;
      if (currentUser && (currentUser.role === UserRole.Student || currentUser.role === UserRole.Senior)) {
        if (!currentUser.joiningYear || !currentUser.programDuration) {
          throw new Error(
            'Your academic profile is incomplete. ' +
            'Please update your profile with joining year and program.'
          );
        }
      }

      if (isEditModeRef.current && editEntryIdRef.current) {
        await updateEntry(editEntryIdRef.current, {
          title: activeTitle.trim() || 'Project Guide',
          description: activeDescription.trim(),
          type: activeType,
          subject: activeSubject.trim(),
          semester: activeSemester.trim() || '1',
          tags: activeTags,
          projectDetails: activeType === EntryType.Project ? projectDetailsRef.current : undefined,
          vivaDetails: activeType === EntryType.Viva ? vivaDetailsRef.current : undefined,
          mistakeDetails: activeType === EntryType.Mistake ? mistakeDetailsRef.current : undefined,
          resourceDetails: activeType === EntryType.Resource ? resourceDetailsRef.current : undefined,
          vivaQuestionsDetailed: activeVivaDetailed,
        });
      } else {
        const payload: CreateEntryPayload = {
          authorId: userId,
          title: activeTitle.trim() || 'Project Guide',
          description: activeDescription.trim(),
          type: activeType,
          subject: activeSubject.trim(),
          semester: parseInt(activeSemester.trim(), 10) || 1,
          tags: activeTags,
          vivaQuestions: activeViva,
        };

        if (currentUser?.collegeId) {
          payload.collegeId = currentUser.collegeId;
        }

        if (activeVivaDetailed.length > 0) {
          payload.vivaQuestionsDetailed = activeVivaDetailed;
        }

        if (hasCustomDetailsRef.current) {
          if (activeType === EntryType.Project) payload.projectDetails = projectDetailsRef.current;
          if (activeType === EntryType.Viva) payload.vivaDetails = vivaDetailsRef.current;
          if (activeType === EntryType.Mistake) payload.mistakeDetails = mistakeDetailsRef.current;
          if (activeType === EntryType.Resource) payload.resourceDetails = resourceDetailsRef.current;
        }

        await createEntry(payload);
      }

      queryClient.invalidateQueries({ queryKey: ['entries'] });
      reset();
      isSuccessRef.current = true;
      setIsSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit entry';
      errorRef.current = msg;
      setError(msg);
      Alert.alert('Submission Failed', msg);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [reset, selectedType]);

  const submitEntry = useCallback(
    async (userId: string, skipDuplicateCheck: boolean = false) => {
      const activeType = selectedTypeRef.current || selectedType;
      const activeTitle = titleRef.current || '';

      if (!activeType) {
        throw new Error('Please select an entry type before submitting.');
      }

      // In non-edit mode, check for duplicates before proceeding if title is provided
      if (!isEditModeRef.current && !skipDuplicateCheck && activeTitle.trim().length > 0) {
        let dupResult = null;
        try {
          dupResult = await checkDuplicate({
            authorId: userId,
            title: activeTitle,
            type: activeType,
          });
        } catch {
          dupResult = null;
        }

        if (dupResult && dupResult.isDuplicate) {
          Alert.alert(
            'Similar Entry Found',
            'You may have already submitted a similar entry. Do you want to continue anyway?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Submit Anyway',
                onPress: () => {
                  doSubmit(userId);
                },
              },
            ],
          );
          return;
        }
      }

      await doSubmit(userId);
    },
    [doSubmit, selectedType],
  );

  return {
    get currentStep() {
      return currentStepRef.current;
    },
    setCurrentStep,
    get selectedType() {
      return selectedTypeRef.current;
    },
    get title() {
      return titleRef.current;
    },
    get description() {
      return descriptionRef.current;
    },
    get subject() {
      return subjectRef.current;
    },
    get semester() {
      return semesterRef.current;
    },
    get selectedTags() {
      return selectedTagsRef.current;
    },
    get customTag() {
      return customTagRef.current;
    },
    get vivaQuestions() {
      return vivaQuestionsRef.current;
    },
    get vivaQuestionsDetailed() {
      return vivaQuestionsDetailedRef.current;
    },
    get projectDetails() {
      return projectDetailsRef.current;
    },
    get vivaDetails() {
      return vivaDetailsRef.current;
    },
    get mistakeDetails() {
      return mistakeDetailsRef.current;
    },
    get resourceDetails() {
      return resourceDetailsRef.current;
    },
    get isSubmitting() {
      return isSubmittingRef.current;
    },
    get error() {
      return errorRef.current;
    },
    get isSuccess() {
      return isSuccessRef.current;
    },
    get isEditMode() {
      return isEditModeRef.current;
    },
    get editEntryId() {
      return editEntryIdRef.current;
    },
    setType,
    setField,
    updateProjectDetails,
    updateVivaDetails,
    updateMistakeDetails,
    updateResourceDetails,
    nextStep,
    previousStep,
    isStepValid,
    addTag,
    removeTag,
    addVivaQuestion,
    removeVivaQuestion,
    addVivaQuestionDetailed,
    removeVivaQuestionDetailed,
    loadEntryForEdit,
    setEditMode,
    submitEntry,
    reset,
    loadDraft,
    clearDraft,
  };
}

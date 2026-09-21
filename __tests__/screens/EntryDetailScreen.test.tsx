/**
 * EntryDetailScreen Unit & Interaction Tests
 *
 * Validates:
 * 1. Renders project entry with details and title.
 * 2. Renders outdated warning banner when outdatedCount >= 3.
 * 3. Author sees rejection notice and "Edit & Resubmit" on rejected entry.
 * 4. Clicking "Edit & Resubmit" on a project entry calls loadEntryForEdit and navigates to ProjectSubmissionFlow.
 * 5. Clicking "Edit & Resubmit" on a viva entry navigates to VivaSubmissionFlow.
 * 6. Tapping 3-dot menu opens outdated modal and submitting flags entry.
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { EntryDetailScreen } from '../../src/features/entryDetail/screens/EntryDetailScreen';
import * as entryService from '../../src/core/services/entryService';
import { renderWithProviders, createMockEntry } from '../utils/testUtils';
import { EntryType, EntryStatus } from '../../src/core/types/entry.types';

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
    useRoute: () => ({
      params: { entryId: 'test-entry-123' },
    }),
  };
});

jest.mock('../../src/core/store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'author-user-1', displayName: 'Jane Dev' },
  }),
}));

const mockLoadEntryForEdit = jest.fn().mockResolvedValue(undefined);
jest.mock('../../src/features/submitEntry/context/SubmitFormContext', () => ({
  useSubmitFormContext: () => ({
    loadEntryForEdit: mockLoadEntryForEdit,
  }),
}));

jest.mock('../../src/core/services/bookmarkService', () => ({
  isBookmarked: jest.fn().mockResolvedValue(false),
  toggleBookmark: jest.fn().mockResolvedValue(true),
}));

describe('EntryDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders project entry details and title', async () => {
    const mockEntry = createMockEntry({
      id: 'test-entry-123',
      title: 'Autonomous Drone Navigation System',
      type: EntryType.Project,
      authorId: 'other-user',
      projectDetails: {
        projectType: 'individual',
        teamMembers: [],
        category: 'IoT',
        complexity: 'advanced',
        githubUrl: 'https://github.com/janedev/drone',
        reportUrl: null,
        demoUrl: null,
        otherLinks: [],
        description: 'Comprehensive drone system guide.',
        challenges: 'Sensor calibration.',
        solutions: 'Kalman filtering.',
        whatWorkedWell: null,
        whatToDoDifferently: null,
        timeTaken: '2-3 months',
        gradeReceived: 'A+',
        gradeVisible: true,
        tipsForFuture: null,
      },
    });

    jest.spyOn(entryService, 'getEntryById').mockResolvedValue(mockEntry);
    jest.spyOn(entryService, 'incrementViewCount').mockResolvedValue();

    const { getByTestId, getAllByText } = await renderWithProviders(<EntryDetailScreen />);

    await waitFor(() => {
      expect(getByTestId('entry-detail-title')).toBeTruthy();
      expect(getAllByText('Autonomous Drone Navigation System').length).toBeGreaterThanOrEqual(1);
    });
  });

  test('displays warning banner when entry outdatedCount >= 3', async () => {
    const mockEntry = createMockEntry({
      id: 'test-entry-123',
      title: 'Legacy OpenGL Graphics Tutorial',
      type: EntryType.Resource,
      outdatedCount: 3,
    });

    jest.spyOn(entryService, 'getEntryById').mockResolvedValue(mockEntry);

    const { getByTestId } = await renderWithProviders(<EntryDetailScreen />);

    await waitFor(() => {
      expect(getByTestId('banner-outdated-warning')).toBeTruthy();
    });
  });

  test('displays rejection notice and edit & resubmit button for author of rejected entry', async () => {
    const mockEntry = createMockEntry({
      id: 'test-entry-123',
      title: 'Mobile App Architecture Guide',
      type: EntryType.Project,
      authorId: 'author-user-1',
      status: EntryStatus.Rejected,
      rejectionReason: 'Add more detailed challenges & solutions.',
    });

    jest.spyOn(entryService, 'getEntryById').mockResolvedValue(mockEntry);

    const { getByTestId, getByText } = await renderWithProviders(<EntryDetailScreen />);

    await waitFor(() => {
      expect(getByTestId('banner-rejected-entry')).toBeTruthy();
      expect(getByText('Reason: Add more detailed challenges & solutions.')).toBeTruthy();
      expect(getByTestId('button-edit-resubmit')).toBeTruthy();
    });
  });

  test('tapping Edit & Resubmit on project routes to ProjectSubmissionFlow', async () => {
    const mockEntry = createMockEntry({
      id: 'test-entry-123',
      title: 'Mobile App Architecture Guide',
      type: EntryType.Project,
      authorId: 'author-user-1',
      status: EntryStatus.Rejected,
    });

    jest.spyOn(entryService, 'getEntryById').mockResolvedValue(mockEntry);

    const { getByTestId } = await renderWithProviders(<EntryDetailScreen />);

    await waitFor(() => {
      expect(getByTestId('button-edit-resubmit')).toBeTruthy();
    });

    fireEvent.press(getByTestId('button-edit-resubmit'));

    await waitFor(() => {
      expect(mockLoadEntryForEdit).toHaveBeenCalledWith('test-entry-123');
      expect(mockNavigate).toHaveBeenCalledWith('SubmitTab', { screen: 'ProjectSubmissionFlow' });
    });
  });

  test('tapping Edit & Resubmit on viva routes to VivaSubmissionFlow', async () => {
    const mockEntry = createMockEntry({
      id: 'test-entry-123',
      title: 'Computer Networks Viva Prep',
      type: EntryType.Viva,
      authorId: 'author-user-1',
      status: EntryStatus.Rejected,
    });

    jest.spyOn(entryService, 'getEntryById').mockResolvedValue(mockEntry);

    const { getByTestId } = await renderWithProviders(<EntryDetailScreen />);

    await waitFor(() => {
      expect(getByTestId('button-edit-resubmit')).toBeTruthy();
    });

    fireEvent.press(getByTestId('button-edit-resubmit'));

    await waitFor(() => {
      expect(mockLoadEntryForEdit).toHaveBeenCalledWith('test-entry-123');
      expect(mockNavigate).toHaveBeenCalledWith('SubmitTab', { screen: 'VivaSubmissionFlow' });
    });
  });

  test('tapping 3-dot menu opens menu modal and allows marking as outdated', async () => {
    const mockEntry = createMockEntry({
      id: 'test-entry-123',
      title: 'Computer Networks Viva Prep',
      type: EntryType.Viva,
    });

    jest.spyOn(entryService, 'getEntryById').mockResolvedValue(mockEntry);
    const mockMarkOutdated = jest.spyOn(entryService, 'markOutdated').mockResolvedValue(undefined as any);

    const { getByTestId } = await renderWithProviders(<EntryDetailScreen />);

    await waitFor(() => {
      expect(getByTestId('button-detail-menu')).toBeTruthy();
    });

    fireEvent.press(getByTestId('button-detail-menu'));

    await waitFor(() => {
      expect(getByTestId('menu-item-mark-outdated')).toBeTruthy();
    });

    fireEvent.press(getByTestId('menu-item-mark-outdated'));

    await waitFor(() => {
      expect(getByTestId('button-submit-outdated')).toBeTruthy();
    });

    fireEvent.press(getByTestId('button-submit-outdated'));

    await waitFor(() => {
      expect(mockMarkOutdated).toHaveBeenCalled();
    });
  });
});

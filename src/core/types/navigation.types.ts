/**
 * Navigation Types
 * College Knowledge Vault
 *
 * Fully typed route params for all navigators.
 * No `any` types — screens with no params use `undefined`.
 */

import { UserRole } from './user.types';

export type RootStackParamList = {
  Onboarding: undefined;
  Landing: undefined;
  Login: { contextRole?: UserRole | 'super_admin' | 'college_admin' } | undefined;
  RoleSelection: {
    contextRole?: UserRole | 'college_admin' | 'super_admin';
    initialStep?: number;
    initialRole?: UserRole;
  } | undefined;
  PendingAccess: {
    requestType: 'faculty' | 'college_admin';
    collegeName?: string;
    designation?: string;
    department?: string;
  };
  MainTabs: undefined;
  EntryDetail: { entryId: string };
  AdminHome: undefined;
  ModerationDetail: { recordId: string };
  UserManagement: undefined;
  Bookmarks: undefined;
  SubjectBrowse: undefined;
  PrivacyPolicy: undefined;
  EditProfile: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  ReviewTab: undefined;
  SubmitTab: undefined;
  ProfileTab: undefined;
  CollegeAdminTab: undefined;
  AdminTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  EntryDetail: { entryId: string };
  SubjectBrowse: undefined;
  Bookmarks: undefined;
};

export type SearchStackParamList = {
  Search: undefined;
  EntryDetail: { entryId: string };
};

export type SubmitStackParamList = {
  SubmitStep1Type: undefined;
  SubmitStep2Details: undefined;
  SubmitStep3Tags: undefined;
  SubmitStep4Viva: undefined;
  SubmitStep5Review: undefined;
  ProjectSubmissionFlow: undefined;
  VivaSubmissionFlow: undefined;
  MistakeSubmissionFlow: undefined;
  ResourceSubmissionFlow: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Dashboard: undefined;
  EntryDetail: { entryId: string };
  ModerationQueue: undefined;
  AdminHome: undefined;
  ModerationDetail: { recordId: string };
  UserManagement: undefined;
  Bookmarks: undefined;
};

export type AdminStackParamList = {
  AdminHome: undefined;
  ModerationDetail: { recordId: string };
  UserManagement: undefined;
};


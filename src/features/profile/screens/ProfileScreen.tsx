/**
 * Profile Screen
 * College Knowledge Vault
 *
 * Single entry point for user profile, tailored dynamically to all 6 roles:
 * - ProfileHeader: universal identity & role badge
 * - StudentProfileSections: academic standing, progress bar, quick exploration
 * - SeniorProfileSections: contributor stats, submit entry CTA, revocation alerts
 * - PendingFacultyProfileSections: review timeline, check status, cancel request
 * - FacultyProfileSections: moderation stats, queue shortcut, guide submission
 * - CollegeAdminProfileSections: college metrics, shortcuts to governance tabs
 * - SuperAdminProfileSections: platform-wide overview, root administration shortcuts
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  RefreshControl,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAuthStore } from '../../../core/store/authStore';
import { EffectiveRole, UserRole } from '../../../core/types/user.types';
import { computeEffectiveRole, computeAcademicStanding } from '../../../core/utils/roleChecker';
import { deleteUserAccount } from '../../../core/services/accountDeletionService';
import ProfileHeader from '../components/ProfileHeader';
import StudentProfileSections from '../components/StudentProfileSections';
import SeniorProfileSections from '../components/SeniorProfileSections';
import PendingFacultyProfileSections from '../components/PendingFacultyProfileSections';
import FacultyProfileSections from '../components/FacultyProfileSections';
import CollegeAdminProfileSections from '../components/CollegeAdminProfileSections';
import SuperAdminProfileSections from '../components/SuperAdminProfileSections';

import {
  getFacultyModerationStats,
  getCollegeStats,
  getPlatformStats,
  cancelFacultyRequest,
  getUserUpvoteCount,
  FacultyModerationStats,
  CollegeStats,
  PlatformStats,
} from '../../../core/services/profileService';
import { getUserEntries } from '../../../core/services/entryService';
import { Entry, EntryType } from '../../../core/types/entry.types';
import { useSubmitFormContext } from '../../submitEntry/context/SubmitFormContext';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const form = useSubmitFormContext();
  const { user, setUser, signOut } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [myEntries, setMyEntries] = useState<Entry[]>([]);

  // Deletion State
  const [showDeleteStep1, setShowDeleteStep1] = useState(false);
  const [showDeleteStep2, setShowDeleteStep2] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Role Specific Stats
  const [facultyStats, setFacultyStats] = useState<FacultyModerationStats | undefined>();
  const [collegeStats, setCollegeStats] = useState<CollegeStats | undefined>();
  const [platformStats, setPlatformStats] = useState<PlatformStats | undefined>();

  const effectiveRole = user ? computeEffectiveRole(user) : EffectiveRole.Student;
  const isFinalYearStudent =
    user?.role === UserRole.Student &&
    !user.isCollegeAdmin &&
    !user.isSuperAdmin &&
    user.joiningYear !== null &&
    user.programDuration !== null &&
    computeAcademicStanding(user).accessLevel === 'senior';

  const isSeniorSection =
    effectiveRole === EffectiveRole.Senior ||
    isFinalYearStudent ||
    user?.role === UserRole.Senior ||
    (user?.role as string) === 'senior';
  const isStudentSection =
    (effectiveRole === EffectiveRole.Student || user?.role === UserRole.Student) &&
    !isSeniorSection;
  const displayRole = isSeniorSection ? EffectiveRole.Senior : effectiveRole;

  const loadRoleSpecificData = useCallback(async () => {
    if (!user) return;

    try {
      // 1. Refresh user's upvotes count and submitted entries
      const [upvotes, entries] = await Promise.all([
        getUserUpvoteCount(user.id),
        getUserEntries(user.id),
      ]);
      setMyEntries(entries);
      if (upvotes !== user.totalUpvotesReceived || entries.length !== user.entryCount) {
        setUser({
          ...user,
          totalUpvotesReceived: upvotes,
          entryCount: entries.length,
        });
      }

      // 2. Role-specific fetches
      if (effectiveRole === EffectiveRole.Faculty && user.collegeId) {
        const fStats = await getFacultyModerationStats(user.id, user.collegeId);
        setFacultyStats(fStats);
      } else if (effectiveRole === EffectiveRole.CollegeAdmin && user.collegeId) {
        const cStats = await getCollegeStats(user.collegeId);
        setCollegeStats(cStats);
      } else if (effectiveRole === EffectiveRole.SuperAdmin) {
        const pStats = await getPlatformStats();
        setPlatformStats(pStats);
      }
    } catch {
      // Fallback gracefully
    }
  }, [user, effectiveRole, setUser]);

  useEffect(() => {
    loadRoleSpecificData();
  }, [loadRoleSpecificData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRoleSpecificData();
    setIsRefreshing(false);
  };

  // ── ACTION HANDLERS ──

  const handleSignOut = async () => {
    await signOut();
  };

  const handleViewSavedEntries = () => {
    try {
      navigation.navigate('Bookmarks' as any);
    } catch {
      // Fallback
    }
  };

  const handleEditResubmit = async (entry: Entry) => {
    await form.loadEntryForEdit(entry.id);
    if (entry.type === EntryType.Project) {
      navigation.navigate('SubmitTab', { screen: 'ProjectSubmissionFlow' });
    } else if (entry.type === EntryType.Viva) {
      navigation.navigate('SubmitTab', { screen: 'VivaSubmissionFlow' });
    } else if (entry.type === EntryType.Mistake) {
      navigation.navigate('SubmitTab', { screen: 'MistakeSubmissionFlow' });
    } else if (entry.type === EntryType.Resource) {
      navigation.navigate('SubmitTab', { screen: 'ResourceSubmissionFlow' });
    } else {
      navigation.navigate('SubmitTab', { screen: 'SubmitStep1Type' });
    }
  };

  const handleCancelFacultyRequest = async () => {
    if (!user) return;
    await cancelFacultyRequest(user.id);
    setUser({
      ...user,
      role: UserRole.Student,
      isVerified: false,
      pendingRoleRequest: null,
    });
  };

  const handleCheckStatus = async () => {
    await loadRoleSpecificData();
  };

  const handleBrowseVault = () => {
    try {
      navigation.navigate('HomeTab');
    } catch {
      // Navigation fallback
    }
  };

  const handleSubmitEntry = () => {
    try {
      navigation.navigate('SubmitTab', { screen: 'SubmitStep1Type' });
    } catch {
      // Navigation fallback
    }
  };

  const handleOpenModerationQueue = () => {
    try {
      (navigation as any).navigate('ReviewTab');
    } catch {
      try {
        (navigation as any).navigate('ModerationQueue');
      } catch {
        // Navigation fallback
      }
    }
  };

  const handleOpenCollegeAdminPanel = () => {
    try {
      navigation.navigate('CollegeAdminTab');
    } catch {
      // Navigation fallback
    }
  };

  const handleOpenSuperAdminPanel = () => {
    try {
      navigation.navigate('AdminTab');
    } catch {
      // Navigation fallback
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Please sign in to view your profile.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#3D52A0"
          />
        }
        testID="profile-screen-scroll"
      >
        {/* Universal Profile Header */}
        <ProfileHeader
          user={user}
          effectiveRole={displayRole}
          onSignOut={handleSignOut}
          onEditProfile={() => navigation.navigate('EditProfile')}
        />

        {/* Dynamic Role-Specific Section */}
        {isStudentSection && (
          <StudentProfileSections
            user={user}
            onNavigateCategory={() => navigation.navigate('HomeTab')}
            onViewSavedEntries={handleViewSavedEntries}
          />
        )}

        {isSeniorSection && (
          <SeniorProfileSections
            user={user}
            onSubmitEntry={handleSubmitEntry}
            onViewMyEntries={() => navigation.navigate('Dashboard')}
            onViewSavedEntries={handleViewSavedEntries}
            myEntries={myEntries}
            onEditEntry={handleEditResubmit}
          />
        )}

        {effectiveRole === EffectiveRole.PendingFaculty && (
          <PendingFacultyProfileSections
            user={user}
            onCheckStatus={handleCheckStatus}
            onCancelRequest={handleCancelFacultyRequest}
            onBrowseVault={handleBrowseVault}
          />
        )}

        {effectiveRole === EffectiveRole.Faculty && (
          <FacultyProfileSections
            user={user}
            moderationStats={facultyStats}
            onOpenModerationQueue={handleOpenModerationQueue}
            onSubmitGuide={handleSubmitEntry}
          />
        )}

        {effectiveRole === EffectiveRole.CollegeAdmin && (
          <CollegeAdminProfileSections
            user={user}
            stats={collegeStats}
            onOpenAdminPanel={handleOpenCollegeAdminPanel}
            onReviewFaculty={handleOpenCollegeAdminPanel}
            onManageUsers={handleOpenCollegeAdminPanel}
          />
        )}

        {effectiveRole === EffectiveRole.SuperAdmin && (
          <SuperAdminProfileSections
            user={user}
            stats={platformStats}
            onOpenSuperAdminPanel={handleOpenSuperAdminPanel}
            onReviewAdminRequests={handleOpenSuperAdminPanel}
            onManageColleges={handleOpenSuperAdminPanel}
          />
        )}

        {/* Settings & Compliance Section (available to all roles) */}
        <View style={styles.settingsSection} testID="profile-settings-section">
          <Text style={styles.settingsSectionTitle}>Settings & Policies</Text>

          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => navigation.navigate('PrivacyPolicy')}
            testID="btn-privacy-policy"
          >
            <Text style={styles.settingsItemText}>🛡️ Privacy Policy</Text>
            <Text style={styles.settingsItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsItem}
            onPress={handleSignOut}
            testID="btn-settings-sign-out"
          >
            <Text style={styles.settingsItemText}>⎋ Sign Out</Text>
            <Text style={styles.settingsItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsItem, styles.deleteAccountItem]}
            onPress={() => setShowDeleteStep1(true)}
            testID="btn-delete-account"
          >
            <Text style={styles.deleteAccountText}>🗑️ Delete Account</Text>
            <Text style={[styles.settingsItemArrow, styles.deleteAccountArrow]}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Step 1: Confirmation Dialog */}
      {showDeleteStep1 && (
        <Modal
          visible={showDeleteStep1}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteStep1(false)}
          testID="modal-delete-step1"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Delete Account?</Text>
              <Text style={styles.modalMessage}>
                This will permanently delete your account and all personal data. Your submitted
                knowledge entries will remain in the vault anonymously to benefit future students.
                This action cannot be undone.
              </Text>
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowDeleteStep1(false)}
                  testID="btn-cancel-delete-step1"
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalDestructiveBtn}
                  onPress={() => {
                    setShowDeleteStep1(false);
                    setDeleteConfirmText('');
                    setShowDeleteStep2(true);
                  }}
                  testID="btn-continue-delete-step1"
                >
                  <Text style={styles.modalDestructiveBtnText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Step 2: Final Confirmation with "DELETE" typing */}
      {showDeleteStep2 && (
        <Modal
          visible={showDeleteStep2}
          transparent
          animationType="fade"
          onRequestClose={() => !isDeletingAccount && setShowDeleteStep2(false)}
          testID="modal-delete-step2"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Are you absolutely sure?</Text>
              <Text style={styles.modalMessage}>
                Type <Text style={styles.boldText}>DELETE</Text> to confirm permanent account deletion.
              </Text>
              <TextInput
                style={styles.deleteInput}
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder="Type DELETE"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                testID="input-confirm-delete"
              />
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowDeleteStep2(false)}
                  disabled={isDeletingAccount}
                  testID="btn-cancel-delete-step2"
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalDestructiveBtn,
                    deleteConfirmText.trim() !== 'DELETE' || isDeletingAccount
                      ? styles.btnDisabled
                      : null,
                  ]}
                  onPress={async () => {
                    if (deleteConfirmText.trim() !== 'DELETE' || !user) return;
                    try {
                      setIsDeletingAccount(true);
                      await deleteUserAccount(user.id);
                      setShowDeleteStep2(false);
                      try {
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Landing' }],
                        });
                      } catch {}
                    } catch (err: any) {
                      Alert.alert(
                        'Deletion Failed',
                        err?.message || 'Failed to delete account. Please try again.',
                      );
                    } finally {
                      setIsDeletingAccount(false);
                    }
                  }}
                  disabled={deleteConfirmText.trim() !== 'DELETE' || isDeletingAccount}
                  testID="btn-confirm-delete-account"
                >
                  {isDeletingAccount ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalDestructiveBtnText}>Delete My Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
  },
  settingsSection: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  settingsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingsItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
  },
  settingsItemArrow: {
    fontSize: 18,
    color: '#94A3B8',
  },
  deleteAccountItem: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  deleteAccountText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  deleteAccountArrow: {
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 18,
  },
  boldText: {
    fontWeight: '700',
    color: '#EF4444',
  },
  deleteInput: {
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FEF2F2',
    marginBottom: 20,
    fontWeight: '600',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalDestructiveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDestructiveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnDisabled: {
    backgroundColor: '#FCA5A5',
    opacity: 0.7,
  },
});

export default ProfileScreen;

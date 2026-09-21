/**
 * Faculty Moderation Screen
 * College Knowledge Vault
 *
 * Moderation queue for Verified Faculty and College Admins:
 * - Scoped strictly to the user's college.
 * - Tab 1: Pending Review (with pending count badge)
 * - Tab 2: Approved
 * - Tab 3: Rejected
 * - One-tap Approve / Reject with reason.
 * - Deep display of Project details (GitHub, Team, PDF Report, Viva questions).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Linking,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/material-icons';
import { useAuthStore } from '../../../core/store/authStore';
import { Entry, EntryType } from '../../../core/types/entry.types';
import {
  getCollegeModerationEntries,
  approveEntry,
  rejectEntry,
} from '../../../core/services/entryService';
import { queryClient } from '../../../app/QueryClient';

type ModerationStatusTab = 'pending' | 'approved' | 'rejected';

export const FacultyModerationScreen: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const collegeId = user?.collegeId || null;
  const collegeName = user?.collegeName || user?.college || 'College';

  const [activeTab, setActiveTab] = useState<ModerationStatusTab>('pending');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Rejection modal
  const [rejectModalVisible, setRejectModalVisible] = useState<boolean>(false);
  const [entryToReject, setEntryToReject] = useState<Entry | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Counters
  const [pendingCount, setPendingCount] = useState<number>(0);

  const fetchEntries = useCallback(async () => {
    try {
      const data = await getCollegeModerationEntries(collegeId, activeTab);
      setEntries(data);

      if (activeTab === 'pending') {
        setPendingCount(data.length);
      } else {
        // also get pending count in background for badge
        getCollegeModerationEntries(collegeId, 'pending').then((p) =>
          setPendingCount(p.length),
        );
      }
    } catch (err) {
      console.error('Failed to load moderation entries:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [collegeId, activeTab]);

  useEffect(() => {
    setIsLoading(true);
    fetchEntries();
  }, [fetchEntries]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchEntries();
  };

  const handleApprove = (entry: Entry) => {
    if (!user?.id) return;
    Alert.alert(
      'Approve Submission',
      `Are you sure you want to approve "${entry.title}"? It will become visible to all students in ${collegeName}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              setIsProcessing(true);
              await approveEntry(entry.id, user.id);
              queryClient.invalidateQueries({ queryKey: ['entries'] });
              Alert.alert('Approved', `"${entry.title}" is now published.`);
              await fetchEntries();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to approve entry.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
    );
  };

  const handleOpenRejectModal = (entry: Entry) => {
    setEntryToReject(entry);
    setRejectionReason('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!entryToReject || !user?.id) return;
    try {
      setIsProcessing(true);
      await rejectEntry(
        entryToReject.id,
        user.id,
        rejectionReason.trim() || 'Does not meet academic guidelines.',
      );
      setRejectModalVisible(false);
      setEntryToReject(null);
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      Alert.alert('Rejected', 'The submission has been marked as rejected.');
      await fetchEntries();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to reject entry.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredEntries = entries.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(q);
    const authorMatch = item.authorName?.toLowerCase().includes(q);
    const subjectMatch = item.subject?.toLowerCase().includes(q);
    return titleMatch || authorMatch || subjectMatch;
  });

  const renderTypeBadge = (type: EntryType) => {
    switch (type) {
      case EntryType.Project:
        return { label: 'PROJECT GUIDE', icon: 'folder', color: '#3D52A0', bg: '#EEF0FB' };
      case EntryType.Viva:
        return { label: 'VIVA Q&A', icon: 'chat', color: '#00B4D8', bg: '#E6F8FC' };
      case EntryType.Mistake:
        return { label: 'MISTAKE & FIX', icon: 'bug-report', color: '#EF4444', bg: '#FEE2E2' };
      case EntryType.Resource:
        return { label: 'RESOURCE', icon: 'link', color: '#10B981', bg: '#D1FAE5' };
      default:
        return { label: 'ENTRY', icon: 'article', color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  const renderCard = ({ item }: { item: Entry }) => {
    const badge = renderTypeBadge(item.type);
    const pDetails = item.projectDetails;

    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeaderRow}>
          <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
            <Icon name={badge.icon as any} size={14} color={badge.color} />
            <Text style={[styles.typeBadgeText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.entryTitle}>{item.title}</Text>

        {/* Author & Academic Info */}
        <View style={styles.authorRow}>
          <Icon name="person-outline" size={16} color="#64748B" />
          <Text style={styles.authorText}>
            {item.authorName || 'Student'}
            {item.authorDepartment ? ` · ${item.authorDepartment}` : ''}
          </Text>
          {item.subject ? (
            <Text style={styles.subjectText}> · {item.subject}</Text>
          ) : null}
          {item.semester ? (
            <Text style={styles.subjectText}> (Sem {item.semester})</Text>
          ) : null}
        </View>

        {/* Description */}
        <Text style={styles.descriptionText} numberOfLines={3}>
          {item.description}
        </Text>

        {/* Project Specific Details Section */}
        {item.type === EntryType.Project && pDetails ? (
          <View style={styles.projectDetailsBox}>
            <Text style={styles.boxHeading}>Project Highlights</Text>
            {pDetails.category || pDetails.complexity ? (
              <Text style={styles.detailRow}>
                🏷️ {pDetails.category || 'General'} · {pDetails.complexity?.toUpperCase()}
              </Text>
            ) : null}

            {pDetails.githubUrl ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(pDetails.githubUrl!)}
                style={styles.linkRow}
              >
                <Icon name="code" size={16} color="#3D52A0" />
                <Text style={styles.linkText} numberOfLines={1}>
                  {pDetails.githubUrl}
                </Text>
              </TouchableOpacity>
            ) : null}

            {pDetails.reportUrl ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(pDetails.reportUrl!)}
                style={styles.pdfButton}
              >
                <Icon name="picture-as-pdf" size={18} color="#DC2626" />
                <Text style={styles.pdfButtonText}>View Project Report (PDF)</Text>
              </TouchableOpacity>
            ) : null}

            {item.vivaQuestionsDetailed && item.vivaQuestionsDetailed.length > 0 ? (
              <Text style={styles.detailRow}>
                💡 {item.vivaQuestionsDetailed.length} Viva Questions Included
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Action Buttons for Pending */}
        {activeTab === 'pending' ? (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleApprove(item)}
              disabled={isProcessing}
            >
              <Icon name="check-circle" size={18} color="#FFFFFF" />
              <Text style={styles.approveBtnText}>Approve & Publish</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleOpenRejectModal(item)}
              disabled={isProcessing}
            >
              <Icon name="cancel" size={18} color="#DC2626" />
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statusFooter}>
            <Text
              style={[
                styles.statusFooterText,
                { color: activeTab === 'approved' ? '#059669' : '#DC2626' },
              ]}
            >
              {activeTab === 'approved' ? '✓ Approved & Public' : '✕ Rejected'}
              {item.rejectionReason ? ` · Note: ${item.rejectionReason}` : ''}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Screen Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Entry Approval Queue</Text>
          <Text style={styles.headerSubtitle}>
            {collegeName} · Review student submissions
          </Text>
        </View>

        {/* Tab Filters */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'pending' && styles.activeTabButton]}
            onPress={() => setActiveTab('pending')}
          >
            <Text
              style={[styles.tabButtonText, activeTab === 'pending' && styles.activeTabText]}
            >
              Pending Review
            </Text>
            {pendingCount > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'approved' && styles.activeTabButton]}
            onPress={() => setActiveTab('approved')}
          >
            <Text
              style={[styles.tabButtonText, activeTab === 'approved' && styles.activeTabText]}
            >
              Approved
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'rejected' && styles.activeTabButton]}
            onPress={() => setActiveTab('rejected')}
          >
            <Text
              style={[styles.tabButtonText, activeTab === 'rejected' && styles.activeTabText]}
            >
              Rejected
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Icon name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, subject, student..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* List Content */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3D52A0" />
            <Text style={styles.loadingText}>Loading submissions...</Text>
          </View>
        ) : filteredEntries.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyEmoji}>
              {activeTab === 'pending' ? '🎉' : '📂'}
            </Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'pending'
                ? 'No Pending Submissions'
                : `No ${activeTab} entries found`}
            </Text>
            <Text style={styles.emptyDesc}>
              {activeTab === 'pending'
                ? 'All senior and student submissions have been reviewed.'
                : 'Entries will appear here once reviewed.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredEntries}
            keyExtractor={(item) => item.id}
            renderItem={renderCard}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={['#3D52A0']}
              />
            }
          />
        )}

        {/* Rejection Modal */}
        <Modal
          visible={rejectModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRejectModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Reject Submission</Text>
              <Text style={styles.modalDesc}>
                Provide feedback to the student explaining what needs correction before resubmitting.
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Reason (e.g. Needs more detailed challenges, missing report details...)"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={rejectionReason}
                onChangeText={setRejectionReason}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setRejectModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={handleConfirmReject}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalConfirmText}>Confirm Rejection</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F1F5F9',
  },
  activeTabButton: {
    backgroundColor: '#3D52A0',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  badgeCount: {
    marginLeft: 6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    marginLeft: 4,
  },
  subjectText: {
    fontSize: 13,
    color: '#64748B',
  },
  descriptionText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    marginBottom: 10,
  },
  projectDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  boxHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailRow: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  linkText: {
    fontSize: 12,
    color: '#3D52A0',
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  pdfButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 6,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  approveBtn: {
    backgroundColor: '#059669',
    marginRight: 8,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  statusFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusFooterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 90,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  modalCancelText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  modalConfirmBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default FacultyModerationScreen;

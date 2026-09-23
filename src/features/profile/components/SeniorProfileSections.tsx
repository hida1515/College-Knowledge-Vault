/**
 * Senior Profile Sections
 * College Knowledge Vault
 *
 * Dedicated profile section for final-year seniors:
 * - Senior contributor status card
 * - Revocation warning banner (when isSeniorRevoked is true)
 * - Contribution metrics (entries submitted, total upvotes received, views)
 * - Quick action to submit knowledge entries
 * - Faculty request prompt card
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserProfile, User } from '../../../core/types/user.types';
import { Entry } from '../../../core/types/entry.types';

export interface SeniorProfileSectionsProps {
  user: UserProfile | User;
  onSubmitEntry?: () => void;
  onViewMyEntries?: () => void;
  onViewSavedEntries?: () => void;
  savedEntriesCount?: number;
  myEntries?: Entry[];
  onEditEntry?: (entry: Entry) => void;
}

const SeniorProfileSections: React.FC<SeniorProfileSectionsProps> = ({
  user,
  onSubmitEntry,
  onViewMyEntries,
  onViewSavedEntries,
  savedEntriesCount = 0,
  myEntries = [],
  onEditEntry,
}) => {
  const isRevoked = !!user.isSeniorRevoked;
  const totalDuration = user.programDuration ?? 4;

  return (
    <View style={styles.container} testID="senior-profile-sections">
      {/* ── SENIOR STATUS CARD ── */}
      <View style={styles.statusCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>🎓</Text>
          <View style={styles.cardCol}>
            <Text style={styles.cardTitle}>Final Year Senior</Text>
            <Text style={styles.cardSubtitle}>
              Year {totalDuration} of {totalDuration} · Contributor Access Active
            </Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Submissions Status:</Text>
          <View
            style={[
              styles.statusBadge,
              isRevoked ? styles.badgeRevoked : styles.badgeActive,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isRevoked ? styles.badgeRevokedText : styles.badgeActiveText,
              ]}
            >
              {isRevoked ? 'SUSPENDED' : 'ENABLED'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── REVOKED WARNING BANNER ── */}
      {isRevoked && (
        <View style={styles.revokedBanner} testID="senior-revoked-banner">
          <Text style={styles.revokedEmoji}>⚠️</Text>
          <View style={styles.revokedCol}>
            <Text style={styles.revokedTitle}>Submission Privileges Revoked</Text>
            <Text style={styles.revokedDesc}>
              Your entry submission access has been suspended by your college administrator. You can still browse all vault knowledge. Contact your department coordinator if you believe this is an error.
            </Text>
          </View>
        </View>
      )}

      {/* ── CONTRIBUTION METRICS ── */}
      <View style={styles.statsRow}>
        <View style={styles.statBox} testID="stat-senior-entries">
          <Text style={styles.statNumber}>{Math.max(myEntries.length, user.entryCount ?? 0)}</Text>
          <Text style={styles.statLabel}>Entries Submitted</Text>
        </View>
        <View style={styles.statBox} testID="stat-senior-upvotes">
          <Text style={styles.statNumber}>{user.totalUpvotesReceived ?? 0}</Text>
          <Text style={styles.statLabel}>Upvotes Received</Text>
        </View>
        <View style={styles.statBox} testID="stat-senior-views">
          <Text style={styles.statNumber}>
            {'totalViews' in user ? (user.totalViews ?? 0) : 0}
          </Text>
          <Text style={styles.statLabel}>Total Views</Text>
        </View>
      </View>

      {/* ── SUBMIT ENTRY CALLOUT BUTTON ── */}
      <TouchableOpacity
        style={[styles.submitButton, isRevoked && styles.submitButtonDisabled]}
        onPress={onSubmitEntry}
        disabled={isRevoked}
        activeOpacity={0.85}
        testID="button-submit-entry"
      >
        <Text style={styles.submitButtonEmoji}>✍️</Text>
        <Text style={styles.submitButtonText}>
          {isRevoked ? 'Submissions Suspended' : 'Submit Knowledge Entry'}
        </Text>
      </TouchableOpacity>

      {/* ── SUBMISSIONS STATUS TRACKER ── */}
      <View style={styles.submissionsCard} testID="senior-submissions-card">
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>📋</Text>
          <View style={styles.cardCol}>
            <Text style={styles.cardTitle}>My Submissions & Status</Text>
            <Text style={styles.cardSubtitle}>
              {myEntries.length === 0
                ? 'No project submissions yet'
                : `${myEntries.length} ${myEntries.length === 1 ? 'submission' : 'submissions'} tracked`}
            </Text>
          </View>
        </View>

        {myEntries.length === 0 ? (
          <View style={styles.emptySubmissionsBox}>
            <Text style={styles.emptySubmissionsText}>
              Share your project report or viva advice. Once submitted, its live approval status will appear right here.
            </Text>
          </View>
        ) : (
          <View style={styles.submissionsList}>
            {myEntries.slice(0, 5).map((item) => {
              const isApproved = item.status === 'approved';
              const isRejected = item.status === 'rejected';
              return (
                <View key={item.id} style={styles.submissionItemCard}>
                  <View style={styles.submissionItemTop}>
                    <View style={styles.submissionTypeBadge}>
                      <Text style={styles.submissionTypeText}>{(item.type || 'PROJECT').toUpperCase()}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        isApproved
                          ? styles.statusPillApproved
                          : isRejected
                          ? styles.statusPillRejected
                          : styles.statusPillPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          isApproved
                            ? styles.statusApprovedText
                            : isRejected
                            ? styles.statusRejectedText
                            : styles.statusPendingText,
                        ]}
                      >
                        {isApproved
                          ? '🟢 Approved & Live'
                          : isRejected
                          ? '🔴 Changes Requested'
                          : '🟡 Pending Faculty Review'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.submissionItemTitle} numberOfLines={2}>
                    {item.title}
                  </Text>

                  <View style={styles.submissionItemMeta}>
                    {item.subject ? <Text style={styles.submissionItemSubject}>{item.subject}</Text> : null}
                    {item.semester ? <Text style={styles.submissionItemSem}> · Sem {item.semester}</Text> : null}
                    <Text style={styles.submissionItemDate}> · {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</Text>
                  </View>

                  {!isApproved && !isRejected && (
                    <View style={styles.pendingStatusBox}>
                      <Text style={styles.pendingStatusText}>
                        ⏳ Submitted to faculty moderation queue. Once approved, it will be published to your college.
                      </Text>
                    </View>
                  )}

                  {isRejected && (
                    <View style={styles.rejectionBox}>
                      <Text style={styles.rejectionLabel}>Faculty Feedback:</Text>
                      <Text style={styles.rejectionText}>
                        {item.rejectionReason || 'Does not meet academic guidelines. Please review and update.'}
                      </Text>
                      {onEditEntry && (
                        <TouchableOpacity
                          style={styles.resubmitBtn}
                          onPress={() => onEditEntry(item)}
                        >
                          <Text style={styles.resubmitBtnText}>✏️ Edit & Resubmit</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {onViewMyEntries && (
          <TouchableOpacity
            style={styles.myEntriesBtn}
            onPress={onViewMyEntries}
            testID="button-view-my-entries"
          >
            <Text style={styles.myEntriesBtnText}>View All In Dashboard →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── SAVED ENTRIES CARD ── */}
      <View style={styles.savedCard} testID="saved-entries-card">
        <View style={styles.savedCardHeader}>
          <Text style={styles.savedCardEmoji}>🔖</Text>
          <View style={styles.savedCardInfo}>
            <Text style={styles.savedCardTitle}>Saved Knowledge</Text>
            <Text style={styles.savedCardSubtitle}>{savedEntriesCount} entries saved for quick access</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.savedCardBtn}
          onPress={onViewSavedEntries}
          testID="button-view-saved-entries"
          activeOpacity={0.8}
        >
          <Text style={styles.savedCardBtnText}>View Bookmarks →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  cardCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeActive: {
    backgroundColor: '#DCFCE7',
  },
  badgeRevoked: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgeActiveText: {
    color: '#15803D',
  },
  badgeRevokedText: {
    color: '#B91C1C',
  },
  revokedBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  revokedEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  revokedCol: {
    flex: 1,
  },
  revokedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 4,
  },
  revokedDesc: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#059669',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  myEntriesBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  myEntriesBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  savedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  savedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  savedCardEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  savedCardInfo: {
    flex: 1,
  },
  savedCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  savedCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  savedCardBtn: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  savedCardBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4338CA',
  },
  submissionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  emptySubmissionsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptySubmissionsText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    textAlign: 'center',
  },
  submissionsList: {
    marginBottom: 8,
  },
  submissionItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  submissionItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  submissionTypeBadge: {
    backgroundColor: '#EEF0FB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  submissionTypeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3D52A0',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPillApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusPillRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusPendingText: {
    color: '#B45309',
  },
  statusApprovedText: {
    color: '#15803D',
  },
  statusRejectedText: {
    color: '#B91C1C',
  },
  submissionItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  submissionItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  submissionItemSubject: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3D52A0',
  },
  submissionItemSem: {
    fontSize: 12,
    color: '#64748B',
  },
  submissionItemDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  pendingStatusBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 4,
  },
  pendingStatusText: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
  rejectionBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 4,
  },
  rejectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  rejectionText: {
    fontSize: 12,
    color: '#B91C1C',
    marginBottom: 6,
  },
  resubmitBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#DC2626',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  resubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default SeniorProfileSections;

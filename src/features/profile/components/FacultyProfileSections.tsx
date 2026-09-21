/**
 * Faculty Profile Sections
 * College Knowledge Vault
 *
 * Dedicated profile section for verified faculty members:
 * - Institutional verification badge & department info
 * - Moderation metrics (approved, rejected, pending in college queue)
 * - Quick action buttons (moderation queue, faculty guide submission)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserProfile, User } from '../../../core/types/user.types';
import { FacultyModerationStats } from '../../../core/services/profileService';

export interface FacultyProfileSectionsProps {
  user: UserProfile | User;
  moderationStats?: FacultyModerationStats;
  onOpenModerationQueue?: () => void;
  onSubmitGuide?: () => void;
}

const FacultyProfileSections: React.FC<FacultyProfileSectionsProps> = ({
  user,
  moderationStats = { approved: 0, rejected: 0, pending: 0 },
  onOpenModerationQueue,
  onSubmitGuide,
}) => {
  const collegeName = user.collegeName || user.college || 'College';

  return (
    <View style={styles.container} testID="faculty-profile-sections">
      {/* ── VERIFIED FACULTY CARD ── */}
      <View style={styles.verifiedCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>👨‍🏫</Text>
          <View style={styles.cardCol}>
            <Text style={styles.cardTitle}>Verified Faculty Member</Text>
            <Text style={styles.cardSubtitle}>
              {user.department || 'Academic Faculty'} · {collegeName}
            </Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.badgeActive}>
            <Text style={styles.badgeActiveText}>✓ VERIFIED BY COLLEGE ADMIN</Text>
          </View>
        </View>
      </View>

      {/* ── MODERATION STATS ── */}
      <Text style={styles.sectionHeading}>Moderation Activity</Text>
      <View style={styles.statsRow}>
        <View style={styles.statBox} testID="stat-faculty-approved">
          <Text style={[styles.statNumber, { color: '#059669' }]}>
            {moderationStats.approved}
          </Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>

        <View style={styles.statBox} testID="stat-faculty-rejected">
          <Text style={[styles.statNumber, { color: '#DC2626' }]}>
            {moderationStats.rejected}
          </Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>

        <View style={styles.statBox} testID="stat-faculty-pending">
          <Text style={[styles.statNumber, { color: '#D97706' }]}>
            {moderationStats.pending}
          </Text>
          <Text style={styles.statLabel}>Pending Queue</Text>
        </View>
      </View>

      {/* ── QUICK ACTIONS ── */}
      <View style={styles.actionCol}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onOpenModerationQueue}
          testID="button-open-moderation-queue"
        >
          <Text style={styles.primaryBtnEmoji}>🛡️</Text>
          <Text style={styles.primaryBtnText}>Open Moderation Queue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onSubmitGuide}
          testID="button-submit-faculty-guide"
        >
          <Text style={styles.secondaryBtnEmoji}>📝</Text>
          <Text style={styles.secondaryBtnText}>Submit Faculty Guide / Resource</Text>
        </TouchableOpacity>
      </View>

      {/* ── INSTITUTIONAL CONTEXT CARD ── */}
      <View style={styles.contextCard}>
        <Text style={styles.contextHeading}>Institutional Privileges</Text>
        <Text style={styles.contextText}>
          • Review and verify student viva questions and project archives{'\n'}
          • Reject inaccurate submissions with constructive feedback{'\n'}
          • Publish verified syllabus guides and semester reference notes
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  verifiedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
  badgeRow: {
    flexDirection: 'row',
  },
  badgeActive: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeActiveText: {
    color: '#7C3AED',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    elevation: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  actionCol: {
    gap: 10,
    marginBottom: 20,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryBtnEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 12,
  },
  secondaryBtnEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  secondaryBtnText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  contextCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contextHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  contextText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 20,
  },
});

export default FacultyProfileSections;

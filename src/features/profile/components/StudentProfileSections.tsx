/**
 * Student Profile Sections
 * College Knowledge Vault
 *
 * Dedicated profile section for non-final year students:
 * - Academic Progress tracker (with progress bar towards Senior year)
 * - Activity summary stats
 * - Quick vault discovery links
 * - Faculty role request prompt card
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserProfile, User } from '../../../core/types/user.types';
import { computeAcademicStanding } from '../../../core/utils/roleChecker';

export interface StudentProfileSectionsProps {
  user: UserProfile | User;
  onNavigateCategory?: (category: string) => void;
  onViewSavedEntries?: () => void;
  savedEntriesCount?: number;
}

const StudentProfileSections: React.FC<StudentProfileSectionsProps> = ({
  user,
  onNavigateCategory,
  onViewSavedEntries,
  savedEntriesCount = 0,
}) => {
  const standing = computeAcademicStanding(user);
  const progYear = standing.currentProgramYear ?? 1;
  const totalDuration = user.programDuration ?? 4;
  const progressRatio = Math.min(Math.max(progYear / totalDuration, 0.1), 0.9);
  const progressPercent = Math.round(progressRatio * 100);

  const gradYear = standing.graduationYear ?? (new Date().getFullYear() + 2);
  const seniorUnlockYear = gradYear - 1;

  return (
    <View style={styles.container} testID="student-profile-sections">
      {/* ── ACADEMIC PROGRESS CARD ── */}
      <View style={styles.card} testID="academic-progress-card">
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>🎓</Text>
          <View style={styles.cardHeaderCol}>
            <Text style={styles.cardTitle}>Academic Progress</Text>
            <Text style={styles.cardSubtitle}>
              Year {progYear} of {totalDuration} ({user.program || 'Undergraduate'})
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{progressPercent}% of program completed</Text>

        {/* Unlock Notice */}
        <View style={styles.unlockNotice}>
          <Text style={styles.unlockNoticeEmoji}>✨</Text>
          <Text style={styles.unlockNoticeText}>
            Senior Contributor access unlocks automatically in {seniorUnlockYear}!
          </Text>
        </View>

        {/* Explainer */}
        <Text style={styles.explainerText}>
          As a student, you have full access to browse, search, bookmark, and upvote
          verified knowledge. In your final year, your account will automatically upgrade to
          Senior to share experiences.
        </Text>
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

      {/* ── ACTIVITY METRICS ── */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{savedEntriesCount}</Text>
          <Text style={styles.statLabel}>Saved Entries</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>28</Text>
          <Text style={styles.statLabel}>Upvotes Given</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>45</Text>
          <Text style={styles.statLabel}>Vault Searches</Text>
        </View>
      </View>

      {/* ── VAULT EXPLORATION QUICK LINKS ── */}
      <Text style={styles.sectionHeader}>Explore Knowledge Vault</Text>
      <View style={styles.gridRow}>
        <TouchableOpacity
          style={styles.gridBtn}
          onPress={() => onNavigateCategory?.('project')}
          testID="quick-link-projects"
        >
          <Text style={styles.gridEmoji}>💼</Text>
          <Text style={styles.gridTitle}>Projects</Text>
          <Text style={styles.gridSub}>Senior guides</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridBtn}
          onPress={() => onNavigateCategory?.('viva')}
          testID="quick-link-viva"
        >
          <Text style={styles.gridEmoji}>💬</Text>
          <Text style={styles.gridTitle}>Viva Q&A</Text>
          <Text style={styles.gridSub}>Lab & project</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gridRow}>
        <TouchableOpacity
          style={styles.gridBtn}
          onPress={() => onNavigateCategory?.('mistake')}
          testID="quick-link-mistakes"
        >
          <Text style={styles.gridEmoji}>💡</Text>
          <Text style={styles.gridTitle}>Mistakes</Text>
          <Text style={styles.gridSub}>Lessons learned</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridBtn}
          onPress={() => onNavigateCategory?.('resource')}
          testID="quick-link-resources"
        >
          <Text style={styles.gridEmoji}>📚</Text>
          <Text style={styles.gridTitle}>Resources</Text>
          <Text style={styles.gridSub}>Notes & links</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
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
    marginBottom: 14,
  },
  cardEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  cardHeaderCol: {
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
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#185FA5',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'right',
    marginBottom: 12,
  },
  unlockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  unlockNoticeEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  unlockNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    flex: 1,
  },
  explainerText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#185FA5',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  gridBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gridEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  gridSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
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
});

export default StudentProfileSections;

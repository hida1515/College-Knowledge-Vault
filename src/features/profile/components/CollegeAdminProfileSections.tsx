/**
 * College Admin Profile Sections
 * College Knowledge Vault
 *
 * Dedicated profile section for College Administrators:
 * - Institutional governance badge
 * - College-wide member metrics (Students, Seniors, Verified Faculty, Pending Requests)
 * - Quick action shortcuts to Admin Panel tabs
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserProfile, User } from '../../../core/types/user.types';
import { CollegeStats } from '../../../core/services/profileService';

export interface CollegeAdminProfileSectionsProps {
  user: UserProfile | User;
  stats?: CollegeStats;
  onOpenAdminPanel?: () => void;
  onReviewFaculty?: () => void;
  onManageUsers?: () => void;
}

const CollegeAdminProfileSections: React.FC<CollegeAdminProfileSectionsProps> = ({
  user,
  stats,
  onOpenAdminPanel,
  onReviewFaculty,
  onManageUsers,
}) => {
  const collegeName = user.collegeName || user.college || 'Institution';
  const pendingCount = stats?.pendingFaculty ?? 0;

  return (
    <View style={styles.container} testID="college-admin-profile-sections">
      {/* ── GOVERNANCE BADGE CARD ── */}
      <View style={styles.adminCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>🏛️</Text>
          <View style={styles.cardCol}>
            <Text style={styles.cardTitle}>College Administrator</Text>
            <Text style={styles.cardSubtitle}>Full Portal Governance · {collegeName}</Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.badgeAdmin}>
            <Text style={styles.badgeAdminText}>INSTITUTIONAL ADMIN</Text>
          </View>
        </View>
      </View>

      {/* ── INSTITUTIONAL STATS (2x2 GRID) ── */}
      <Text style={styles.sectionHeading}>{collegeName} Overview</Text>
      <View style={styles.grid2x2}>
        <View style={styles.statBox} testID="stat-admin-students">
          <Text style={styles.statNumber}>{stats?.totalStudents ?? 0}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>

        <View style={styles.statBox} testID="stat-admin-seniors">
          <Text style={styles.statNumber}>{stats?.totalSeniors ?? 0}</Text>
          <Text style={styles.statLabel}>Active Seniors</Text>
        </View>

        <View style={styles.statBox} testID="stat-admin-faculty">
          <Text style={[styles.statNumber, { color: '#059669' }]}>
            {stats?.verifiedFaculty ?? 0}
          </Text>
          <Text style={styles.statLabel}>Verified Faculty</Text>
        </View>

        <View style={styles.statBox} testID="stat-admin-pending">
          <Text style={[styles.statNumber, { color: '#D97706' }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending Requests</Text>
        </View>
      </View>

      {/* ── ADMIN SHORTCUT ACTIONS ── */}
      <View style={styles.actionCol}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onOpenAdminPanel}
          testID="button-open-college-admin-panel"
        >
          <Text style={styles.primaryBtnEmoji}>⚙️</Text>
          <Text style={styles.primaryBtnText}>Open College Admin Panel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onReviewFaculty}
          testID="button-review-faculty-requests"
        >
          <Text style={styles.secondaryBtnEmoji}>👨‍🏫</Text>
          <Text style={styles.secondaryBtnText}>
            Review Pending Faculty ({pendingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onManageUsers}
          testID="button-manage-college-users"
        >
          <Text style={styles.secondaryBtnEmoji}>👥</Text>
          <Text style={styles.secondaryBtnText}>Manage College Users & Seniors</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  adminCard: {
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
  badgeAdmin: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeAdminText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    width: '48%',
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
    color: '#4F46E5',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  actionCol: {
    gap: 10,
    marginBottom: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
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
});

export default CollegeAdminProfileSections;

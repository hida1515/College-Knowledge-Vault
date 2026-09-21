/**
 * Super Admin Profile Sections
 * College Knowledge Vault
 *
 * Dedicated profile section for Platform Super Administrators:
 * - Super Admin governance badge
 * - Global platform metrics (Colleges, Users, Knowledge Entries, Admin Requests)
 * - Navigation shortcuts to Super Admin governance tabs
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserProfile, User } from '../../../core/types/user.types';
import { PlatformStats } from '../../../core/services/profileService';

export interface SuperAdminProfileSectionsProps {
  user: UserProfile | User;
  stats?: PlatformStats;
  onOpenSuperAdminPanel?: () => void;
  onReviewAdminRequests?: () => void;
  onManageColleges?: () => void;
}

const SuperAdminProfileSections: React.FC<SuperAdminProfileSectionsProps> = ({
  user: _user,
  stats,
  onOpenSuperAdminPanel,
  onReviewAdminRequests,
  onManageColleges,
}) => {
  const pendingRequestsCount = stats?.pendingAdminRequests ?? 0;

  return (
    <View style={styles.container} testID="super-admin-profile-sections">
      {/* ── GOVERNANCE BADGE CARD ── */}
      <View style={styles.adminCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>⚡</Text>
          <View style={styles.cardCol}>
            <Text style={styles.cardTitle}>Platform Super Admin</Text>
            <Text style={styles.cardSubtitle}>
              Multi-Tenant Global Governance & Infrastructure
            </Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.badgeSuperAdmin}>
            <Text style={styles.badgeSuperAdminText}>ROOT PRIVILEGES ACTIVE</Text>
          </View>
        </View>
      </View>

      {/* ── GLOBAL PLATFORM METRICS (2x2 GRID) ── */}
      <Text style={styles.sectionHeading}>Global Platform Overview</Text>
      <View style={styles.grid2x2}>
        <View style={styles.statBox} testID="stat-super-colleges">
          <Text style={styles.statNumber}>{stats?.totalColleges ?? 0}</Text>
          <Text style={styles.statLabel}>Active Colleges</Text>
        </View>

        <View style={styles.statBox} testID="stat-super-users">
          <Text style={styles.statNumber}>{stats?.totalUsers ?? 0}</Text>
          <Text style={styles.statLabel}>Total Members</Text>
        </View>

        <View style={styles.statBox} testID="stat-super-entries">
          <Text style={[styles.statNumber, { color: '#059669' }]}>
            {stats?.totalEntries ?? 0}
          </Text>
          <Text style={styles.statLabel}>Approved Knowledge</Text>
        </View>

        <View style={styles.statBox} testID="stat-super-requests">
          <Text style={[styles.statNumber, { color: '#D97706' }]}>
            {pendingRequestsCount}
          </Text>
          <Text style={styles.statLabel}>Admin Requests</Text>
        </View>
      </View>

      {/* ── SUPER ADMIN SHORTCUT ACTIONS ── */}
      <View style={styles.actionCol}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onOpenSuperAdminPanel}
          testID="button-open-super-admin-panel"
        >
          <Text style={styles.primaryBtnEmoji}>⚡</Text>
          <Text style={styles.primaryBtnText}>Open Super Admin Panel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onReviewAdminRequests}
          testID="button-review-admin-requests"
        >
          <Text style={styles.secondaryBtnEmoji}>📋</Text>
          <Text style={styles.secondaryBtnText}>
            Review Admin Requests ({pendingRequestsCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onManageColleges}
          testID="button-manage-colleges"
        >
          <Text style={styles.secondaryBtnEmoji}>🏛️</Text>
          <Text style={styles.secondaryBtnText}>Manage Multi-Tenant Colleges</Text>
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
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
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
    fontWeight: '800',
    color: '#F8FAFC',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badgeSuperAdmin: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeSuperAdminText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    color: '#0F172A',
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
    backgroundColor: '#0F172A',
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

export default SuperAdminProfileSections;

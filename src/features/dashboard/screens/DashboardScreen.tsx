/**
 * Dashboard Screen
 * College Knowledge Vault
 *
 * User dashboard displaying contribution stats (Total, Approved, Pending, Rejected),
 * user's submitted entries list with status badges, role-based FAB button, and empty states.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/material-icons';

import { useUserEntries, useUserStats } from '../../../core/hooks/useEntries';
import { useAuthStore } from '../../../core/store/authStore';
import { UserRole, EffectiveRole } from '../../../core/types/user.types';
import { computeEffectiveRole } from '../../../core/utils/roleChecker';
import { EntryType, Entry } from '../../../core/types/entry.types';
import { EntryCard } from '../../home/components/EntryCard';
import { useSubmitFormContext } from '../../submitEntry/context/SubmitFormContext';
import type { NavigationProp } from '@react-navigation/native';

type DashboardNavProp = NavigationProp<Record<string, object | undefined>>;

interface StatCardProps {
  label: string;
  count: number;
  color: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, count, color, bgColor }) => (
  <View style={[styles.statCard, { backgroundColor: bgColor }]}>
    <Text style={[styles.statNumber, { color }]}>{count}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavProp>();
  const { user } = useAuthStore();
  const form = useSubmitFormContext();
  const userId = user?.id ?? '';
  const effectiveRole = user ? computeEffectiveRole(user) : EffectiveRole.Student;
  const isSenior =
    effectiveRole === EffectiveRole.Senior ||
    effectiveRole === EffectiveRole.Faculty ||
    user?.role === UserRole.Senior ||
    user?.role === UserRole.Faculty;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: entries,
    isLoading: isEntriesLoading,
    refetch: refetchEntries,
  } = useUserEntries(userId);

  const {
    data: stats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useUserStats(userId);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchEntries(), refetchStats()]);
    setIsRefreshing(false);
  };

  const handleFABPress = () => {
    navigation.navigate('SubmitTab', { screen: 'SubmitStep1Type' });
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

  const userEntries = entries ?? [];
  const userStats = stats ?? { total: 0, approved: 0, pending: 0, rejected: 0 };
  const isLoading = isEntriesLoading || isStatsLoading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {typeof navigation.canGoBack === 'function' && navigation.canGoBack() && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              testID="dashboard-back-button"
            >
              <Icon name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Contributions</Text>
            <Text style={styles.headerSubtitle}>
              {user?.displayName ?? 'My Profile'} · {user?.department ?? 'Student'}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#3D52A0']}
            />
          }
        >
          {/* 4 Stat Cards Grid (2x2) */}
          <View style={styles.statsGrid}>
            <StatCard
              label="Total"
              count={userStats.total}
              color="#3D52A0"
              bgColor="#EEF0FB"
            />
            <StatCard
              label="Approved"
              count={userStats.approved}
              color="#15803D"
              bgColor="#E8F5E9"
            />
            <StatCard
              label="Pending"
              count={userStats.pending}
              color="#D97706"
              bgColor="#FFF8E1"
            />
            <StatCard
              label="Rejected"
              count={userStats.rejected}
              color="#B91C1C"
              bgColor="#FFEBEE"
            />
          </View>

          {/* Entries Section Header */}
          <Text style={styles.sectionHeader}>My Entries</Text>

          {/* List or Empty State */}
          {isLoading && userEntries.length === 0 ? (
            <ActivityIndicator style={styles.loader} color="#3D52A0" />
          ) : userEntries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyTitle}>No entries yet</Text>
              {isSenior ? (
                <>
                  <Text style={styles.emptyDesc}>
                    Share your academic experiences and viva insights to help juniors!
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={handleFABPress}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.emptyButtonText}>
                      Submit Your First Entry
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.emptyDesc}>
                  Browse knowledge from graduating seniors on the Home tab.
                </Text>
              )}
            </View>
          ) : (
            userEntries.map((entry) => (
              <View key={entry.id} style={styles.entryItemContainer}>
                <EntryCard
                  entry={entry}
                  showStatusBadge
                  onPress={() => {
                    try {
                      navigation.navigate('EntryDetail', { entryId: entry.id });
                    } catch {
                      (navigation.getParent() || navigation).navigate('HomeTab', {
                        screen: 'EntryDetail',
                        params: { entryId: entry.id },
                      });
                    }
                  }}
                />
                {entry.status === 'rejected' && (
                  <View style={styles.rejectionCard} testID={`rejection-card-${entry.id}`}>
                    <View style={styles.rejectionHeaderRow}>
                      <Icon name="error-outline" size={16} color="#B91C1C" />
                      <Text style={styles.rejectionHeading}>Action Required: Submission Rejected</Text>
                    </View>
                    <Text style={styles.rejectionReasonText}>
                      {entry.rejectionReason || 'Reviewer requested changes. Please update details and resubmit.'}
                    </Text>
                    <TouchableOpacity
                      style={styles.resubmitButton}
                      onPress={() => handleEditResubmit(entry)}
                      activeOpacity={0.8}
                      testID={`edit-resubmit-btn-${entry.id}`}
                    >
                      <Icon name="edit" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.resubmitButtonText}>Edit & Resubmit</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>

        {/* Floating Action Button (FAB "+") for Seniors */}
        {isSenior && (
          <TouchableOpacity
            style={styles.fab}
            onPress={handleFABPress}
            activeOpacity={0.85}
            testID="dashboard-fab-button"
          >
            <Icon name="add" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        )}
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
    backgroundColor: '#F5F7FB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  loader: {
    marginVertical: 30,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#3D52A0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3D52A0',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#3D52A0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  entryItemContainer: {
    marginBottom: 8,
  },
  rejectionCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: -8,
    marginBottom: 12,
    padding: 12,
  },
  rejectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rejectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
    marginLeft: 6,
  },
  rejectionReasonText: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
    marginBottom: 10,
  },
  resubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  resubmitButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default DashboardScreen;

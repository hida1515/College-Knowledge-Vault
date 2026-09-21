/**
 * Super Admin Panel Screen — Platform Governance & Multi-Tenant Management
 * College Knowledge Vault
 *
 * Tab 1: College Admin Requests (Approve/Reject requests across all colleges with auto-college creation)
 * Tab 2: Colleges Management (List with Active/Inactive toggle, Add College Modal)
 * Tab 3: Platform Statistics (Global counts, College Leaderboard, Recent Approved Entries)
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  StatusBar,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '../../../core/store/authStore';
import { College, CollegeAdminRequest } from '../../../core/types/user.types';
import {
  getCollegeAdminRequests,
  approveCollegeAdminRequest,
  rejectCollegeAdminRequest,
  getAllCollegesForAdmin,
  createCollege,
  toggleCollegeActiveStatus,
} from '../../../core/services/collegeService';
import {
  getPlatformStats,
  PlatformStats,
} from '../../../core/services/profileService';
import { supabase } from '../../../core/services/supabase';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  generateNewCodes,
  GeneratedCodes,
} from '../../../core/services/inviteCodeService';

type SuperAdminTab = 'college_admin_requests' | 'colleges' | 'stats';

interface LeaderboardCollege {
  id: string;
  name: string;
  userCount: number;
  entryCount: number;
}

interface PlatformActivityItem {
  id: string;
  title: string;
  collegeName: string;
  authorName: string;
  createdAt: string;
}

const SuperAdminScreen: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('college_admin_requests');

  // Tab 1: Requests State
  const [requests, setRequests] = useState<CollegeAdminRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Tab 2: Colleges State
  const [colleges, setColleges] = useState<College[]>([]);
  const [collegeSearch, setCollegeSearch] = useState('');
  const [isLoadingColleges, setIsLoadingColleges] = useState(false);

  // Add College Modal State
  const [showAddCollege, setShowAddCollege] = useState(false);
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [createdCollegeCodes, setCreatedCollegeCodes] = useState<GeneratedCodes | null>(null);
  const [createdCollegeName, setCreatedCollegeName] = useState('');

  // Tab 3: Platform Stats State
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardCollege[]>([]);
  const [recentEntries, setRecentEntries] = useState<PlatformActivityItem[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Action Loading State
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ── LOADERS ──

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoadingRequests(true);
      const data = await getCollegeAdminRequests();
      setRequests(data);
    } catch {
      // Fallback
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  const fetchColleges = useCallback(async () => {
    try {
      setIsLoadingColleges(true);
      const data = await getAllCollegesForAdmin();
      setColleges(data);
    } catch {
      // Fallback
    } finally {
      setIsLoadingColleges(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const [statsData, entriesRes, usersRes] = await Promise.all([
        getPlatformStats(),
        supabase
          .from('entries')
          .select('id, title, created_at, college_id, users:author_id(display_name)')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('users').select('college_id'),
      ]);

      setPlatformStats(statsData);

      // Construct activity
      const activity: PlatformActivityItem[] = (entriesRes.data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        collegeName: row.college_id ? 'Campus Vault' : 'Community',
        authorName: row.users?.display_name || 'Author',
        createdAt: row.created_at,
      }));
      setRecentEntries(activity);

      // Compute college user distribution for leaderboard
      const userCollegeCounts: Record<string, number> = {};
      for (const u of usersRes.data || []) {
        if (u.college_id) {
          userCollegeCounts[u.college_id] = (userCollegeCounts[u.college_id] || 0) + 1;
        }
      }

      const allCols = await getAllCollegesForAdmin();
      const lb: LeaderboardCollege[] = allCols.map((c) => ({
        id: c.id,
        name: c.name,
        userCount: userCollegeCounts[c.id] || 0,
        entryCount: 0,
      }));
      lb.sort((a, b) => b.userCount - a.userCount);
      setLeaderboard(lb.slice(0, 5));
    } catch {
      // Fallback
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchColleges();
    fetchStats();
  }, [fetchRequests, fetchColleges, fetchStats]);

  // ── REQUEST ACTIONS ──

  const handleApprove = async (req: CollegeAdminRequest) => {
    if (!currentUser) return;
    const isNew = !req.collegeId;

    Alert.alert(
      'Approve College Admin',
      isNew
        ? `This will create college "${req.collegeName}" and grant College Admin privileges to ${req.userDisplayName}. Proceed?`
        : `Grant College Admin privileges to ${req.userDisplayName} for "${req.collegeName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              setProcessingId(req.id);
              await approveCollegeAdminRequest(req, currentUser.id);
              Alert.alert(
                'Approved',
                `${req.userDisplayName} is now College Admin for ${req.collegeName}`,
              );
              await fetchRequests();
              await fetchColleges();
              await fetchStats();
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Approval failed';
              Alert.alert('Error', msg);
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  const handleReject = (req: CollegeAdminRequest) => {
    if (!currentUser) return;
    Alert.alert(
      'Reject Request',
      `Reject College Admin request from ${req.userDisplayName} for ${req.collegeName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(req.id);
              await rejectCollegeAdminRequest(
                req.id,
                req.userId,
                currentUser.id,
                'Request does not satisfy institutional verification requirements.',
              );
              Alert.alert('Rejected', 'College Admin request rejected.');
              await fetchRequests();
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Rejection failed';
              Alert.alert('Error', msg);
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  // ── COLLEGE ACTIONS ──

  const handleCopyCode = (code: string, label: string) => {
    if (!code) return;
    try {
      Clipboard.setString(code);
      Alert.alert('Copied', `${label} (${code}) copied to clipboard.`);
    } catch {
      Alert.alert('Code', code);
    }
  };

  const handleRegenerateCodes = (
    college: College,
    targetType: 'all' | 'student' | 'faculty' = 'all',
  ) => {
    Alert.alert(
      'Regenerate Invite Codes',
      'Regenerating codes will invalidate all existing codes. Current users are not affected. New users must use the new codes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(`regen_${targetType}_${college.id}`);
              await generateNewCodes(college.id, targetType);
              Alert.alert(
                'Codes Regenerated',
                `New codes successfully generated for ${college.name}.`,
              );
              await fetchColleges();
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Regeneration failed';
              Alert.alert('Error', msg);
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  const handleCreateCollege = async () => {
    if (!newCollegeName.trim() || !newCity.trim() || !newState.trim()) {
      Alert.alert('Validation Error', 'Please enter college name, city, and state.');
      return;
    }
    if (!currentUser) return;

    try {
      setProcessingId('create_college');
      const newCol = await createCollege({
        name: newCollegeName.trim(),
        city: newCity.trim(),
        state: newState.trim(),
        createdBy: currentUser.id,
      });

      // Auto-generate all 3 codes
      const codes = await generateNewCodes(newCol.id, 'all');
      setCreatedCollegeCodes(codes);
      setCreatedCollegeName(newCol.name);
      await fetchColleges();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Creation failed';
      Alert.alert('Error', msg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleCollegeStatus = async (college: College) => {
    const newStatus = !college.isActive;
    Alert.alert(
      newStatus ? 'Activate College' : 'Deactivate College',
      `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} ${college.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: newStatus ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setProcessingId(college.id);
              await toggleCollegeActiveStatus(college.id, newStatus);
              Alert.alert(
                'Updated',
                `${college.name} is now ${newStatus ? 'active' : 'inactive'}.`,
              );
              await fetchColleges();
              await fetchStats();
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Status update failed';
              Alert.alert('Error', msg);
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  const filteredColleges = colleges.filter((c) => {
    const q = collegeSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⚡ Super Admin Panel</Text>
        <Text style={styles.subtitle}>Platform Multi-Tenant Governance</Text>

        {/* Global Summary Mini-Row */}
        <View style={styles.summaryMiniRow}>
          <Text style={styles.summaryMiniText}>
            🏛️ {platformStats?.totalColleges ?? colleges.length} Colleges · 👥{' '}
            {platformStats?.totalUsers ?? 0} Users · 📋 {requests.length} Requests
          </Text>
        </View>
      </View>

      {/* Top Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'college_admin_requests' && styles.tabItemActive]}
          onPress={() => setActiveTab('college_admin_requests')}
          testID="tab-college-admin-requests"
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'college_admin_requests' && styles.tabTextActive,
            ]}
          >
            Requests ({requests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'colleges' && styles.tabItemActive]}
          onPress={() => setActiveTab('colleges')}
          testID="tab-colleges"
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'colleges' && styles.tabTextActive,
            ]}
          >
            Colleges ({colleges.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'stats' && styles.tabItemActive]}
          onPress={() => setActiveTab('stats')}
          testID="tab-stats"
        >
          <Text
            style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}
          >
            Platform Stats
          </Text>
        </TouchableOpacity>
      </View>

      {/* ═══════════════════════════════════════════════════
          TAB 1: COLLEGE ADMIN REQUESTS
         ═══════════════════════════════════════════════════ */}
      {activeTab === 'college_admin_requests' && (
        <View style={styles.content}>
          {isLoadingRequests ? (
            <ActivityIndicator size="large" color="#3D52A0" style={styles.spinner} />
          ) : requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyTitle}>No Pending Admin Requests</Text>
              <Text style={styles.emptySubtitle}>
                All incoming College Admin requests have been reviewed.
              </Text>
            </View>
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => {
                const isNewCollege = !item.collegeId;
                return (
                  <View style={styles.card} testID={`request-item-${item.id}`}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{item.userDisplayName}</Text>
                      {isNewCollege && (
                        <View
                          style={styles.newCollegeBadge}
                          testID={`badge-new-college-${item.id}`}
                        >
                          <Text style={styles.newCollegeBadgeText}>NEW COLLEGE</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.cardEmail}>{item.userEmail}</Text>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Target College:</Text>
                      <Text style={styles.detailValue}>{item.collegeName}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Location:</Text>
                      <Text style={styles.detailValue}>
                        {item.collegeCity}, {item.collegeState}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Designation:</Text>
                      <Text style={styles.detailValue}>{item.designation}</Text>
                    </View>

                    {item.employeeId ? (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Employee ID:</Text>
                        <Text style={styles.detailValue}>{item.employeeId}</Text>
                      </View>
                    ) : null}

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Reason:</Text>
                      <Text style={styles.detailValue}>{item.reason}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Requested on:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn]}
                        onPress={() => handleApprove(item)}
                        disabled={processingId === item.id}
                        testID={`approve-admin-${item.id}`}
                      >
                        {processingId === item.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.actionBtnText}>
                            {isNewCollege ? 'Create & Approve' : 'Approve Admin'}
                          </Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() => handleReject(item)}
                        disabled={processingId === item.id}
                        testID={`reject-admin-${item.id}`}
                      >
                        <Text style={styles.actionBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

      {/* ═══════════════════════════════════════════════════
          TAB 2: COLLEGES MANAGEMENT
         ═══════════════════════════════════════════════════ */}
      {activeTab === 'colleges' && (
        <View style={styles.content}>
          {/* Action Row: Search + Add College Button */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.collegeSearchInput}
              placeholder="Search colleges..."
              placeholderTextColor="#999999"
              value={collegeSearch}
              onChangeText={setCollegeSearch}
            />
            <TouchableOpacity
              style={styles.addCollegeBtn}
              onPress={() => setShowAddCollege(true)}
              testID="button-add-college"
            >
              <Text style={styles.addCollegeBtnText}>➕ Add</Text>
            </TouchableOpacity>
          </View>

          {isLoadingColleges ? (
            <ActivityIndicator size="large" color="#3D52A0" style={styles.spinner} />
          ) : filteredColleges.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏛️</Text>
              <Text style={styles.emptyTitle}>No Colleges Found</Text>
              <Text style={styles.emptySubtitle}>Try searching for another college.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredColleges}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => (
                <View style={styles.card} testID={`college-card-${item.id}`}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>🏫 {item.name}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        item.isActive ? styles.activeBadge : styles.inactiveBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          item.isActive ? styles.activeBadgeText : styles.inactiveBadgeText,
                        ]}
                      >
                        {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.detailValue}>
                    {item.city}, {item.state} · {item.country}
                  </Text>

                  {/* ── Invite Codes Section ── */}
                  <View style={styles.codesSection} testID={`invite-codes-${item.id}`}>
                    <Text style={styles.codesSectionTitle}>🔑 College Invite Codes</Text>

                    {/* Student Code */}
                    <View style={styles.codeRow}>
                      <View style={styles.codeLabelCol}>
                        <Text style={styles.codeLabel}>Student Code:</Text>
                        <Text style={styles.codeValue} testID={`student-code-${item.id}`}>
                          {item.studentInviteCode || 'Not Generated'}
                        </Text>
                      </View>
                      <View style={styles.codeBtnRow}>
                        {item.studentInviteCode ? (
                          <TouchableOpacity
                            style={styles.codeSmallBtn}
                            onPress={() => handleCopyCode(item.studentInviteCode!, 'Student Code')}
                            testID={`btn-copy-student-${item.id}`}>
                            <Text style={styles.codeSmallBtnText}>Copy</Text>
                          </TouchableOpacity>
                        ) : null}
                        <TouchableOpacity
                          style={[styles.codeSmallBtn, styles.regenSmallBtn]}
                          onPress={() => handleRegenerateCodes(item, 'student')}
                          testID={`btn-regen-student-${item.id}`}>
                          <Text style={styles.regenSmallBtnText}>Regenerate</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Faculty Code */}
                    <View style={styles.codeRow}>
                      <View style={styles.codeLabelCol}>
                        <Text style={styles.codeLabel}>Faculty Code:</Text>
                        <Text style={styles.codeValue} testID={`faculty-code-${item.id}`}>
                          {item.facultyInviteCode || 'Not Generated'}
                        </Text>
                      </View>
                      <View style={styles.codeBtnRow}>
                        {item.facultyInviteCode ? (
                          <TouchableOpacity
                            style={styles.codeSmallBtn}
                            onPress={() => handleCopyCode(item.facultyInviteCode!, 'Faculty Code')}
                            testID={`btn-copy-faculty-${item.id}`}>
                            <Text style={styles.codeSmallBtnText}>Copy</Text>
                          </TouchableOpacity>
                        ) : null}
                        <TouchableOpacity
                          style={[styles.codeSmallBtn, styles.regenSmallBtn]}
                          onPress={() => handleRegenerateCodes(item, 'faculty')}
                          testID={`btn-regen-faculty-${item.id}`}>
                          <Text style={styles.regenSmallBtnText}>Regenerate</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Admin Code */}
                    <View style={styles.codeRow}>
                      <View style={styles.codeLabelCol}>
                        <Text style={styles.codeLabel}>Admin Code:</Text>
                        <Text style={styles.codeValue} testID={`admin-code-${item.id}`}>
                          {item.adminInviteCode || 'Not Generated'}
                        </Text>
                      </View>
                      <View style={styles.codeBtnRow}>
                        {item.adminInviteCode ? (
                          <TouchableOpacity
                            style={styles.codeSmallBtn}
                            onPress={() => handleCopyCode(item.adminInviteCode!, 'Admin Code')}
                            testID={`btn-copy-admin-${item.id}`}>
                            <Text style={styles.codeSmallBtnText}>Copy</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>



                    {/* Regenerate All Codes Button */}
                    <TouchableOpacity
                      style={styles.regenAllBtn}
                      onPress={() => handleRegenerateCodes(item, 'all')}
                      testID={`btn-regen-all-${item.id}`}>
                      <Text style={styles.regenAllBtnText}>🔄 Regenerate All Codes</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.userActionRow}>
                    <TouchableOpacity
                      style={[
                        styles.smallActionBtn,
                        item.isActive ? styles.deactivateBtn : styles.activateBtn,
                      ]}
                      onPress={() => handleToggleCollegeStatus(item)}
                      disabled={processingId === item.id}
                      testID={`toggle-college-status-${item.id}`}
                    >
                      <Text style={styles.smallActionBtnText}>
                        {item.isActive ? 'Deactivate' : 'Activate'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* ═══════════════════════════════════════════════════
          TAB 3: PLATFORM STATS
         ═══════════════════════════════════════════════════ */}
      {activeTab === 'stats' && (
        <ScrollView contentContainerStyle={styles.statsContainer}>
          <Text style={styles.statsHeading}>Platform Multi-Tenant Overview</Text>

          {isLoadingStats ? (
            <ActivityIndicator size="large" color="#3D52A0" style={styles.spinner} />
          ) : (
            <>
              {/* 2x2 Grid */}
              <View style={styles.statsGrid} testID="stats-grid">
                <View style={styles.statBox} testID="stat-box-colleges">
                  <Text style={styles.statNumber}>
                    {platformStats?.totalColleges ?? colleges.length}
                  </Text>
                  <Text style={styles.statLabel}>Total Colleges</Text>
                </View>

                <View style={styles.statBox} testID="stat-box-users">
                  <Text style={styles.statNumber}>{platformStats?.totalUsers ?? 0}</Text>
                  <Text style={styles.statLabel}>Platform Users</Text>
                </View>

                <View style={styles.statBox} testID="stat-box-entries">
                  <Text style={styles.statNumber}>{platformStats?.totalEntries ?? 0}</Text>
                  <Text style={styles.statLabel}>Approved Knowledge</Text>
                </View>

                <View style={styles.statBox} testID="stat-box-requests">
                  <Text style={styles.statNumber}>
                    {platformStats?.pendingAdminRequests ?? requests.length}
                  </Text>
                  <Text style={styles.statLabel}>Pending Requests</Text>
                </View>
              </View>

              {/* College Leaderboard */}
              <Text style={styles.sectionHeading}>College Leaderboard</Text>
              {leaderboard.length === 0 ? (
                <Text style={styles.emptyNotice}>No member data recorded.</Text>
              ) : (
                leaderboard.map((col, idx) => (
                  <View key={col.id} style={styles.leaderboardItem}>
                    <View style={styles.leaderboardRank}>
                      <Text style={styles.leaderboardRankText}>#{idx + 1}</Text>
                    </View>
                    <View style={styles.leaderboardInfo}>
                      <Text style={styles.leaderboardTitle}>{col.name}</Text>
                      <Text style={styles.leaderboardMeta}>{col.userCount} registered members</Text>
                    </View>
                  </View>
                ))
              )}

              {/* Platform Activity */}
              <Text style={styles.sectionHeading}>Recent Approved Entries Across Colleges</Text>
              {recentEntries.length === 0 ? (
                <Text style={styles.emptyNotice}>No approved entries yet.</Text>
              ) : (
                recentEntries.map((e) => (
                  <View key={e.id} style={styles.activityItem}>
                    <Text style={styles.activityEmoji}>📖</Text>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{e.title}</Text>
                      <Text style={styles.activityMeta}>
                        By {e.authorName} · {new Date(e.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* ═══════════════════════════════════════════════════
          ADD COLLEGE MODAL
         ═══════════════════════════════════════════════════ */}
      {showAddCollege && (
        <Modal
          visible={showAddCollege}
          animationType="slide"
          transparent
          onRequestClose={() => setShowAddCollege(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard} testID="modal-add-college">
              {createdCollegeCodes !== null ? (
                <View>
                  <Text style={styles.modalTitle}>🎉 College Created!</Text>
                  <Text style={styles.modalSubtitle}>
                    Share these codes for {createdCollegeName} with the College Admin:
                  </Text>

                  <View style={styles.createdCodesCard}>
                    <View style={styles.createdCodeItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.createdCodeLabel}>Student:</Text>
                        <Text style={styles.createdCodeValue} testID="created-student-code">
                          {createdCollegeCodes.studentCode}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.codeSmallBtn}
                        onPress={() => handleCopyCode(createdCollegeCodes.studentCode, 'Student Code')}
                        testID="btn-copy-created-student">
                        <Text style={styles.codeSmallBtnText}>Copy</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.createdCodeItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.createdCodeLabel}>Faculty:</Text>
                        <Text style={styles.createdCodeValue} testID="created-faculty-code">
                          {createdCollegeCodes.facultyCode}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.codeSmallBtn}
                        onPress={() => handleCopyCode(createdCollegeCodes.facultyCode, 'Faculty Code')}
                        testID="btn-copy-created-faculty">
                        <Text style={styles.codeSmallBtnText}>Copy</Text>
                      </TouchableOpacity>
                    </View>

                    {createdCollegeCodes.adminCode ? (
                      <View style={styles.createdCodeItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.createdCodeLabel}>Admin:</Text>
                          <Text style={styles.createdCodeValue} testID="created-admin-code">
                            {createdCollegeCodes.adminCode}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.codeSmallBtn}
                          onPress={() => handleCopyCode(createdCollegeCodes.adminCode || '', 'Admin Code')}
                          testID="btn-copy-created-admin">
                          <Text style={styles.codeSmallBtnText}>Copy</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={() => {
                      setShowAddCollege(false);
                      setCreatedCollegeCodes(null);
                      setNewCollegeName('');
                      setNewCity('');
                      setNewState('');
                    }}
                    testID="btn-done-create-college">
                    <Text style={styles.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={styles.modalTitle}>Add New College</Text>
                  <Text style={styles.modalSubtitle}>Register a new educational institution</Text>

                  <TextInput
                    style={styles.textInput}
                    placeholder="College Name (e.g. Model Engineering College)"
                    placeholderTextColor="#999999"
                    value={newCollegeName}
                    onChangeText={setNewCollegeName}
                    testID="input-new-college-name"
                  />

                  <TextInput
                    style={styles.textInput}
                    placeholder="City (e.g. Kochi, Bengaluru)"
                    placeholderTextColor="#999999"
                    value={newCity}
                    onChangeText={setNewCity}
                    testID="input-new-college-city"
                  />

                  <TextInput
                    style={styles.textInput}
                    placeholder="State (e.g. Kerala, Karnataka)"
                    placeholderTextColor="#999999"
                    value={newState}
                    onChangeText={setNewState}
                    testID="input-new-college-state"
                  />

                  <View style={styles.modalBtnRow}>
                    <TouchableOpacity
                      style={[styles.modalActionBtn, styles.cancelModalBtn]}
                      onPress={() => setShowAddCollege(false)}
                      testID="button-cancel-add-college"
                    >
                      <Text style={styles.cancelModalBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalActionBtn, styles.submitModalBtn]}
                      onPress={handleCreateCollege}
                      disabled={processingId === 'create_college'}
                      testID="button-submit-create-college"
                    >
                      {processingId === 'create_college' ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.submitModalBtnText}>Create College</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  subtitle: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 2,
  },
  summaryMiniRow: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#EEF2F6',
    borderRadius: 6,
  },
  summaryMiniText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabItemActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#3D52A0',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C757D',
  },
  tabTextActive: {
    color: '#3D52A0',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  spinner: {
    marginTop: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyNotice: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginVertical: 8,
  },
  listContainer: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    flex: 1,
  },
  cardEmail: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 8,
  },
  newCollegeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  newCollegeBadgeText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  inactiveBadge: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  activeBadgeText: {
    color: '#059669',
  },
  inactiveBadgeText: {
    color: '#64748B',
  },
  detailRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    width: 110,
  },
  detailValue: {
    fontSize: 12,
    color: '#212529',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: {
    backgroundColor: '#10B981',
  },
  rejectBtn: {
    backgroundColor: '#EF4444',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  userActionRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  smallActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deactivateBtn: {
    backgroundColor: '#EF4444',
  },
  activateBtn: {
    backgroundColor: '#10B981',
  },
  smallActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  collegeSearchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addCollegeBtn: {
    backgroundColor: '#3D52A0',
    borderRadius: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCollegeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  statsContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  statsHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginTop: 20,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3D52A0',
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
    textAlign: 'center',
  },
  leaderboardItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leaderboardRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leaderboardRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3D52A0',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  leaderboardMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activityEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  activityMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalBtn: {
    backgroundColor: '#F1F5F9',
  },
  cancelModalBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  submitModalBtn: {
    backgroundColor: '#3D52A0',
  },
  submitModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  codesSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  codesSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  codeLabelCol: {
    flex: 1,
  },
  codeLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  codeValue: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  codeBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  codeSmallBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  codeSmallBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  regenSmallBtn: {
    backgroundColor: '#FEF3C7',
  },
  regenSmallBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  regenAllBtn: {
    marginTop: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  regenAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  createdCodesCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  createdCodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  createdCodeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  createdCodeValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  doneBtn: {
    backgroundColor: '#3D52A0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SuperAdminScreen;

/**
 * College Admin Panel Screen
 * College Knowledge Vault
 *
 * Scoped strictly to the College Admin's college.
 * Tab 1: Faculty Management (Pending Requests + Verified Faculty List with revoke)
 * Tab 2: User Management (Search, Role Filter Chips, User Detail Modal with revoke/restore)
 * Tab 3: College Statistics (2x2/3x2 Grid, Type Breakdown, Top Contributors, Recent Activity)
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
import { UserProfile, EffectiveRole } from '../../../core/types/user.types';
import { computeEffectiveRole, isSenior } from '../../../core/utils/roleChecker';
import {
  FacultyRequestItem,
  getFacultyRequests,
  approveFacultyRequest,
  rejectFacultyRequest,
  revokeSeniorAccess,
  restoreSeniorAccess,
  revokeFacultyVerification,
} from '../../../core/services/facultyRequestService';
import { getCollegeUsers } from '../../../core/services/collegeService';
import {
  getCollegeStats,
  getTopContributors,
  getRecentActivity,
  CollegeStats,
  ContributorItem,
  ActivityItem,
} from '../../../core/services/profileService';
import { supabase } from '../../../core/services/supabase';
import Clipboard from '@react-native-clipboard/clipboard';
import { generateNewCodes } from '../../../core/services/inviteCodeService';

type CollegeAdminTab = 'faculty_verification' | 'user_management' | 'stats';
type UserFilterChip = 'all' | 'students' | 'seniors' | 'faculty' | 'pending';

const CollegeAdminScreen: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<CollegeAdminTab>('faculty_verification');

  // Tab 1: Faculty Requests & Verified Faculty
  const [facultyRequests, setFacultyRequests] = useState<FacultyRequestItem[]>([]);
  const [facultySubTab, setFacultySubTab] = useState<'pending' | 'verified'>('pending');
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Tab 2: User Management
  const [collegeUsers, setCollegeUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<UserFilterChip>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Tab 3: College Stats & Codes
  const [stats, setStats] = useState<CollegeStats | null>(null);
  const [typeBreakdown, setTypeBreakdown] = useState<Record<string, number>>({});
  const [topContributors, setTopContributors] = useState<ContributorItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [studentInviteCode, setStudentInviteCode] = useState<string>('');
  const [facultyInviteCode, setFacultyInviteCode] = useState<string>('');

  // Action Loading State
  const [processingId, setProcessingId] = useState<string | null>(null);

  const collegeName = currentUser?.collegeName || currentUser?.college || 'My College';
  const collegeId = currentUser?.collegeId || '';

  // ── LOADERS ──

  const fetchFacultyRequests = useCallback(async () => {
    if (!currentUser) return;
    try {
      setIsLoadingRequests(true);
      const allRequests = await getFacultyRequests();
      // Strictly scope to current college
      const filtered = allRequests.filter(
        (r) =>
          (collegeId && r.college === collegeName) ||
          r.college.toLowerCase() === collegeName.toLowerCase(),
      );
      setFacultyRequests(filtered);
    } catch {
      // Fallback
    } finally {
      setIsLoadingRequests(false);
    }
  }, [currentUser, collegeId, collegeName]);

  const fetchUsers = useCallback(async () => {
    if (!collegeId) return;
    try {
      setIsLoadingUsers(true);
      const data = await getCollegeUsers(collegeId);
      setCollegeUsers(data);
    } catch {
      // Fallback
    } finally {
      setIsLoadingUsers(false);
    }
  }, [collegeId]);

  const fetchStats = useCallback(async () => {
    if (!collegeId) return;
    try {
      setIsLoadingStats(true);
      const [colStats, contribs, activity, entriesRes] = await Promise.all([
        getCollegeStats(collegeId),
        getTopContributors(collegeId, 5),
        getRecentActivity(collegeId, 10),
        supabase.from('entries').select('type').eq('college_id', collegeId),
      ]);

      setStats(colStats);
      setTopContributors(contribs);
      setRecentActivity(activity);

      const counts: Record<string, number> = { project: 0, viva: 0, mistake: 0, resource: 0 };
      for (const row of entriesRes.data || []) {
        if (row.type in counts) {
          counts[row.type]++;
        }
      }
      setTypeBreakdown(counts);
    } catch {
      // Fallback
    } finally {
      setIsLoadingStats(false);
    }
  }, [collegeId]);

  const fetchCollegeCodes = useCallback(async () => {
    if (!collegeId) return;
    try {
      const { data } = await supabase
        .from('colleges')
        .select('student_invite_code, faculty_invite_code')
        .eq('id', collegeId)
        .maybeSingle();
      if (data) {
        setStudentInviteCode(data.student_invite_code || '');
        setFacultyInviteCode(data.faculty_invite_code || '');
      }
    } catch {
      // Fallback
    }
  }, [collegeId]);

  useEffect(() => {
    fetchFacultyRequests();
    fetchUsers();
    fetchStats();
    fetchCollegeCodes();
  }, [fetchFacultyRequests, fetchUsers, fetchStats, fetchCollegeCodes]);

  const handleCopyCode = (code: string, label: string) => {
    if (!code) return;
    try {
      Clipboard.setString(code);
      Alert.alert('Copied', `${label} (${code}) copied to clipboard.`);
    } catch {
      Alert.alert('Code', code);
    }
  };

  const handleRegenerateCode = (type: 'student' | 'faculty') => {
    Alert.alert(
      type === 'student' ? 'Regenerate Student Code' : 'Regenerate Faculty Code',
      'Students with old code can still join with it for 24 hours. After that only new code works.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Regenerate',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(`regen_${type}`);
              const codes = await generateNewCodes(collegeId, type);
              if (type === 'student') setStudentInviteCode(codes.studentCode);
              if (type === 'faculty') setFacultyInviteCode(codes.facultyCode);
              Alert.alert(
                'Success',
                `New ${type} code generated: ${type === 'student' ? codes.studentCode : codes.facultyCode}`,
              );
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to regenerate code');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  // ── FACULTY ACTIONS ──

  const handleApproveFaculty = async (req: FacultyRequestItem) => {
    if (!currentUser) return;
    Alert.alert(
      'Verify Faculty',
      `Grant verified Faculty status to ${req.userDisplayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          style: 'default',
          onPress: async () => {
            try {
              setProcessingId(req.id);
              await approveFacultyRequest(req.id, req.userId, currentUser.id);
              Alert.alert('Approved', `Verified faculty status granted for ${req.userDisplayName}`);
              await fetchFacultyRequests();
              await fetchUsers();
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

  const handleRejectFaculty = (req: FacultyRequestItem) => {
    if (!currentUser) return;
    Alert.alert(
      'Reject Request',
      `Are you sure you want to reject the faculty verification request from ${req.userDisplayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(req.id);
              await rejectFacultyRequest(
                req.id,
                req.userId,
                currentUser.id,
                'Application does not meet institutional verification criteria.',
              );
              Alert.alert('Rejected', 'Faculty request has been rejected.');
              await fetchFacultyRequests();
              await fetchUsers();
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

  const handleRevokeVerifiedFaculty = (facultyUser: UserProfile) => {
    if (!currentUser) return;
    Alert.alert(
      'Revoke Faculty Status',
      `Revoke verified faculty privileges for ${facultyUser.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(facultyUser.id);
              await revokeFacultyVerification(facultyUser.id, currentUser.id);
              Alert.alert('Revoked', `Faculty privileges revoked for ${facultyUser.displayName}`);
              await fetchUsers();
              await fetchStats();
              if (selectedUser?.id === facultyUser.id) {
                setSelectedUser(null);
              }
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Operation failed';
              Alert.alert('Error', msg);
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  // ── SENIOR REVOCATION ACTIONS ──

  const handleToggleSeniorRevoke = async (userItem: UserProfile) => {
    if (!currentUser) return;
    const isRevoked = userItem.isSeniorRevoked;

    Alert.alert(
      isRevoked ? 'Restore Senior Access' : 'Revoke Senior Access',
      `Are you sure you want to ${isRevoked ? 'restore' : 'revoke'} senior submission access for ${userItem.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: isRevoked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setProcessingId(userItem.id);
              if (isRevoked) {
                await restoreSeniorAccess(userItem.id, currentUser.id);
                Alert.alert('Restored', `Senior access restored for ${userItem.displayName}`);
              } else {
                await revokeSeniorAccess(userItem.id, currentUser.id);
                Alert.alert('Revoked', `Senior submission access revoked for ${userItem.displayName}`);
              }
              await fetchUsers();
              await fetchStats();
              if (selectedUser?.id === userItem.id) {
                setSelectedUser((prev) =>
                  prev ? { ...prev, isSeniorRevoked: !isRevoked } : null,
                );
              }
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Operation failed';
              Alert.alert('Error', msg);
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  // ── FILTERED USERS & VERIFIED FACULTY ──

  const verifiedFacultyUsers = collegeUsers.filter(
    (u) => u.role === 'faculty' && u.isVerified,
  );

  const filteredUsers = collegeUsers.filter((u) => {
    // 1. Search Query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const match =
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q);
      if (!match) return false;
    }

    // 2. Role Filter Chip
    const effRole = computeEffectiveRole(u);
    if (selectedFilter === 'students') {
      return effRole === EffectiveRole.Student;
    }
    if (selectedFilter === 'seniors') {
      return effRole === EffectiveRole.Senior;
    }
    if (selectedFilter === 'faculty') {
      return effRole === EffectiveRole.Faculty;
    }
    if (selectedFilter === 'pending') {
      return effRole === EffectiveRole.PendingFaculty;
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏫 College Admin Panel</Text>
        <Text style={styles.subtitle}>{collegeName} Governance</Text>
      </View>

      {/* Top Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'faculty_verification' && styles.tabItemActive]}
          onPress={() => setActiveTab('faculty_verification')}
          testID="tab-faculty-verification"
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'faculty_verification' && styles.tabTextActive,
            ]}
          >
            Faculty ({facultyRequests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'user_management' && styles.tabItemActive]}
          onPress={() => setActiveTab('user_management')}
          testID="tab-college-users"
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'user_management' && styles.tabTextActive,
            ]}
          >
            Users ({collegeUsers.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'stats' && styles.tabItemActive]}
          onPress={() => setActiveTab('stats')}
          testID="tab-college-stats"
        >
          <Text
            style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}
          >
            Stats
          </Text>
        </TouchableOpacity>
      </View>

      {/* ═══════════════════════════════════════════════════
          TAB 1: FACULTY MANAGEMENT
         ═══════════════════════════════════════════════════ */}
      {activeTab === 'faculty_verification' && (
        <View style={styles.content}>
          {/* Sub-tabs: Pending vs Verified */}
          <View style={styles.subTabBar}>
            <TouchableOpacity
              style={[styles.subTabItem, facultySubTab === 'pending' && styles.subTabItemActive]}
              onPress={() => setFacultySubTab('pending')}
            >
              <Text
                style={[
                  styles.subTabText,
                  facultySubTab === 'pending' && styles.subTabTextActive,
                ]}
              >
                Pending Requests ({facultyRequests.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subTabItem, facultySubTab === 'verified' && styles.subTabItemActive]}
              onPress={() => setFacultySubTab('verified')}
            >
              <Text
                style={[
                  styles.subTabText,
                  facultySubTab === 'verified' && styles.subTabTextActive,
                ]}
              >
                Verified Faculty ({verifiedFacultyUsers.length})
              </Text>
            </TouchableOpacity>
          </View>

          {isLoadingRequests ? (
            <ActivityIndicator size="large" color="#3D52A0" style={styles.spinner} />
          ) : facultySubTab === 'pending' ? (
            facultyRequests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>✅</Text>
                <Text style={styles.emptyTitle}>No Pending Faculty Requests</Text>
                <Text style={styles.emptySubtitle}>
                  All faculty verification requests for {collegeName} have been processed.
                </Text>
              </View>
            ) : (
              <FlatList
                data={facultyRequests}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item }) => (
                  <View style={styles.card} testID={`faculty-item-${item.id}`}>
                    <Text style={styles.cardTitle}>{item.userDisplayName}</Text>
                    <Text style={styles.cardEmail}>{item.userEmail}</Text>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Department:</Text>
                      <Text style={styles.detailValue}>{item.department}</Text>
                    </View>

                    {item.employeeId ? (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Employee ID:</Text>
                        <Text style={styles.detailValue}>{item.employeeId}</Text>
                      </View>
                    ) : null}

                    {item.reviewNote ? (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Reason:</Text>
                        <Text style={styles.detailValue}>{item.reviewNote}</Text>
                      </View>
                    ) : null}

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn]}
                        onPress={() => handleApproveFaculty(item)}
                        disabled={processingId === item.id}
                        testID={`approve-faculty-${item.id}`}
                      >
                        {processingId === item.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.actionBtnText}>Verify Faculty</Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() => handleRejectFaculty(item)}
                        disabled={processingId === item.id}
                        testID={`reject-faculty-${item.id}`}
                      >
                        <Text style={styles.actionBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )
          ) : (
            // Verified Faculty List
            verifiedFacultyUsers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>👨‍🏫</Text>
                <Text style={styles.emptyTitle}>No Verified Faculty</Text>
                <Text style={styles.emptySubtitle}>
                  There are no verified faculty members currently assigned to {collegeName}.
                </Text>
              </View>
            ) : (
              <FlatList
                data={verifiedFacultyUsers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item }) => (
                  <View style={styles.card} testID={`verified-faculty-${item.id}`}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{item.displayName}</Text>
                      <View style={[styles.badgeContainer, { backgroundColor: '#E0F2FE' }]}>
                        <Text style={[styles.roleBadgeText, { color: '#0369A1' }]}>VERIFIED</Text>
                      </View>
                    </View>
                    <Text style={styles.cardEmail}>{item.email}</Text>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Department:</Text>
                      <Text style={styles.detailValue}>{item.department || 'N/A'}</Text>
                    </View>

                    <View style={styles.userActionRow}>
                      <TouchableOpacity
                        style={[styles.smallActionBtn, styles.revokeBtn]}
                        onPress={() => handleRevokeVerifiedFaculty(item)}
                        disabled={processingId === item.id}
                        testID={`revoke-faculty-${item.id}`}
                      >
                        <Text style={styles.smallActionBtnText}>Revoke Faculty Status</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )
          )}
        </View>
      )}

      {/* ═══════════════════════════════════════════════════
          TAB 2: USER MANAGEMENT
         ═══════════════════════════════════════════════════ */}
      {activeTab === 'user_management' && (
        <View style={styles.content}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, department..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="input-search-college-users"
          />

          {/* Filter Chips */}
          <View style={styles.chipRow}>
            {(['all', 'students', 'seniors', 'faculty', 'pending'] as UserFilterChip[]).map(
              (chip) => (
                <TouchableOpacity
                  key={chip}
                  style={[
                    styles.filterChip,
                    selectedFilter === chip && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedFilter(chip)}
                  testID={`filter-chip-${chip}`}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFilter === chip && styles.filterChipTextActive,
                    ]}
                  >
                    {chip.charAt(0).toUpperCase() + chip.slice(1)}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>

          {isLoadingUsers ? (
            <ActivityIndicator size="large" color="#3D52A0" style={styles.spinner} />
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search query or filter.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => {
                const effRole = computeEffectiveRole(item);
                const roleColor =
                  effRole === EffectiveRole.Faculty
                    ? '#059669'
                    : effRole === EffectiveRole.Senior
                    ? '#2563EB'
                    : effRole === EffectiveRole.PendingFaculty
                    ? '#D97706'
                    : '#4B5563';

                return (
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => setSelectedUser(item)}
                    activeOpacity={0.7}
                    testID={`user-item-${item.id}`}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{item.displayName}</Text>
                      <View style={[styles.badgeContainer, { backgroundColor: `${roleColor}15` }]}>
                        <Text style={[styles.roleBadgeText, { color: roleColor }]}>
                          {effRole.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardEmail}>{item.email}</Text>
                    <Text style={styles.detailValue}>
                      {item.department} · {item.program || 'Student'} · Joining {item.joiningYear || item.graduationYear || 'N/A'}
                    </Text>

                    {item.isSeniorRevoked && (
                      <Text style={styles.revokedWarning}>⚠️ Senior access currently revoked</Text>
                    )}

                    <View style={styles.userActionRow}>
                      {isSenior(item) && (
                        <TouchableOpacity
                          style={[
                            styles.smallActionBtn,
                            item.isSeniorRevoked ? styles.restoreBtn : styles.revokeBtn,
                          ]}
                          onPress={() => handleToggleSeniorRevoke(item)}
                          disabled={processingId === item.id}
                          testID={`toggle-senior-${item.id}`}
                        >
                          <Text style={styles.smallActionBtnText}>
                            {item.isSeniorRevoked ? 'Restore Senior' : 'Revoke Senior'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      )}

      {/* ═══════════════════════════════════════════════════
          TAB 3: COLLEGE STATS & OVERVIEW
         ═══════════════════════════════════════════════════ */}
      {activeTab === 'stats' && (
        <ScrollView contentContainerStyle={styles.statsContainer}>
          <Text style={styles.statsHeading}>Institutional Overview</Text>

          {isLoadingStats ? (
            <ActivityIndicator size="large" color="#3D52A0" style={styles.spinner} />
          ) : (
            <>
              {/* 3x2 Grid */}
              <View style={styles.statsGrid} testID="stats-grid">
                <View style={styles.statBox} testID="stat-box-students">
                  <Text style={styles.statNumber}>{stats?.totalStudents ?? 0}</Text>
                  <Text style={styles.statLabel}>Students</Text>
                </View>
                <View style={styles.statBox} testID="stat-box-seniors">
                  <Text style={styles.statNumber}>{stats?.totalSeniors ?? 0}</Text>
                  <Text style={styles.statLabel}>Active Seniors</Text>
                </View>
                <View style={styles.statBox} testID="stat-box-faculty">
                  <Text style={styles.statNumber}>{stats?.verifiedFaculty ?? 0}</Text>
                  <Text style={styles.statLabel}>Verified Faculty</Text>
                </View>
                <View style={styles.statBox} testID="stat-box-pending-faculty">
                  <Text style={styles.statNumber}>{stats?.pendingFaculty ?? 0}</Text>
                  <Text style={styles.statLabel}>Pending Faculty</Text>
                </View>
                <View style={styles.statBox} testID="stat-box-approved-entries">
                  <Text style={styles.statNumber}>{stats?.approvedEntries ?? 0}</Text>
                  <Text style={styles.statLabel}>Approved Entries</Text>
                </View>
                <View style={styles.statBox} testID="stat-box-pending-entries">
                  <Text style={styles.statNumber}>{stats?.pendingEntries ?? 0}</Text>
                  <Text style={styles.statLabel}>Pending Queue</Text>
                </View>
              </View>

              {/* ── Your College Invite Codes ── */}
              <View style={styles.inviteCodesCard} testID="college-invite-codes-section">
                <Text style={styles.inviteCodesTitle}>Your College Invite Codes</Text>

                {/* Student Code */}
                <View style={styles.codeItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.codeItemLabel}>Student Code:</Text>
                    <Text style={styles.codeItemValue} testID="text-college-student-code">
                      {studentInviteCode || 'Not Generated'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.codeCopyBtn}
                    onPress={() => handleCopyCode(studentInviteCode, 'Student Code')}
                    testID="btn-copy-student-code">
                    <Text style={styles.codeCopyBtnText}>Copy</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.regenCodeBtn}
                  onPress={() => handleRegenerateCode('student')}
                  disabled={processingId === 'regen_student'}
                  testID="btn-regen-student-code">
                  <Text style={styles.regenCodeBtnText}>
                    {processingId === 'regen_student' ? 'Regenerating...' : 'Regenerate Student Code'}
                  </Text>
                </TouchableOpacity>

                {/* Faculty Code */}
                <View style={[styles.codeItemRow, { marginTop: 12 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.codeItemLabel}>Faculty Code:</Text>
                    <Text style={styles.codeItemValue} testID="text-college-faculty-code">
                      {facultyInviteCode || 'Not Generated'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.codeCopyBtn}
                    onPress={() => handleCopyCode(facultyInviteCode, 'Faculty Code')}
                    testID="btn-copy-faculty-code">
                    <Text style={styles.codeCopyBtnText}>Copy</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.regenCodeBtn}
                  onPress={() => handleRegenerateCode('faculty')}
                  disabled={processingId === 'regen_faculty'}
                  testID="btn-regen-faculty-code">
                  <Text style={styles.regenCodeBtnText}>
                    {processingId === 'regen_faculty' ? 'Regenerating...' : 'Regenerate Faculty Code'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.codeSharingNote}>
                  Note: Share these codes with your students and faculty. Do NOT share faculty code with students.
                </Text>
              </View>

              {/* Entry Breakdown by Type */}
              <Text style={styles.sectionHeading}>Entry Breakdown by Type</Text>
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownCard}>
                  <Text style={styles.breakdownEmoji}>💼</Text>
                  <Text style={styles.breakdownCount}>{typeBreakdown.project ?? 0}</Text>
                  <Text style={styles.breakdownLabel}>Projects</Text>
                </View>
                <View style={styles.breakdownCard}>
                  <Text style={styles.breakdownEmoji}>🗣️</Text>
                  <Text style={styles.breakdownCount}>{typeBreakdown.viva ?? 0}</Text>
                  <Text style={styles.breakdownLabel}>Viva Qs</Text>
                </View>
                <View style={styles.breakdownCard}>
                  <Text style={styles.breakdownEmoji}>⚠️</Text>
                  <Text style={styles.breakdownCount}>{typeBreakdown.mistake ?? 0}</Text>
                  <Text style={styles.breakdownLabel}>Mistakes</Text>
                </View>
                <View style={styles.breakdownCard}>
                  <Text style={styles.breakdownEmoji}>📚</Text>
                  <Text style={styles.breakdownCount}>{typeBreakdown.resource ?? 0}</Text>
                  <Text style={styles.breakdownLabel}>Resources</Text>
                </View>
              </View>

              {/* Top Contributors */}
              <Text style={styles.sectionHeading}>Top Student Contributors</Text>
              {topContributors.length === 0 ? (
                <Text style={styles.emptyNotice}>No contributor records yet.</Text>
              ) : (
                topContributors.map((c, i) => (
                  <View key={c.id} style={styles.contributorRow}>
                    <View style={styles.contributorRank}>
                      <Text style={styles.contributorRankText}>#{i + 1}</Text>
                    </View>
                    <View style={styles.contributorInfo}>
                      <Text style={styles.contributorName}>{c.displayName}</Text>
                      <Text style={styles.contributorMeta}>
                        {c.entryCount} entries · {c.upvoteCount} upvotes
                      </Text>
                    </View>
                  </View>
                ))
              )}

              {/* Recent Activity */}
              <Text style={styles.sectionHeading}>Recent College Activity</Text>
              {recentActivity.length === 0 ? (
                <Text style={styles.emptyNotice}>No recent activity logged.</Text>
              ) : (
                recentActivity.map((act) => (
                  <View key={act.id} style={styles.activityItem}>
                    <Text style={styles.activityEmoji}>
                      {act.type === 'entry_approved' ? '✅' : '📝'}
                    </Text>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{act.title}</Text>
                      <Text style={styles.activityMeta}>
                        By {act.actorName} · {new Date(act.timestamp).toLocaleDateString()}
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
          USER DETAIL MODAL
         ═══════════════════════════════════════════════════ */}
      <Modal
        visible={!!selectedUser}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedUser(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard} testID="modal-user-detail">
            {selectedUser && (
              <>
                <Text style={styles.modalTitle}>{selectedUser.displayName}</Text>
                <Text style={styles.modalEmail}>{selectedUser.email}</Text>

                <View style={styles.modalDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Role:</Text>
                  <Text style={styles.detailValue}>
                    {computeEffectiveRole(selectedUser).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Department:</Text>
                  <Text style={styles.detailValue}>{selectedUser.department || 'N/A'}</Text>
                </View>

                {selectedUser.program ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Program:</Text>
                    <Text style={styles.detailValue}>{selectedUser.program}</Text>
                  </View>
                ) : null}

                {selectedUser.joiningYear ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Joining Year:</Text>
                    <Text style={styles.detailValue}>{selectedUser.joiningYear}</Text>
                  </View>
                ) : null}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Entries Contributed:</Text>
                  <Text style={styles.detailValue}>{selectedUser.entryCount ?? 0}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Upvotes Received:</Text>
                  <Text style={styles.detailValue}>{selectedUser.totalUpvotesReceived ?? 0}</Text>
                </View>

                {/* Modal Action Buttons */}
                <View style={styles.modalActionCol}>
                  {isSenior(selectedUser) && (
                    <TouchableOpacity
                      style={[
                        styles.modalBtn,
                        selectedUser.isSeniorRevoked ? styles.restoreBtn : styles.revokeBtn,
                      ]}
                      onPress={() => handleToggleSeniorRevoke(selectedUser)}
                      disabled={processingId === selectedUser.id}
                      testID={selectedUser.isSeniorRevoked ? 'modal-restore-senior' : 'modal-revoke-senior'}
                    >
                      <Text style={styles.modalBtnText}>
                        {selectedUser.isSeniorRevoked
                          ? 'Restore Senior Access'
                          : 'Revoke Senior Access'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {selectedUser.role === 'faculty' && selectedUser.isVerified && (
                    <TouchableOpacity
                      style={[styles.modalBtn, styles.revokeBtn]}
                      onPress={() => handleRevokeVerifiedFaculty(selectedUser)}
                      disabled={processingId === selectedUser.id}
                    >
                      <Text style={styles.modalBtnText}>Revoke Faculty Privileges</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.closeModalBtn]}
                    onPress={() => setSelectedUser(null)}
                    testID="modal-close-button"
                  >
                    <Text style={styles.closeModalBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 8,
    padding: 3,
    marginBottom: 12,
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  subTabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  subTabTextActive: {
    color: '#1E293B',
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
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 8,
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
    width: 130,
  },
  detailValue: {
    fontSize: 13,
    color: '#212529',
    flex: 1,
  },
  revokedWarning: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    fontWeight: '600',
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
  revokeBtn: {
    backgroundColor: '#EF4444',
  },
  restoreBtn: {
    backgroundColor: '#10B981',
  },
  smallActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#3D52A0',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
  breakdownRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  breakdownCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  breakdownEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  breakdownCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  breakdownLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  contributorRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contributorRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contributorRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  contributorInfo: {
    flex: 1,
  },
  contributorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  contributorMeta: {
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  modalActionCol: {
    marginTop: 18,
    gap: 8,
  },
  modalBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  closeModalBtn: {
    backgroundColor: '#F1F5F9',
  },
  closeModalBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  inviteCodesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inviteCodesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  codeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  codeItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  codeItemValue: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  codeCopyBtn: {
    backgroundColor: '#EEF2F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  codeCopyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3D52A0',
  },
  regenCodeBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  regenCodeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
  },
  codeSharingNote: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default CollegeAdminScreen;

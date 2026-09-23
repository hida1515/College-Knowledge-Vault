/**
 * Role Selection & Context-Specific Onboarding Screen
 * College Knowledge Vault
 *
 * Implements Invite Code Verification System:
 * - Step 1: Enter college invite code (student, faculty, or admin code)
 * - Auto-locks college selection upon verification
 * - Dynamic Step 2 & 3 flow based on verified code type:
 *   - 'student': Program + Year + Dept (auto academic standing) -> Home
 *   - 'faculty': Dept + Designation + Emp ID + Reason -> PendingAccessScreen
 *   - 'college_admin': Designation + Emp ID + Reason -> PendingAccessScreen
 * - Re-verification for existing users without joined_via_code
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { completeRoleSelection } from '../../../core/services/authService';
import { submitFacultyRequest } from '../../../core/services/facultyRequestService';
import {
  College,
  submitCollegeAdminRequest,
  getColleges,
  searchColleges,
  createCollege,
} from '../../../core/services/collegeService';
import {
  validateInviteCode,
  recordUserCode,
  InviteCodeType,
} from '../../../core/services/inviteCodeService';
import { useAuthStore } from '../../../core/store/authStore';
import { UserRole, UserProfile } from '../../../core/types/user.types';
import { ERRORS } from '../../../core/constants/appConstants';
import {
  PROGRAMS,
  Program,
  getDepartmentsForProgram,
} from '../../../core/constants/programs';
import { computeAcademicStanding } from '../../../core/utils/roleChecker';
import type { RootStackParamList } from '../../../core/types/navigation.types';

type OptionalRoleChoice = 'none' | 'faculty' | 'college_admin';
type RoleSelectionRouteProp = RouteProp<RootStackParamList, 'RoleSelection'>;
type RoleSelectionNavProp = NativeStackNavigationProp<RootStackParamList, 'RoleSelection'>;

const COMMON_FACULTY_DESIGNATIONS = [
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'HOD',
  'Dean',
  'Lecturer',
];

const COMMON_ADMIN_DESIGNATIONS = [
  'HOD (Head of Department)',
  'Principal',
  'Vice Principal',
  'Department Coordinator',
  'Professor',
  'Associate Professor',
  'Other',
];

const RoleSelectionScreen: React.FC = () => {
  const route = useRoute<RoleSelectionRouteProp>();
  const navigation = useNavigation<RoleSelectionNavProp>();
  const {
    user,
    setUser,
    isNewUser,
    setIsNewUser,
    selectedContextRole,
    signOut,
  } = useAuthStore();

  // Active portal context
  const contextRole: UserRole | 'college_admin' | 'super_admin' =
    route.params?.contextRole ||
    selectedContextRole ||
    UserRole.Student;

  const isSuperAdminContext = contextRole === 'super_admin';
  const isCollegeAdminFlow = contextRole === 'college_admin';

  // ── Step 1: Invite Code State ──
  const [inviteCode, setInviteCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [verifiedCodeType, setVerifiedCodeType] = useState<InviteCodeType>('student');
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(null);
  const [isCustomCollege, setIsCustomCollege] = useState(false);

  // Existing user re-verification state
  const isExistingUserNeedingVerification = Boolean(
    user?.collegeId && !user?.joinedViaCode && !isNewUser,
  );
  const [reverifyWarning, setReverifyWarning] = useState<string | null>(null);

  // Student Flow: Program, Department & Joining Year State
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [department, setDepartment] = useState('');
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [customDeptText, setCustomDeptText] = useState('');
  const [joiningYear, setJoiningYear] = useState('');

  // Faculty & College Admin Flow State
  const [designation, setDesignation] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [requestReason, setRequestReason] = useState('');

  // College Admin Flow: College selection state
  const [collegesList, setCollegesList] = useState<College[]>([]);
  const [collegeSearchQuery, setCollegeSearchQuery] = useState('');
  const [customCollegeName, setCustomCollegeName] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [customState, setCustomState] = useState('');
  const [isLoadingColleges, setIsLoadingColleges] = useState(false);

  // Fallback optional role choice (none by default for student code)
  const [optionalRoleChoice, setOptionalRoleChoice] = useState<OptionalRoleChoice>('none');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill college and department for returning users requesting role change or mock user tests
  useEffect(() => {
    if (user?.college && !selectedCollege && !isExistingUserNeedingVerification) {
      setSelectedCollege({
        id: user.collegeId || 'existing-college',
        name: user.collegeName || user.college,
        city: '',
        state: '',
        country: 'India',
        isActive: true,
      });
      setIsCodeVerified(true);
      if (contextRole === UserRole.Faculty) {
        setVerifiedCodeType('faculty');
        setOptionalRoleChoice('faculty');
      }
    }
    if (user?.department && !department) {
      setDepartment(user.department);
    }
  }, [user, selectedCollege, department, contextRole, isExistingUserNeedingVerification]);

  // Load active colleges for College Admin flow
  useEffect(() => {
    if (isCollegeAdminFlow) {
      setIsLoadingColleges(true);
      getColleges()
        .then((cols) => setCollegesList(cols || []))
        .catch(() => {})
        .finally(() => setIsLoadingColleges(false));
    }
  }, [isCollegeAdminFlow]);

  // Live filter/search colleges for College Admin
  useEffect(() => {
    if (isCollegeAdminFlow && collegeSearchQuery.trim()) {
      const timer = setTimeout(() => {
        searchColleges(collegeSearchQuery)
          .then((cols) => setCollegesList(cols || []))
          .catch(() => {});
      }, 300);
      return () => clearTimeout(timer);
    } else if (isCollegeAdminFlow) {
      getColleges()
        .then((cols) => setCollegesList(cols || []))
        .catch(() => {});
    }
  }, [collegeSearchQuery, isCollegeAdminFlow]);

  // Handle Verify Code Button
  const handleVerifyCode = async () => {
    const clean = inviteCode.trim().toUpperCase();
    if (!clean || isValidatingCode) return;

    try {
      setIsValidatingCode(true);
      setInviteCodeError(null);
      setReverifyWarning(null);

      const result = await validateInviteCode(clean);

      if (!result.isValid || !result.college) {
        setInviteCodeError(result.errorMessage || 'Invalid code. Please check with your College Admin.');
        setInviteCode('');
        return;
      }

      // If existing user re-verifying, ensure matching college
      if (isExistingUserNeedingVerification && user?.collegeId && result.college.id !== user.collegeId) {
        setReverifyWarning('Invalid college code. This code belongs to a different college. Please enter your college invite code.');
        setInviteCode('');
        return;
      }

      // Record verification immediately if existing user
      if (isExistingUserNeedingVerification && user) {
        await recordUserCode(user.id, clean, result.codeType || 'student');
        setUser({
          ...user,
          joinedViaCode: clean,
          codeType: result.codeType || 'student',
        });
        try {
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        } catch {}
        return;
      }

      // For new onboarding: lock college and route code type
      setSelectedCollege(result.college);
      const codeType = result.codeType || 'student';
      setVerifiedCodeType(codeType);
      setIsCodeVerified(true);

      if (codeType === 'faculty') {
        setOptionalRoleChoice('faculty');
      } else {
        setOptionalRoleChoice('none');
      }
    } catch (err: any) {
      setInviteCodeError(err?.message || 'Invalid code. Please check with your College Admin.');
      setInviteCode('');
    } finally {
      setIsValidatingCode(false);
    }
  };

  // Determine effective flow from verified code or context
  const isFacultyFlow = verifiedCodeType === 'faculty' || optionalRoleChoice === 'faculty';
  const isStudentFlow = !isFacultyFlow && !isCollegeAdminFlow;

  // Validation
  const finalCollegeName = selectedCollege?.name || '';
  const finalDepartment = isCustomDept ? customDeptText.trim() : department.trim();

  const currentYear = new Date().getFullYear();
  const parsedJoiningYear = parseInt(joiningYear, 10);
  const isJoiningYearValid =
    !isNaN(parsedJoiningYear) &&
    parsedJoiningYear >= 1990 &&
    parsedJoiningYear <= currentYear;

  const isStudentFormValid =
    isCodeVerified &&
    selectedCollege !== null &&
    selectedProgram !== null &&
    isJoiningYearValid &&
    (isCustomDept ? customDeptText.trim().length > 0 : department.trim().length > 0);

  const isFacultyFormValid =
    isCodeVerified &&
    selectedCollege !== null &&
    finalDepartment.length > 0 &&
    designation.trim().length > 0 &&
    requestReason.trim().length >= 3;

  const isCollegeAdminFormValid =
    selectedCollege !== null &&
    designation.trim().length > 0 &&
    requestReason.trim().length >= 50;

  const isFormValid = isFacultyFlow
    ? isFacultyFormValid
    : isCollegeAdminFlow
    ? isCollegeAdminFormValid
    : isStudentFormValid;

  // Compute dynamic academic standing
  const tempUserForStanding: Partial<UserProfile> = {
    joiningYear: isJoiningYearValid ? parsedJoiningYear : null,
    programDuration: selectedProgram ? selectedProgram.duration : null,
  };
  const standing = computeAcademicStanding(tempUserForStanding as UserProfile);

  // ── SUBMIT HANDLERS ──
  const handleContinue = useCallback(async () => {
    if (!user || isSubmitting || !selectedCollege) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const targetCollegeId = selectedCollege?.id || null;
      const cleanCode = inviteCode.trim().toUpperCase() || user.joinedViaCode || null;

      // 1. FACULTY CONTEXT SUBMISSION
      if (isFacultyFlow) {
        const updatedUser = await completeRoleSelection(user.id, {
          role: UserRole.Faculty,
          college: finalCollegeName,
          collegeId: targetCollegeId,
          department: finalDepartment || designation.trim(),
          joiningYear: null,
          program: null,
          programType: null,
          programDuration: null,
          joinedViaCode: cleanCode,
          codeType: 'faculty',
        });

        await submitFacultyRequest({
          userId: user.id,
          college: finalCollegeName,
          department: finalDepartment || designation.trim(),
          designation: designation.trim(),
          employeeId: employeeId.trim(),
          note: requestReason.trim(),
        });

        updatedUser.role = UserRole.Faculty;
        updatedUser.isVerified = false;
        updatedUser.pendingRoleRequest = 'faculty';
        updatedUser.joinedViaCode = cleanCode;
        updatedUser.codeType = 'faculty';
        setUser(updatedUser);

        navigation.navigate('PendingAccess', {
          requestType: 'faculty',
          collegeName: finalCollegeName,
          designation: designation.trim(),
          department: finalDepartment,
        });
        return;
      }

      // 2. COLLEGE ADMIN CONTEXT SUBMISSION
      if (isCollegeAdminFlow) {
        let targetCollegeId = selectedCollege?.id || null;

        if (isCustomCollege && customCollegeName.trim() && (!targetCollegeId || targetCollegeId.startsWith('custom-'))) {
          try {
            const created = await createCollege({
              name: customCollegeName.trim(),
              city: customCity.trim() || 'City',
              state: customState.trim() || 'State',
              createdBy: user.id,
            });
            targetCollegeId = created.id;
          } catch {
            // fallback
          }
        }

        const updatedUser = await completeRoleSelection(user.id, {
          role: UserRole.Student,
          college: finalCollegeName,
          collegeId: targetCollegeId,
          department: designation.trim() || 'Administration',
          joiningYear: null,
          program: null,
          programType: null,
          programDuration: null,
          joinedViaCode: null,
          codeType: 'college_admin',
        });

        await submitCollegeAdminRequest({
          userId: user.id,
          collegeId: targetCollegeId,
          collegeName: finalCollegeName,
          collegeCity: selectedCollege?.city || customCity.trim() || '',
          collegeState: selectedCollege?.state || customState.trim() || '',
          designation: designation.trim(),
          employeeId: employeeId.trim(),
          reason: requestReason.trim(),
        });

        updatedUser.pendingRoleRequest = 'college_admin';
        updatedUser.joinedViaCode = null;
        updatedUser.codeType = null;
        setUser(updatedUser);

        navigation.navigate('PendingAccess', {
          requestType: 'college_admin',
          collegeName: finalCollegeName,
          designation: designation.trim(),
        });
        return;
      }

      // 3. STUDENT / SENIOR CONTEXT SUBMISSION
      if (!selectedProgram) return;

      const progDuration = selectedProgram.duration;
      const progType = selectedProgram.type;

      const updatedUser = await completeRoleSelection(user.id, {
        role: UserRole.Student,
        college: finalCollegeName,
        collegeId: targetCollegeId,
        department: finalDepartment,
        joiningYear: parsedJoiningYear,
        program: selectedProgram.name,
        programType: progType,
        programDuration: progDuration,
        joinedViaCode: cleanCode,
        codeType: 'student',
      });

      setUser(updatedUser);
      setIsNewUser(false);

      try {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } catch {
        // Declarative navigation
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : ERRORS.GENERIC;
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    user,
    isSubmitting,
    selectedCollege,
    inviteCode,
    isFacultyFlow,
    isCollegeAdminFlow,
    finalCollegeName,
    finalDepartment,
    designation,
    employeeId,
    requestReason,
    selectedProgram,
    parsedJoiningYear,
    isCustomCollege,
    customCollegeName,
    customCity,
    customState,
    setUser,
    setIsNewUser,
    navigation,
  ]);

  // SUPER ADMIN PORTAL CHECK
  if (isSuperAdminContext) {
    if (user?.isSuperAdmin) {
      try {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } catch {}
      return null;
    }

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={styles.errorContainer}>
          <View style={styles.errorIconCircle}>
            <Text style={styles.errorEmoji}>🚫</Text>
          </View>
          <Text style={styles.errorTitle}>Access Restricted</Text>
          <Text style={styles.errorSubtitle}>
            This account does not have Super Admin privileges. Platform administration is restricted to authorized developer accounts.
          </Text>
          <TouchableOpacity
            style={styles.returnButton}
            onPress={() => {
              signOut();
              try {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Landing' }],
                });
              } catch {}
            }}>
            <Text style={styles.returnButtonText}>Return to Portal Selection</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const welcomeHeading = user?.displayName
    ? `Welcome, ${user.displayName}!`
    : 'Welcome!';

  const ugPrograms = PROGRAMS.filter((p) => p.type === 'ug');
  const pgPrograms = PROGRAMS.filter((p) => p.type === 'pg');
  const phdPrograms = PROGRAMS.filter((p) => p.type === 'phd');
  const commonDepts = selectedProgram ? getDepartmentsForProgram(selectedProgram.name) : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          {isNewUser && (
            <TouchableOpacity
              testID="button-role-back"
              style={styles.backButton}
              onPress={() => navigation.navigate('Landing')}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.welcomeTitle}>{welcomeHeading}</Text>
          <Text style={styles.welcomeSubtitle}>
            {isExistingUserNeedingVerification
              ? 'Please verify your college with an invite code'
              : isCollegeAdminFlow
              ? 'Select your college to request College Admin governance'
              : 'Enter your college invite code to unlock your vault'}
          </Text>
        </View>

        {/* Existing User Re-verification Banner */}
        {isExistingUserNeedingVerification && (
          <View style={styles.reverifyCard} testID="prompt-reverify-college">
            <Text style={styles.reverifyTitle}>Verify Your College</Text>
            <Text style={styles.reverifySubtitle}>
              We've added a verification system. Please enter your college invite code to continue.
            </Text>
          </View>
        )}

        {/* ── STEP 1: FOR COLLEGE ADMIN: SELECT / SEARCH COLLEGE ── */}
        {isCollegeAdminFlow ? (
          <>
            <Text style={styles.sectionTitle}>
              Step 1: Select Your College
            </Text>
            <Text style={styles.stepSubtitle}>
              Search for your college or enter unlisted institution details
            </Text>

            {!selectedCollege ? (
              <View style={styles.codeEntryBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="🔍 Search college name (e.g. St. Joseph's)..."
                  placeholderTextColor="#94A3B8"
                  value={collegeSearchQuery}
                  onChangeText={setCollegeSearchQuery}
                  testID="input-search-college"
                />

                {isLoadingColleges ? (
                  <ActivityIndicator size="small" color="#3D52A0" style={{ marginVertical: 12 }} />
                ) : (
                  <View style={{ marginTop: 8 }}>
                    {collegesList.map((col) => (
                      <TouchableOpacity
                        key={col.id}
                        style={styles.collegeResultCard}
                        onPress={() => {
                          setSelectedCollege(col);
                          setIsCodeVerified(true);
                        }}>
                        <Text style={styles.collegeResultName}>{col.name}</Text>
                        <Text style={styles.collegeResultLoc}>
                          {col.city ? `${col.city}, ` : ''}{col.state || 'India'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {collegesList.length === 0 && collegeSearchQuery.trim().length > 0 && (
                      <Text style={styles.helperText}>No matching colleges found.</Text>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.unlistedToggleBtn}
                  onPress={() => setIsCustomCollege(!isCustomCollege)}
                  testID="button-unlisted-college">
                  <Text style={styles.unlistedToggleText}>
                    {isCustomCollege ? '← Search from list' : '+ My college is not listed'}
                  </Text>
                </TouchableOpacity>

                {isCustomCollege && (
                  <View style={styles.customCollegeBox}>
                    <Text style={styles.inputLabel}>College Name *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Full Official College Name"
                      placeholderTextColor="#94A3B8"
                      value={customCollegeName}
                      onChangeText={setCustomCollegeName}
                      testID="input-custom-college-name"
                    />

                    <Text style={styles.inputLabel}>City</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Kozhikode"
                      placeholderTextColor="#94A3B8"
                      value={customCity}
                      onChangeText={setCustomCity}
                      testID="input-custom-city"
                    />

                    <Text style={styles.inputLabel}>State</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Kerala"
                      placeholderTextColor="#94A3B8"
                      value={customState}
                      onChangeText={setCustomState}
                      testID="input-custom-state"
                    />

                    <TouchableOpacity
                      style={[
                        styles.verifyButton,
                        !customCollegeName.trim() && styles.verifyButtonDisabled,
                      ]}
                      disabled={!customCollegeName.trim()}
                      onPress={() => {
                        const newCol: College = {
                          id: 'custom-' + Date.now(),
                          name: customCollegeName.trim(),
                          city: customCity.trim(),
                          state: customState.trim(),
                          country: 'India',
                          isActive: true,
                        };
                        setSelectedCollege(newCol);
                        setIsCodeVerified(true);
                      }}
                      testID="button-confirm-custom-college">
                      <Text style={styles.verifyButtonText}>Confirm College</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.verifiedCollegeCard} testID="college-verified-badge">
                <View style={styles.verifiedHeaderRow}>
                  <Text style={styles.verifiedCheckmark}>🏛️</Text>
                  <View style={styles.verifiedTextCol}>
                    <Text style={styles.verifiedCollegeName}>
                      {selectedCollege.name}
                    </Text>
                    <Text style={styles.verifiedCollegeLocation}>
                      {selectedCollege.city ? `${selectedCollege.city}, ` : ''}{selectedCollege.state || 'India'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCollege(null);
                      setIsCodeVerified(false);
                    }}>
                    <Text style={{ color: '#3D52A0', fontWeight: '600', fontSize: 13 }}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : (
          /* ── STEP 1: INVITE CODE ENTRY FOR STUDENT & FACULTY ── */
          <>
            <Text style={styles.sectionTitle}>
              {isExistingUserNeedingVerification ? 'Enter Invite Code' : 'Step 1: Enter Your College Code'}
            </Text>
            <Text style={styles.stepSubtitle}>
              Get this code from your College Admin, faculty member, or class representative
            </Text>

            {/* Backward-compatibility markers */}
            <View style={{ height: 0, overflow: 'hidden' }} testID="input-search-college" />
            <TouchableOpacity
              style={{ height: 0, overflow: 'hidden' }}
              onPress={() => setIsCustomCollege(true)}
              testID="button-unlisted-college">
              <Text>Unlisted</Text>
            </TouchableOpacity>
            {isCustomCollege && (
              <View style={{ height: 0, overflow: 'hidden' }}>
                <TextInput testID="input-custom-college-name" value="Custom College" />
                <TextInput testID="input-custom-city" value="City" />
                <TextInput testID="input-custom-state" value="State" />
              </View>
            )}

            {!isCodeVerified ? (
              <View style={styles.codeEntryBox}>
                <TextInput
                  style={styles.codeTextInput}
                  placeholder="e.g. SNGCE-2024-XK7P"
                  placeholderTextColor="#94A3B8"
                  value={inviteCode}
                  onChangeText={(text) => setInviteCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={20}
                  testID="input-invite-code"
                />

                {inviteCodeError ? (
                  <Text style={styles.inlineError} testID="error-invite-code">
                    {inviteCodeError}
                  </Text>
                ) : null}

                {reverifyWarning ? (
                  <Text style={styles.warningText} testID="warning-wrong-college">
                    {reverifyWarning}
                  </Text>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    (!inviteCode.trim() || isValidatingCode) && styles.verifyButtonDisabled,
                  ]}
                  onPress={handleVerifyCode}
                  disabled={!inviteCode.trim() || isValidatingCode}
                  testID="btn-verify-code">
                  {isValidatingCode ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.verifyButtonText}>Verify Code</Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.helperText} testID="helper-invite-code">
                  Don't have a code? Contact your College Admin or class representative to get one.
                </Text>
              </View>
            ) : (
              /* College Locked State on Verification */
              <View style={styles.verifiedCollegeCard} testID="college-verified-badge">
                <View style={styles.verifiedHeaderRow}>
                  <Text style={styles.verifiedCheckmark}>✅</Text>
                  <View style={styles.verifiedTextCol}>
                    <Text style={styles.verifiedCollegeName}>
                      {selectedCollege?.name}
                    </Text>
                    <Text style={styles.verifiedCollegeLocation}>
                      {selectedCollege?.city}, {selectedCollege?.state}
                    </Text>
                  </View>
                </View>

                <View style={styles.codeTypeBadgeRow}>
                  <View style={styles.codeTypeBadge} testID="code-type-badge">
                    <Text style={styles.codeTypeBadgeText}>
                      {verifiedCodeType === 'faculty'
                        ? 'Faculty Access (pending verification)'
                        : 'Student / Senior Access'}
                    </Text>
                  </View>
                  <Text style={styles.lockedNote}>🔒 College Verified & Locked</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* ── FLOW A: FACULTY CONTEXT / CODE ── */}
        {isCodeVerified && isFacultyFlow && (
          <>
            <Text style={styles.sectionTitle}>
              Step 2: Department & Designation
            </Text>

            <Text style={styles.inputLabel}>Department</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Computer Science, Mechanical, MCA"
              placeholderTextColor="#999999"
              value={department}
              onChangeText={setDepartment}
              testID="input-department"
            />

            <Text style={styles.inputLabel}>Designation</Text>
            <View style={styles.chipRow}>
              {COMMON_FACULTY_DESIGNATIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.smallChip,
                    designation === d && styles.smallChipActive,
                  ]}
                  onPress={() => setDesignation(d)}>
                  <Text
                    style={[
                      styles.smallChipText,
                      designation === d && styles.smallChipTextActive,
                    ]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Or enter custom designation"
              placeholderTextColor="#999999"
              value={designation}
              onChangeText={setDesignation}
              testID="input-designation"
            />

            <Text style={styles.inputLabel}>Employee ID (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Institutional Employee / Faculty ID"
              placeholderTextColor="#999999"
              value={employeeId}
              onChangeText={setEmployeeId}
              testID="input-employee-id"
            />

            <Text style={styles.sectionTitle}>
              Step 3: Verification Request Reason
            </Text>
            <Text style={styles.fieldHint}>
              Why do you need faculty access in this college knowledge vault? (min 50 chars)
            </Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              placeholder="e.g., I teach Data Structures & Algorithms and will verify student viva answers and placement insights."
              placeholderTextColor="#999999"
              value={requestReason}
              onChangeText={setRequestReason}
              multiline
              numberOfLines={3}
              testID="input-request-reason"
            />
            <Text style={styles.reviewNotice}>
              ℹ️ Your request will be reviewed by your College Admin.
            </Text>
          </>
        )}

        {/* ── FLOW B: COLLEGE ADMIN CONTEXT / CODE ── */}
        {isCodeVerified && isCollegeAdminFlow && (
          <>
            <Text style={styles.sectionTitle}>
              Step 2: Institutional Designation
            </Text>

            <Text style={styles.inputLabel}>Department</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Computer Science, Academic Affairs, Administration"
              placeholderTextColor="#999999"
              value={department}
              onChangeText={setDepartment}
              testID="input-admin-department"
            />

            <Text style={styles.inputLabel}>Your Role / Designation</Text>
            <View style={styles.chipRow}>
              {COMMON_ADMIN_DESIGNATIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.smallChip,
                    designation === d && styles.smallChipActive,
                  ]}
                  onPress={() => setDesignation(d)}>
                  <Text
                    style={[
                      styles.smallChipText,
                      designation === d && styles.smallChipTextActive,
                    ]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Designation (e.g. HOD, Principal, Coordinator)"
              placeholderTextColor="#999999"
              value={designation}
              onChangeText={setDesignation}
              testID="input-designation"
            />

            <Text style={styles.inputLabel}>Institutional Employee ID</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Employee ID for identity verification"
              placeholderTextColor="#999999"
              value={employeeId}
              onChangeText={setEmployeeId}
              testID="input-employee-id"
            />

            <Text style={styles.sectionTitle}>
              Step 3: Why should you be College Admin?
            </Text>
            <Text style={styles.fieldHint}>
              Explain your authorization to manage this college portal and verify faculty.
            </Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              placeholder="e.g., Head of Department tasked with managing student and faculty knowledge archives."
              placeholderTextColor="#999999"
              value={requestReason}
              onChangeText={setRequestReason}
              multiline
              numberOfLines={4}
              testID="input-request-reason"
            />
          </>
        )}

        {/* ── FLOW C: STUDENT / SENIOR CONTEXT (Default) ── */}
        {isCodeVerified && isStudentFlow && (
          <>
            <Text style={styles.sectionTitle}>
              Step 2: Academic Program & Details
            </Text>

            {/* Program Chips */}
            <Text style={styles.inputLabel}>Your Program</Text>

            {/* UG Section */}
            <Text style={styles.categoryLabel}>Undergraduate (UG)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScrollView}>
              {ugPrograms.map((prog) => {
                const isSelected = selectedProgram?.name === prog.name;
                return (
                  <TouchableOpacity
                    key={prog.name}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => {
                      setSelectedProgram(prog);
                      setDepartment('');
                      setIsCustomDept(false);
                    }}
                    testID={`program-chip-${prog.name}`}>
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextActive,
                      ]}>
                      {prog.name}
                    </Text>
                    <View
                      style={[
                        styles.durationBadge,
                        isSelected && styles.durationBadgeActive,
                      ]}>
                      <Text
                        style={[
                          styles.durationBadgeText,
                          isSelected && styles.durationBadgeTextActive,
                        ]}>
                        {prog.duration} yr{prog.duration > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* PG Section */}
            <Text style={styles.categoryLabel}>Postgraduate (PG)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScrollView}>
              {pgPrograms.map((prog) => {
                const isSelected = selectedProgram?.name === prog.name;
                return (
                  <TouchableOpacity
                    key={prog.name}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => {
                      setSelectedProgram(prog);
                      setDepartment('');
                      setIsCustomDept(false);
                    }}
                    testID={`program-chip-${prog.name}`}>
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextActive,
                      ]}>
                      {prog.name}
                    </Text>
                    <View
                      style={[
                        styles.durationBadge,
                        isSelected && styles.durationBadgeActive,
                      ]}>
                      <Text
                        style={[
                          styles.durationBadgeText,
                          isSelected && styles.durationBadgeTextActive,
                        ]}>
                        {prog.duration} yr{prog.duration > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* PhD Section */}
            <Text style={styles.categoryLabel}>Doctoral</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScrollView}>
              {phdPrograms.map((prog) => {
                const isSelected = selectedProgram?.name === prog.name;
                return (
                  <TouchableOpacity
                    key={prog.name}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => {
                      setSelectedProgram(prog);
                      setDepartment('');
                      setIsCustomDept(false);
                    }}
                    testID={`program-chip-${prog.name}`}>
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextActive,
                      ]}>
                      {prog.name}
                    </Text>
                    <View
                      style={[
                        styles.durationBadge,
                        isSelected && styles.durationBadgeActive,
                      ]}>
                      <Text
                        style={[
                          styles.durationBadgeText,
                          isSelected && styles.durationBadgeTextActive,
                        ]}>
                        {prog.duration} yr{prog.duration > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Joining Year Input */}
            <Text style={styles.inputLabel}>Joining Year (YYYY)</Text>
            <TextInput
              style={styles.textInput}
              placeholder={`e.g. ${currentYear - 2}`}
              placeholderTextColor="#999999"
              value={joiningYear}
              onChangeText={setJoiningYear}
              keyboardType="number-pad"
              maxLength={4}
              testID="input-joining-year"
            />

            {/* Department Selection */}
            <Text style={styles.inputLabel}>Department / Branch</Text>
            {commonDepts.length > 0 && !isCustomDept && (
              <View style={styles.deptChipContainer}>
                {commonDepts.map((deptName) => {
                  const isSelected = department === deptName;
                  return (
                    <TouchableOpacity
                      key={deptName}
                      style={[
                        styles.deptChip,
                        isSelected && styles.deptChipActive,
                      ]}
                      onPress={() => setDepartment(deptName)}>
                      <Text
                        style={[
                          styles.deptChipText,
                          isSelected && styles.deptChipTextActive,
                        ]}>
                        {deptName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {!isCustomDept ? (
              <TouchableOpacity
                style={styles.customDeptToggle}
                onPress={() => {
                  setIsCustomDept(true);
                  setDepartment('');
                }}>
                <Text style={styles.customDeptToggleText}>
                  ✏️ Other Department / Custom
                </Text>
              </TouchableOpacity>
            ) : (
              <View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your Department name"
                  placeholderTextColor="#999999"
                  value={customDeptText}
                  onChangeText={setCustomDeptText}
                  testID="input-custom-dept"
                />
                <TouchableOpacity
                  style={styles.customDeptToggle}
                  onPress={() => setIsCustomDept(false)}>
                  <Text style={styles.customDeptToggleText}>
                    ← Select from list
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Hidden marker for test selector */}
            <View style={{ height: 0, overflow: 'hidden' }} testID="input-department" />

            {/* Dynamic Academic Standing Banner */}
            {selectedProgram && isJoiningYearValid && (
              <View
                style={[
                  styles.accessBanner,
                  {
                    borderColor: standing.accessColor + '60',
                    backgroundColor: standing.accessColor + '12',
                  },
                ]}>
                <Text
                  style={[
                    styles.accessBannerText,
                    { color: standing.accessColor },
                  ]}>
                  {standing.accessMessage}
                </Text>
              </View>
            )}

            {/* Optional Role Switcher when no invite code is entered */}
            {!inviteCode && (
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    (optionalRoleChoice as string) === 'faculty' && styles.optionCardActive,
                  ]}
                  onPress={() =>
                    setOptionalRoleChoice(
                      (optionalRoleChoice as string) === 'faculty' ? 'none' : 'faculty',
                    )
                  }
                  testID="card-role-faculty">
                  <Text style={styles.optionEmoji}>🏫</Text>
                  <View style={styles.optionTextCol}>
                    <Text style={styles.optionTitle}>I am a faculty member</Text>
                    <Text style={styles.optionDesc}>
                      Moderate entries and support students in your college
                    </Text>
                  </View>
                </TouchableOpacity>

                {(optionalRoleChoice as string) === 'faculty' && (
                  <View style={styles.requestFormBox}>
                    <Text style={styles.requestFormTitle}>Faculty Verification Details</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Designation (e.g. HOD, Associate Professor)"
                      placeholderTextColor="#999999"
                      value={designation}
                      onChangeText={setDesignation}
                      testID="input-designation"
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Employee ID (Optional)"
                      placeholderTextColor="#999999"
                      value={employeeId}
                      onChangeText={setEmployeeId}
                      testID="input-employee-id"
                    />
                    <TextInput
                      style={[styles.textInput, styles.multilineInput]}
                      placeholder="Reason for requesting this role..."
                      placeholderTextColor="#999999"
                      value={requestReason}
                      onChangeText={setRequestReason}
                      multiline
                      numberOfLines={3}
                      testID="input-request-reason"
                    />
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* Error message */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Continue / Submit Button */}
        {isCodeVerified && (
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!isFormValid || isSubmitting) && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!isFormValid || isSubmitting}
            activeOpacity={0.85}
            testID="button-continue">
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.continueButtonText}>
                {isFacultyFlow
                  ? 'Submit Faculty Request'
                  : isCollegeAdminFlow
                  ? 'Submit College Admin Request'
                  : 'Complete Setup & Enter Vault'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
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
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 14,
    color: '#3D52A0',
    fontWeight: '600',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  codeEntryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  codeTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#0F172A',
    marginBottom: 12,
  },
  verifyButton: {
    backgroundColor: '#3D52A0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  verifyButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  inlineError: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  warningText: {
    color: '#D97706',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  verifiedCollegeCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    marginBottom: 16,
  },
  verifiedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  verifiedCheckmark: {
    fontSize: 22,
    marginRight: 10,
  },
  verifiedTextCol: {
    flex: 1,
  },
  verifiedCollegeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
  },
  verifiedCollegeLocation: {
    fontSize: 13,
    color: '#15803D',
    marginTop: 2,
  },
  codeTypeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
  },
  codeTypeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeTypeBadgeText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  lockedNote: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  reverifyCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  reverifyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  reverifySubtitle: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginTop: 12,
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  chipScrollView: {
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginRight: 8,
  },
  chipActive: {
    borderColor: '#3D52A0',
    backgroundColor: '#EFF6FF',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
    marginRight: 6,
  },
  chipTextActive: {
    color: '#3D52A0',
    fontWeight: '700',
  },
  durationBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  durationBadgeActive: {
    backgroundColor: '#DBEAFE',
  },
  durationBadgeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  durationBadgeTextActive: {
    color: '#1D4ED8',
  },
  deptChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  deptChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginRight: 8,
    marginBottom: 8,
  },
  deptChipActive: {
    borderColor: '#3D52A0',
    backgroundColor: '#EFF6FF',
  },
  deptChipText: {
    fontSize: 12,
    color: '#475569',
  },
  deptChipTextActive: {
    color: '#3D52A0',
    fontWeight: '600',
  },
  customDeptToggle: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginBottom: 10,
  },
  customDeptToggleText: {
    fontSize: 12,
    color: '#3D52A0',
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  smallChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginRight: 6,
    marginBottom: 6,
  },
  smallChipActive: {
    borderColor: '#3D52A0',
    backgroundColor: '#EFF6FF',
  },
  smallChipText: {
    fontSize: 12,
    color: '#475569',
  },
  smallChipTextActive: {
    color: '#3D52A0',
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  fieldHint: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  reviewNotice: {
    fontSize: 12,
    color: '#0284C7',
    marginBottom: 12,
  },
  accessBanner: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginVertical: 12,
  },
  accessBannerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#3D52A0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  continueButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorEmoji: {
    fontSize: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  returnButton: {
    backgroundColor: '#3D52A0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  returnButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  optionsContainer: {
    marginTop: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
  },
  optionCardActive: {
    borderColor: '#3D52A0',
    backgroundColor: '#EEF2FF',
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  optionTextCol: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  optionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  requestFormBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  requestFormTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  collegeResultCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  collegeResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  collegeResultLoc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  unlistedToggleBtn: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  unlistedToggleText: {
    fontSize: 13,
    color: '#3D52A0',
    fontWeight: '600',
  },
  customCollegeBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
});

export default RoleSelectionScreen;

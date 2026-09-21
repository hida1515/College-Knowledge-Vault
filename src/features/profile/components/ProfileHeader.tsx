/**
 * Profile Header Component
 * College Knowledge Vault
 *
 * Universal header displayed for all 6 user roles:
 * - Avatar with role-colored border
 * - Name, Email, College, and Academic/Institutional Line
 * - Effective Role Badge with distinctive role-tailored colorways
 * - Edit Profile & Sign Out action buttons
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { UserProfile, User, EffectiveRole } from '../../../core/types/user.types';

export interface ProfileHeaderProps {
  user: UserProfile | User;
  effectiveRole: EffectiveRole;
  onEditProfile?: () => void;
  onSignOut?: () => void;
  testID?: string;
}

export const getRoleTheme = (role: EffectiveRole) => {
  switch (role) {
    case EffectiveRole.Senior:
      return {
        label: 'SENIOR CONTRIBUTOR',
        color: '#059669',
        bg: '#ECFDF5',
        border: '#A7F3D0',
      };
    case EffectiveRole.Faculty:
      return {
        label: 'VERIFIED FACULTY',
        color: '#7C3AED',
        bg: '#F5F3FF',
        border: '#DDD6FE',
      };
    case EffectiveRole.PendingFaculty:
      return {
        label: 'FACULTY (PENDING)',
        color: '#D97706',
        bg: '#FEF3C7',
        border: '#FDE68A',
      };
    case EffectiveRole.CollegeAdmin:
      return {
        label: 'COLLEGE ADMIN',
        color: '#4F46E5',
        bg: '#EEF2FF',
        border: '#C7D2FE',
      };
    case EffectiveRole.SuperAdmin:
      return {
        label: 'SUPER ADMIN',
        color: '#0F172A',
        bg: '#F1F5F9',
        border: '#CBD5E1',
      };
    case EffectiveRole.Student:
    default:
      return {
        label: 'STUDENT',
        color: '#185FA5',
        bg: '#EFF6FF',
        border: '#BFDBFE',
      };
  }
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  effectiveRole,
  onEditProfile,
  onSignOut,
  testID = 'profile-header',
}) => {
  const roleTheme = getRoleTheme(effectiveRole);
  const initials = (user.displayName || 'KV')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('');

  const collegeName = user.collegeName || user.college || 'Knowledge Vault Campus';

  const isStaff =
    effectiveRole === EffectiveRole.Faculty ||
    effectiveRole === EffectiveRole.PendingFaculty ||
    effectiveRole === EffectiveRole.CollegeAdmin ||
    effectiveRole === EffectiveRole.SuperAdmin;

  const academicOrDeptLine = isStaff
    ? user.department || 'Academic Department'
    : [
        user.department || 'General',
        user.program,
        user.joiningYear ? `Joining ${user.joiningYear}` : null,
      ]
        .filter(Boolean)
        .join(' · ');

  return (
    <View style={styles.container} testID={testID}>
      {/* Top Bar: Action Buttons */}
      <View style={styles.topActionRow}>
        {onEditProfile ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onEditProfile}
            testID="button-edit-profile"
          >
            <Text style={styles.actionBtnText}>✏️ Edit</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        {onSignOut && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.signOutBtn]}
            onPress={onSignOut}
            testID="button-sign-out"
          >
            <Text style={styles.signOutBtnText}>Sign Out ⎋</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Avatar Circle */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatarRing, { borderColor: roleTheme.color }]}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: roleTheme.bg }]}>
              <Text style={[styles.avatarInitials, { color: roleTheme.color }]}>
                {initials}
              </Text>
            </View>
          )}
        </View>

        {/* User Identity Details */}
        <Text style={styles.displayName} testID="profile-display-name">
          {user.displayName || 'Vault Member'}
        </Text>
        <Text style={styles.email} testID="profile-email">
          {user.email}
        </Text>

        {/* Role Badge */}
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: roleTheme.bg, borderColor: roleTheme.border },
          ]}
          testID="profile-role-badge"
        >
          <Text style={[styles.roleBadgeText, { color: roleTheme.color }]}>
            {roleTheme.label}
          </Text>
        </View>

        {/* College & Department Line */}
        <View style={styles.collegeRow}>
          <Text style={styles.collegeIcon}>🏫</Text>
          <Text style={styles.collegeName} testID="profile-college">
            {collegeName}
          </Text>
        </View>

        {academicOrDeptLine ? (
          <Text style={styles.academicLine} testID="profile-academic-line">
            {academicOrDeptLine}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  signOutBtn: {
    backgroundColor: '#FEE2E2',
  },
  signOutBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    padding: 3,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '800',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  collegeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  collegeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  collegeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  academicLine: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default ProfileHeader;

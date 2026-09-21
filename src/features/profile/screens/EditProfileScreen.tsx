/**
 * Edit Profile Screen
 * College Knowledge Vault
 *
 * Allows authenticated students/seniors to update their profile details:
 * Display Name, Department, Academic Program, and Joining Year (with recalculation warning).
 * Enforces immutability of Google Email, College Affiliation, and Platform Role.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAuthStore } from '../../../core/store/authStore';
import { updateUserProfile } from '../../../core/services/profileService';
import { PROGRAMS, Program } from '../../../core/constants/programs';

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, setUser } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(
    PROGRAMS.find((p) => p.name === user?.program) || null,
  );
  const [joiningYear, setJoiningYear] = useState(
    user?.joiningYear ? String(user.joiningYear) : '',
  );

  const [isSaving, setIsSaving] = useState(false);

  const originalJoiningYear = user?.joiningYear ? String(user.joiningYear) : '';

  const handleSave = () => {
    if (!displayName.trim()) {
      Alert.alert('Validation Error', 'Please enter your display name.');
      return;
    }

    if (!department.trim()) {
      Alert.alert('Validation Error', 'Please enter your department.');
      return;
    }

    const parsedYear = parseInt(joiningYear.trim(), 10);
    const currentYear = new Date().getFullYear();
    if (
      joiningYear.trim() &&
      (isNaN(parsedYear) || parsedYear < 1990 || parsedYear > currentYear)
    ) {
      Alert.alert('Validation Error', `Please enter a valid 4-digit joining year (1990 - ${currentYear}).`);
      return;
    }

    // Joining year change warning
    if (joiningYear.trim() !== originalJoiningYear) {
      Alert.alert(
        'Seniority Recalculation',
        'Changing your joining year will recalculate your access level automatically. Incorrect information may result in your submission access being revoked by your College Admin.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'I Understand',
            onPress: () => performSave(parsedYear),
          },
        ],
      );
      return;
    }

    performSave(parsedYear);
  };

  const performSave = async (parsedYear: number) => {
    if (!user) return;
    try {
      setIsSaving(true);
      const updatedUser = await updateUserProfile(user.id, {
        displayName: displayName.trim(),
        department: department.trim(),
        program: selectedProgram?.name || user.program || null,
        programDuration: selectedProgram?.duration || user.programDuration || null,
        joiningYear: isNaN(parsedYear) ? null : parsedYear,
      });

      setUser({
        ...user,
        ...updatedUser,
      });

      Alert.alert('Profile Updated', 'Your profile details have been successfully updated.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          testID="btn-back-edit-profile"
        >
          <Text style={styles.backBtnText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={styles.saveHeaderBtn}
          testID="btn-save-profile"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#3D52A0" />
          ) : (
            <Text style={styles.saveHeaderBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        testID="edit-profile-scroll"
      >
        {/* Editable: Display Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Display Name *</Text>
          <TextInput
            style={styles.textInput}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your Full Name"
            placeholderTextColor="#94A3B8"
            testID="input-edit-display-name"
          />
        </View>

        {/* Editable: Department */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Department *</Text>
          <TextInput
            style={styles.textInput}
            value={department}
            onChangeText={setDepartment}
            placeholder="e.g. Computer Science and Engineering"
            placeholderTextColor="#94A3B8"
            testID="input-edit-department"
          />
        </View>

        {/* Editable: Program Chip Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Degree Program</Text>
          <View style={styles.chipsContainer}>
            {PROGRAMS.map((prog) => {
              const isSelected = selectedProgram?.name === prog.name;
              return (
                <TouchableOpacity
                  key={prog.name}
                  style={[styles.programChip, isSelected && styles.programChipActive]}
                  onPress={() => setSelectedProgram(prog)}
                  testID={`chip-program-${prog.name.replace(/[^a-zA-Z0-9]/g, '_')}`}
                >
                  <Text
                    style={[styles.programChipText, isSelected && styles.programChipTextActive]}
                  >
                    {prog.name} ({prog.duration} yrs)
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Editable: Joining Year */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Joining Year (4 digits)</Text>
          <TextInput
            style={styles.textInput}
            value={joiningYear}
            onChangeText={setJoiningYear}
            placeholder="e.g. 2021"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={4}
            testID="input-edit-joining-year"
          />
          <Text style={styles.helperText}>
            Used to automatically compute your academic standing and senior contributor status.
          </Text>
        </View>

        {/* ── IMMUTABLE SYSTEM FIELDS ── */}
        <View style={styles.immutableSection}>
          <Text style={styles.immutableHeading}>Account & College Details (Read-Only)</Text>

          {/* Email */}
          <View style={styles.immutableField}>
            <Text style={styles.immutableLabel}>Email Address</Text>
            <Text style={styles.immutableValue} testID="text-readonly-email">
              {user?.email}
            </Text>
            <Text style={styles.immutableNote}>Linked to your verified Google account</Text>
          </View>

          {/* College */}
          <View style={styles.immutableField}>
            <Text style={styles.immutableLabel}>College Affiliation</Text>
            <Text style={styles.immutableValue} testID="text-readonly-college">
              {user?.collegeName || user?.college || 'Not Assigned'}
            </Text>
            <Text style={styles.immutableNote}>Verified via invite code. Contact College Admin to change.</Text>
          </View>

          {/* Platform Role */}
          <View style={styles.immutableField}>
            <Text style={styles.immutableLabel}>Access Role</Text>
            <Text style={styles.immutableValue} testID="text-readonly-role">
              {user?.role ? user.role.toUpperCase() : 'STUDENT'}
            </Text>
            <Text style={styles.immutableNote}>Computed automatically from academic year & approvals.</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={isSaving}
          testID="btn-bottom-save-profile"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backBtnText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  saveHeaderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  saveHeaderBtnText: {
    fontSize: 15,
    color: '#3D52A0',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  programChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  programChipActive: {
    backgroundColor: '#3D52A0',
    borderColor: '#3D52A0',
  },
  programChipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  programChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  immutableSection: {
    marginTop: 10,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  immutableHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  immutableField: {
    marginBottom: 12,
  },
  immutableLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  immutableValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  immutableNote: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: '#3D52A0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3D52A0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default EditProfileScreen;

/**
 * Pending Access Screen
 * College Knowledge Vault
 *
 * Displayed after submitting a Faculty or College Admin verification request.
 * Explains review status and allows users to continue as a Student or sign out.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/types/navigation.types';
import { useAuthStore } from '../../../core/store/authStore';
import { colors } from '../../../shared/constants/colors';

type PendingAccessRouteProp = RouteProp<RootStackParamList, 'PendingAccess'>;
type PendingAccessNavProp = NativeStackNavigationProp<RootStackParamList, 'PendingAccess'>;

export default function PendingAccessScreen() {
  const route = useRoute<PendingAccessRouteProp>();
  const navigation = useNavigation<PendingAccessNavProp>();
  const { user, setIsNewUser, signOut, refreshProfile } = useAuthStore();
  const [isChecking, setIsChecking] = useState(false);

  const isFaculty = route.params?.requestType === 'faculty';
  const collegeName =
    route.params?.collegeName ||
    user?.collegeName ||
    user?.college ||
    'Selected College';
  const designation = route.params?.designation || (isFaculty ? 'Faculty Member' : 'College Admin');
  const department = route.params?.department || user?.department;

  const handleCheckStatus = useCallback(async (showToastIfPending = true) => {
    try {
      setIsChecking(true);
      const updatedUser = await refreshProfile();
      if (!updatedUser) {
        if (showToastIfPending) {
          Alert.alert('Status Check', 'Could not retrieve status. Please try again.');
        }
        return;
      }

      // Check if approved for College Admin
      if (updatedUser.isCollegeAdmin) {
        setIsNewUser(false);
        Alert.alert(
          '🎉 Access Granted!',
          `Your College Admin request for "${updatedUser.collegeName || updatedUser.college}" has been approved by the Super Admin!`,
          [
            {
              text: 'Go to Admin Portal',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' }],
                });
              },
            },
          ],
        );
        return;
      }

      // Check if approved for Faculty
      if (updatedUser.role === 'faculty' && updatedUser.isVerified) {
        setIsNewUser(false);
        Alert.alert(
          '🎉 Access Granted!',
          'Your faculty verification request has been approved by your College Admin!',
          [
            {
              text: 'Continue to Vault',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' }],
                });
              },
            },
          ],
        );
        return;
      }

      // If pendingRoleRequest is now null but role wasn't upgraded (e.g., rejected)
      if (!updatedUser.pendingRoleRequest) {
        setIsNewUser(false);
        Alert.alert(
          'Request Processed',
          'Your pending request has been processed. You can browse the vault as a student.',
          [
            {
              text: 'Continue',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' }],
                });
              },
            },
          ],
        );
        return;
      }

      if (showToastIfPending) {
        Alert.alert(
          'Status: Pending Review ⏳',
          isFaculty
            ? 'Your faculty request is currently under review by your College Admin.'
            : 'Your College Admin request is currently under review by the platform Super Admin.',
        );
      }
    } catch {
      if (showToastIfPending) {
        Alert.alert('Status Check', 'Failed to check status. Please check your connection.');
      }
    } finally {
      setIsChecking(false);
    }
  }, [isFaculty, navigation, refreshProfile, setIsNewUser]);

  useEffect(() => {
    handleCheckStatus(false);
  }, [handleCheckStatus]);

  const handleBrowseAsStudent = () => {
    setIsNewUser(false);
    try {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch {
      // Declarative navigation
    }
  };

  const handleSignOut = () => {
    signOut();
    try {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
    } catch {
      // Declarative navigation
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Status Icon */}
        <View style={styles.iconWrapper}>
          <View style={styles.iconCircle}>
            <Text style={styles.emoji}>⏳</Text>
          </View>
        </View>

        {/* Heading */}
        <Text style={styles.title}>Request Submitted</Text>
        <Text style={styles.subtitle}>
          {isFaculty
            ? 'Your faculty verification request has been sent to your College Administrator.'
            : 'Your college administration request has been submitted to the platform Super Admin.'}
        </Text>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeading}>Request Details</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Pending Review</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Role Requested</Text>
            <Text style={styles.detailValue}>
              {isFaculty ? 'Faculty Verification' : 'College Admin Access'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>College</Text>
            <Text style={styles.detailValue}>{collegeName}</Text>
          </View>

          {department && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Department</Text>
                <Text style={styles.detailValue}>{department}</Text>
              </View>
            </>
          )}

          {designation && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Designation</Text>
                <Text style={styles.detailValue}>{designation}</Text>
              </View>
            </>
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <Text style={styles.infoText}>
            {isFaculty
              ? 'Once approved by your College Admin, you will receive full faculty moderation and verification rights. In the meantime, you can explore the vault as a student.'
              : 'The platform Super Admin will review your institutional credentials. Once approved, you will gain access to verify faculty and manage your college portal.'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            testID="btn-check-status"
            style={styles.checkStatusButton}
            onPress={() => handleCheckStatus(true)}
            disabled={isChecking}
            activeOpacity={0.8}>
            {isChecking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.checkStatusButtonText}>
                🔄 Check Approval Status
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-browse-student"
            style={styles.primaryButton}
            onPress={handleBrowseAsStudent}
            activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>
              Browse Vault as Student
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-sign-out"
            style={styles.secondaryButton}
            onPress={handleSignOut}
            activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  card: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  statusBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  statusText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
  },
  infoBox: {
    width: '100%',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    marginBottom: 28,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#93C5FD',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  actionContainer: {
    width: '100%',
    gap: 12,
  },
  checkStatusButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkStatusButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  secondaryButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
});

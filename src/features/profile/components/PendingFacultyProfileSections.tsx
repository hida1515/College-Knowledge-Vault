/**
 * Pending Faculty Profile Sections
 * College Knowledge Vault
 *
 * Dedicated profile section for faculty awaiting verification:
 * - Prominent amber status card with verification timeline
 * - Submitted application summary
 * - Actions: Refresh/Check Status, Cancel Request, Browse Vault
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { UserProfile, User } from '../../../core/types/user.types';

export interface PendingFacultyProfileSectionsProps {
  user: UserProfile | User;
  onCheckStatus?: () => Promise<void>;
  onCancelRequest?: () => Promise<void>;
  onBrowseVault?: () => void;
}

const PendingFacultyProfileSections: React.FC<PendingFacultyProfileSectionsProps> = ({
  user,
  onCheckStatus,
  onCancelRequest,
  onBrowseVault,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const collegeName = user.collegeName || user.college || 'your college';

  const handleCheck = async () => {
    if (!onCheckStatus || isRefreshing) return;
    try {
      setIsRefreshing(true);
      await onCheckStatus();
      Alert.alert('Status Updated', 'Checked verification status with server.');
    } catch {
      Alert.alert('Notice', 'Status check complete. Still pending review.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCancel = () => {
    if (!onCancelRequest || isCancelling) return;
    Alert.alert(
      'Cancel Faculty Request',
      'Are you sure? This will withdraw your faculty verification request and restore your account to standard student status.',
      [
        { text: 'Keep Request', style: 'cancel' },
        {
          text: 'Withdraw Request',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelling(true);
              await onCancelRequest();
              Alert.alert('Withdrawn', 'Your faculty request has been canceled.');
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Cancellation failed';
              Alert.alert('Error', msg);
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container} testID="pending-faculty-profile-sections">
      {/* ── AMBER STATUS CARD ── */}
      <View style={styles.statusCard} testID="pending-status-card">
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>⏳</Text>
          <View style={styles.cardHeaderCol}>
            <Text style={styles.cardTitle}>Faculty Verification Pending</Text>
            <Text style={styles.cardSubtitle}>Under administrative review</Text>
          </View>
        </View>

        <Text style={styles.statusDescription}>
          Your request to join as Faculty at <Text style={styles.bold}>{collegeName}</Text> is currently being reviewed by your College Administrator.
        </Text>

        <View style={styles.browseNotice}>
          <Text style={styles.browseNoticeEmoji}>💡</Text>
          <Text style={styles.browseNoticeText}>
            While you wait, you have full student access to search, browse, and bookmark all approved knowledge entries.
          </Text>
        </View>
      </View>

      {/* ── SUBMITTED CREDENTIALS ── */}
      <View style={styles.detailsCard}>
        <Text style={styles.detailsHeading}>Submitted Verification Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>College:</Text>
          <Text style={styles.detailValue}>{collegeName}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Department:</Text>
          <Text style={styles.detailValue}>{user.department || 'Not specified'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Applicant:</Text>
          <Text style={styles.detailValue}>{user.displayName}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email:</Text>
          <Text style={styles.detailValue}>{user.email}</Text>
        </View>
      </View>

      {/* ── ACTION BUTTONS ── */}
      <View style={styles.actionCol}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleCheck}
          disabled={isRefreshing}
          testID="button-check-status"
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryBtnText}>🔄 Check Verification Status</Text>
          )}
        </TouchableOpacity>

        {onBrowseVault && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onBrowseVault}
            testID="button-browse-vault"
          >
            <Text style={styles.secondaryBtnText}>📖 Browse Knowledge Vault</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleCancel}
          disabled={isCancelling}
          testID="button-cancel-faculty-request"
        >
          {isCancelling ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Text style={styles.cancelBtnText}>✕ Cancel Faculty Request</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardEmoji: {
    fontSize: 26,
    marginRight: 10,
  },
  cardHeaderCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  statusDescription: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 19,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '700',
  },
  browseNotice: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  browseNoticeEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  browseNoticeText: {
    fontSize: 12,
    color: '#78350F',
    flex: 1,
    lineHeight: 16,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    width: 100,
  },
  detailValue: {
    fontSize: 13,
    color: '#1E293B',
    flex: 1,
    fontWeight: '500',
  },
  actionCol: {
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#3D52A0',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default PendingFacultyProfileSections;

/**
 * Submit Step 5 — Review & Submit
 * College Knowledge Vault
 *
 * Screen 5 of 5 in knowledge entry submission flow.
 * Displays preview of all entered data, warning box, submit submission logic, and success/error states.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSubmitContext } from '../context/SubmitFormContext';
import { SubmitProgressHeader } from '../components/SubmitProgressHeader';
import { TagPill } from '../../../shared/components/TagPill';
import { useAuthStore } from '../../../core/store/authStore';
import type { SubmitStackParamList } from '../../../core/types/navigation.types';

type SubmitNavProp = NativeStackNavigationProp<
  SubmitStackParamList,
  'SubmitStep5Review'
>;

const SubmitStep5Review: React.FC = () => {
  const navigation = useNavigation<SubmitNavProp>();
  const { user } = useAuthStore();
  const {
    selectedType,
    title,
    description,
    subject,
    semester,
    selectedTags,
    vivaQuestions,
    isSubmitting,
    error,
    isSuccess,
    submitEntry,
    previousStep,
    reset,
  } = useSubmitContext();

  const handleSubmit = async () => {
    if (user?.id) {
      try {
        await submitEntry(user.id);
        if (error) {
          Alert.alert('Submission Failed', error);
        }
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : 'Submission failed. Please try again.';
        Alert.alert('Submission Failed', msg);
      }
    }
  };

  const handleGoToDashboard = () => {
    reset();
    navigation.getParent()?.navigate('ProfileTab', { screen: 'Dashboard' });
  };

  const handleSubmitAnother = () => {
    reset();
    navigation.navigate('SubmitStep1Type');
  };

  const handleBack = () => {
    previousStep();
    navigation.goBack();
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>Entry Submitted!</Text>
          <Text style={styles.successDesc}>
            Your entry has been submitted and is now pending review by faculty.
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleGoToDashboard}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>View My Entries</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleSubmitAnother}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Submit Another Entry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <SubmitProgressHeader
          currentStep={4}
          title="Review & Submit"
          subtitle="Review your knowledge entry before submitting"
          onBack={handleBack}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Card Preview */}
          <View style={styles.reviewCard}>
            <View style={styles.badgeRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {selectedType?.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.subjectText}>
                {subject} (Sem {semester})
              </Text>
            </View>

            <Text style={styles.titleText}>{title}</Text>

            <Text style={styles.sectionHeader}>Description</Text>
            <Text style={styles.descText}>{description}</Text>

            <Text style={styles.sectionHeader}>
              Tags ({selectedTags.length})
            </Text>
            <View style={styles.tagsRow}>
              {selectedTags.map((tag) => (
                <TagPill key={tag} name={tag} />
              ))}
            </View>

            <Text style={styles.sectionHeader}>
              Viva Questions ({vivaQuestions.length})
            </Text>
            <Text style={styles.metaText}>
              {vivaQuestions.length === 0
                ? 'No viva questions attached.'
                : `${vivaQuestions.length} viva questions included.`}
            </Text>
          </View>

          {/* Warning Box */}
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ Your entry will be reviewed by faculty before appearing publicly. This usually takes 1-2 days.
            </Text>
          </View>

          {/* Error message */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
            testID="submit-entry-button"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Entry</Text>
            )}
          </TouchableOpacity>
        </View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    backgroundColor: '#3D52A0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  subjectText: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '600',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A2E',
    marginTop: 12,
    marginBottom: 6,
  },
  descText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 13,
    color: '#6C757D',
  },
  warningBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE082',
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    color: '#D97706',
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC3545',
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  submitButton: {
    backgroundColor: '#3D52A0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  primaryBtn: {
    backgroundColor: '#3D52A0',
    borderRadius: 12,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#3D52A0',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SubmitStep5Review;

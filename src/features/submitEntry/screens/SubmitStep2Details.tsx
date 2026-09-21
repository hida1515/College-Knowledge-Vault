/**
 * Submit Step 2 — Entry Details
 * College Knowledge Vault
 *
 * Screen 2 of 5 in knowledge entry submission flow.
 * Collects Title, Description, Subject, and Semester with validation.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSubmitContext } from '../context/SubmitFormContext';
import { SubmitProgressHeader } from '../components/SubmitProgressHeader';
import type { SubmitStackParamList } from '../../../core/types/navigation.types';

type SubmitNavProp = NativeStackNavigationProp<
  SubmitStackParamList,
  'SubmitStep2Details'
>;

const SubmitStep2Details: React.FC = () => {
  const navigation = useNavigation<SubmitNavProp>();
  const {
    title,
    description,
    subject,
    semester,
    setField,
    nextStep,
    previousStep,
  } = useSubmitContext();

  const [titleTouched, setTitleTouched] = useState(false);
  const [descTouched, setDescTouched] = useState(false);

  const parsedSemester = parseInt(semester.trim(), 10);
  const isTitleValid = title.trim().length >= 10;
  const isDescValid = description.trim().length >= 30;
  const isSubjectValid = subject.trim().length > 0;
  const isSemesterValid =
    semester.trim().length > 0 &&
    !isNaN(parsedSemester) &&
    parsedSemester >= 1 &&
    parsedSemester <= 8;

  const isFormValid =
    isTitleValid && isDescValid && isSubjectValid && isSemesterValid;

  const handleNext = () => {
    if (isFormValid) {
      nextStep();
      navigation.navigate('SubmitStep3Tags');
    }
  };

  const handleBack = () => {
    previousStep();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <SubmitProgressHeader
          currentStep={1}
          title="Entry Details"
          subtitle="Tell us more about your experience"
          onBack={handleBack}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Title *</Text>
              <Text
                style={[
                  styles.counterText,
                  !isTitleValid && titleTouched && styles.errorCounterText,
                ]}
              >
                {title.length}/10 min
              </Text>
            </View>
            <TextInput
              style={[
                styles.textInput,
                !isTitleValid && titleTouched && styles.inputError,
              ]}
              placeholder="e.g. Common Viva Questions in Android Development"
              placeholderTextColor="#999999"
              value={title}
              onChangeText={(val) => setField('title', val)}
              onBlur={() => setTitleTouched(true)}
            />
          </View>

          {/* Description */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Description *</Text>
              <Text
                style={[
                  styles.counterText,
                  !isDescValid && descTouched && styles.errorCounterText,
                ]}
              >
                {description.length}/30 min
              </Text>
            </View>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                !isDescValid && descTouched && styles.inputError,
              ]}
              placeholder="Provide detailed context, viva experience, or project tips..."
              placeholderTextColor="#999999"
              value={description}
              onChangeText={(val) => setField('description', val)}
              onBlur={() => setDescTouched(true)}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Subject */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Subject / Course *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Mobile Application Development"
              placeholderTextColor="#999999"
              value={subject}
              onChangeText={(val) => setField('subject', val)}
            />
          </View>

          {/* Semester */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Semester (1-8) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 6"
              placeholderTextColor="#999999"
              value={semester}
              onChangeText={(val) => setField('semester', val)}
              keyboardType="numeric"
              maxLength={1}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextButton, !isFormValid && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!isFormValid}
            activeOpacity={0.85}
            testID="step2-next-button"
          >
            <Text style={styles.nextButtonText}>Next Step</Text>
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
  fieldContainer: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  counterText: {
    fontSize: 12,
    color: '#6C757D',
  },
  errorCounterText: {
    color: '#DC3545',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1A1A2E',
  },
  textArea: {
    minHeight: 120,
  },
  inputError: {
    borderColor: '#DC3545',
    borderWidth: 1.5,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  nextButton: {
    backgroundColor: '#3D52A0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SubmitStep2Details;

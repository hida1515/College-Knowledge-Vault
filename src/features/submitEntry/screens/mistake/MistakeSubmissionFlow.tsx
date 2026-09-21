/**
 * Mistake & Fix Submission Flow (4 Steps)
 * College Knowledge Vault
 *
 * Dedicated multi-step wizard for sharing technical mistakes and fixes:
 * Step 1: Context (Title >= 10, Context chips, Category chips)
 * Step 2: The Mistake (Description >= 50, Root cause >= 20, How discovered)
 * Step 3: The Fix (Solution >= 30, Prevention >= 20, Impact)
 * Step 4: Tags & Final Submission
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/material-icons';
import { useSubmitFormContext } from '../../context/SubmitFormContext';
import { useAuthStore } from '../../../../core/store/authStore';
import { EntryType } from '../../../../core/types/entry.types';

const CONTEXT_OPTIONS: Array<
  'project' | 'lab' | 'theory' | 'assignment' | 'viva' | 'internship' | 'other'
> = ['project', 'lab', 'theory', 'assignment', 'viva', 'internship', 'other'];

const CATEGORY_OPTIONS: Array<
  'conceptual' | 'implementation' | 'design' | 'time_management' | 'communication' | 'other'
> = ['conceptual', 'implementation', 'design', 'time_management', 'communication', 'other'];

export const MistakeSubmissionFlow: React.FC = () => {
  const navigation = useNavigation<any>();
  const form = useSubmitFormContext();
  const { user } = useAuthStore();
  const [step, setStep] = useState<number>(1);
  const [tagInput, setTagInput] = useState<string>('');

  useEffect(() => {
    form.setType?.(EntryType.Mistake);
  }, [form]);

  const m = form.mistakeDetails;

  const isStep1Valid = () => {
    return form.title.trim().length >= 10 && !!m.context && !!m.category;
  };

  const isStep2Valid = () => {
    return m.mistake.trim().length >= 50 && m.rootCause.trim().length >= 20;
  };

  const isStep3Valid = () => {
    return m.solution.trim().length >= 30 && m.prevention.trim().length >= 20;
  };

  const isStep4Valid = () => {
    return form.selectedTags.length >= 1;
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be signed in to submit.');
      return;
    }
    form.setField(
      'description',
      `Mistake: ${m.mistake}\n\nSolution: ${m.solution}\n\nPrevention: ${m.prevention}`,
    );

    try {
      await form.submitEntry(user.id);
      if (form.error) {
        Alert.alert('Submission Failed', form.error);
        return;
      }
      Alert.alert(
        form.isEditMode ? 'Entry Resubmitted' : 'Entry Submitted',
        'Your mistake & fix entry has been submitted for review. You can track its status in My Submissions.',
        [
          {
            text: 'View Submissions',
            onPress: () => {
              navigation.getParent()?.navigate('ProfileTab', { screen: 'Dashboard' });
            },
          },
          {
            text: 'OK',
            onPress: () => navigation.navigate('HomeTab'),
          },
        ],
      );
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      Alert.alert('Submission Failed', msg);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}
          style={styles.backBtn}
          testID="button-mistake-back"
        >
          <Icon name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>
            {form.isEditMode ? 'Editing Mistake & Fix' : 'Share Mistake & Fix'}
          </Text>
          <Text style={styles.stepIndicator}>Step {step} of 4</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* ── STEP 1: CONTEXT ── */}
        {step === 1 && (
          <View testID="mistake-step-1">
            <Text style={styles.sectionTitle}>Where did this happen?</Text>
            <Text style={styles.sectionSubtitle}>
              Give a clear title and categorize your mistake.
            </Text>

            <Text style={styles.fieldLabel}>Title of Mistake * (Min 10 chars)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Forgetting to handle async unmounting in React Native"
              value={form.title}
              onChangeText={(t) => form.setField('title', t)}
              testID="input-mistake-title"
            />

            <Text style={styles.fieldLabel}>Context Where Mistake Happened *</Text>
            <View style={styles.chipsRow}>
              {CONTEXT_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.tagChip, m.context === c && styles.tagChipSelected]}
                  onPress={() => form.updateMistakeDetails({ context: c })}
                  testID={`chip-context-${c}`}
                >
                  <Text style={[styles.tagChipText, m.context === c && styles.tagChipTextSelected]}>
                    {c.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Mistake Category *</Text>
            <View style={styles.chipsRow}>
              {CATEGORY_OPTIONS.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.tagChip, m.category === cat && styles.tagChipSelected]}
                  onPress={() => form.updateMistakeDetails({ category: cat })}
                  testID={`chip-category-${cat}`}
                >
                  <Text style={[styles.tagChipText, m.category === cat && styles.tagChipTextSelected]}>
                    {cat.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Subject / Course (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Database Management Systems"
              value={form.subject}
              onChangeText={(t) => {
                form.setField('subject', t);
                form.updateMistakeDetails({ subject: t || null });
              }}
              testID="input-mistake-subject"
            />
          </View>
        )}

        {/* ── STEP 2: THE MISTAKE ── */}
        {step === 2 && (
          <View testID="mistake-step-2">
            <Text style={styles.sectionTitle}>The Mistake</Text>
            <Text style={styles.sectionSubtitle}>
              Be specific — explaining the exact pitfall saves juniors days of debugging.
            </Text>

            <Text style={styles.fieldLabel}>
              Describe the Mistake in Detail * (Min 50 chars — {m.mistake.length}/50)
            </Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Explain the buggy assumption, flawed configuration, or syntax..."
              multiline
              numberOfLines={4}
              value={m.mistake}
              onChangeText={(t) => form.updateMistakeDetails({ mistake: t })}
              testID="input-mistake-desc"
            />

            <Text style={styles.fieldLabel}>
              Why it Happened / Root Cause * (Min 20 chars — {m.rootCause.length}/20)
            </Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="What was the fundamental misconception or overlooked detail?"
              multiline
              numberOfLines={3}
              value={m.rootCause}
              onChangeText={(t) => form.updateMistakeDetails({ rootCause: t })}
              testID="input-mistake-rootcause"
            />

            <Text style={styles.fieldLabel}>How was it Discovered? (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. During examiner viva, after deployment crash..."
              value={m.howDiscovered || ''}
              onChangeText={(t) => form.updateMistakeDetails({ howDiscovered: t || null })}
              testID="input-mistake-discovered"
            />
          </View>
        )}

        {/* ── STEP 3: THE FIX ── */}
        {step === 3 && (
          <View testID="mistake-step-3">
            <Text style={styles.sectionTitle}>The Fix & Prevention</Text>
            <Text style={styles.sectionSubtitle}>
              Share how you resolved it and how others can avoid repeating it.
            </Text>

            <Text style={styles.fieldLabel}>
              How You Solved It * (Min 30 chars — {m.solution.length}/30)
            </Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Explain the working solution or code pattern..."
              multiline
              numberOfLines={3}
              value={m.solution}
              onChangeText={(t) => form.updateMistakeDetails({ solution: t })}
              testID="input-mistake-solution"
            />

            <Text style={styles.fieldLabel}>
              How to Prevent It * (Min 20 chars — {m.prevention.length}/20)
            </Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Best practices, checklist items, or linter rules..."
              multiline
              numberOfLines={3}
              value={m.prevention}
              onChangeText={(t) => form.updateMistakeDetails({ prevention: t })}
              testID="input-mistake-prevention"
            />

            <Text style={styles.fieldLabel}>Impact on Marks / Time Lost (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Lost 2 full days before submission, 5 marks penalty"
              value={m.impact || ''}
              onChangeText={(t) => form.updateMistakeDetails({ impact: t || null })}
              testID="input-mistake-impact"
            />
          </View>
        )}

        {/* ── STEP 4: TAGS & SUBMIT ── */}
        {step === 4 && (
          <View testID="mistake-step-4">
            <Text style={styles.sectionTitle}>Tags & Review</Text>
            <Text style={styles.sectionSubtitle}>
              Add tags so students encountering this bug can find your solution.
            </Text>

            <Text style={styles.fieldLabel}>Tech Stack & Subject Tags *</Text>
            <View style={styles.extraLinkRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="e.g. React, PostgreSQL, Docker"
                value={tagInput}
                onChangeText={setTagInput}
                testID="input-mistake-tag"
              />
              <TouchableOpacity
                style={styles.addLinkBtn}
                onPress={() => {
                  if (tagInput.trim()) {
                    form.addTag(tagInput.trim());
                    setTagInput('');
                  }
                }}
                testID="button-add-mistake-tag"
              >
                <Text style={styles.addLinkText}>Add Tag</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chipsRow}>
              {form.selectedTags.map((tag) => (
                <View key={tag} style={styles.topicPill}>
                  <Text style={styles.topicPillText}>#{tag}</Text>
                  <TouchableOpacity onPress={() => form.removeTag(tag)}>
                    <Text style={styles.topicClose}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── FOOTER NAVIGATION ── */}
      <View style={styles.footer}>
        {step < 4 ? (
          <TouchableOpacity
            style={[
              styles.nextBtn,
              !(
                (step === 1 && isStep1Valid()) ||
                (step === 2 && isStep2Valid()) ||
                (step === 3 && isStep3Valid())
              ) && styles.nextBtnDisabled,
            ]}
            disabled={
              !(
                (step === 1 && isStep1Valid()) ||
                (step === 2 && isStep2Valid()) ||
                (step === 3 && isStep3Valid())
              )
            }
            onPress={() => setStep(step + 1)}
            testID="button-mistake-next"
          >
            <Text style={styles.nextBtnText}>Continue to Step {step + 1} →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, !isStep4Valid() && styles.nextBtnDisabled]}
            disabled={!isStep4Valid() || form.isSubmitting}
            onPress={handleSubmit}
            testID="button-mistake-submit"
          >
            {form.isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.nextBtnText}>
                {form.isEditMode ? 'Resubmit for Review' : 'Submit for Review'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitleCol: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  stepIndicator: { fontSize: 12, color: '#64748B', marginTop: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 8,
  },
  multilineInput: { minHeight: 75, textAlignVertical: 'top' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tagChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  tagChipSelected: { backgroundColor: '#3D52A0', borderColor: '#3D52A0' },
  tagChipText: { fontSize: 12, color: '#334155', fontWeight: '500' },
  tagChipTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  extraLinkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  addLinkBtn: { backgroundColor: '#3D52A0', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 8 },
  addLinkText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  topicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  topicPillText: { fontSize: 12, color: '#3730A3', fontWeight: '600', marginRight: 6 },
  topicClose: { fontSize: 12, color: '#6366F1', fontWeight: '700' },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  nextBtn: {
    backgroundColor: '#3D52A0',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextBtnDisabled: { backgroundColor: '#CBD5E1' },
  nextBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

export default MistakeSubmissionFlow;

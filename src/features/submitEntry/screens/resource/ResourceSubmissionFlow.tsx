/**
 * Resource Link Submission Flow (3 Steps)
 * College Knowledge Vault
 *
 * Dedicated multi-step wizard for sharing external learning resources:
 * Step 1: Resource Details (Title >= 5, URL validation, Resource Type, Free/Paid)
 * Step 2: Why It's Useful (Subjects covered, Difficulty, Personal Review >= 30, Best time)
 * Step 3: Tags & Final Submission
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/material-icons';
import { useSubmitFormContext } from '../../context/SubmitFormContext';
import { useAuthStore } from '../../../../core/store/authStore';
import { EntryType } from '../../../../core/types/entry.types';

const RESOURCE_TYPES: Array<
  'youtube_video' | 'youtube_playlist' | 'article' | 'documentation' | 'github_repo' |
  'online_course' | 'book_pdf' | 'tool' | 'research_paper' | 'other'
> = [
  'youtube_video',
  'youtube_playlist',
  'article',
  'documentation',
  'github_repo',
  'online_course',
  'book_pdf',
  'tool',
  'research_paper',
  'other',
];

const COMMON_SUBJECTS = [
  'Data Structures',
  'Operating Systems',
  'Computer Networks',
  'Database Management',
  'System Design',
  'Machine Learning',
  'Web Development',
  'Compiler Design',
];

export const ResourceSubmissionFlow: React.FC = () => {
  const navigation = useNavigation<any>();
  const form = useSubmitFormContext();
  const { user } = useAuthStore();
  const [step, setStep] = useState<number>(1);
  const [tagInput, setTagInput] = useState<string>('');

  useEffect(() => {
    form.setType?.(EntryType.Resource);
  }, [form]);

  const r = form.resourceDetails;

  const isStep1Valid = () => {
    const validUrl = r.url.trim().startsWith('http://') || r.url.trim().startsWith('https://');
    return form.title.trim().length >= 5 && validUrl;
  };

  const isStep2Valid = () => {
    return r.review.trim().length >= 30;
  };

  const isStep3Valid = () => {
    return form.selectedTags.length >= 1;
  };

  const handleToggleSubject = (sub: string) => {
    const existing = r.subjectsCovered;
    const updated = existing.includes(sub)
      ? existing.filter((s) => s !== sub)
      : [...existing, sub];
    form.updateResourceDetails({ subjectsCovered: updated });
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be signed in to submit.');
      return;
    }
    form.setField('description', r.review);
    if (!form.subject && r.subjectsCovered.length > 0) {
      form.setField('subject', r.subjectsCovered[0]);
    }

    try {
      await form.submitEntry(user.id);
      if (form.error) {
        Alert.alert('Submission Failed', form.error);
        return;
      }
      Alert.alert(
        form.isEditMode ? 'Entry Resubmitted' : 'Entry Submitted',
        'Your resource link has been submitted for review. You can track its status in My Submissions.',
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
          testID="button-resource-back"
        >
          <Icon name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>
            {form.isEditMode ? 'Editing Resource Guide' : 'Share Resource Link'}
          </Text>
          <Text style={styles.stepIndicator}>Step {step} of 3</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* ── STEP 1: RESOURCE DETAILS ── */}
        {step === 1 && (
          <View testID="resource-step-1">
            <Text style={styles.sectionTitle}>Resource Details</Text>
            <Text style={styles.sectionSubtitle}>
              Share a book, video playlist, documentation, or tutorial that helped you ace coursework.
            </Text>

            <Text style={styles.fieldLabel}>Resource Title * (Min 5 chars)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. NeetCode 150 System Design Course"
              value={form.title}
              onChangeText={(t) => form.setField('title', t)}
              testID="input-resource-title"
            />

            <Text style={styles.fieldLabel}>URL * (Must start with http:// or https://)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              value={r.url}
              onChangeText={(t) => form.updateResourceDetails({ url: t })}
              autoCapitalize="none"
              testID="input-resource-url"
            />

            {/* URL Preview Card */}
            {r.url.trim().length > 8 && (
              <View style={styles.previewCard} testID="resource-preview-card">
                <Text style={styles.previewDomain}>🔗 {r.url.split('/')[2] || r.url}</Text>
                <Text style={styles.previewTitle}>{form.title || 'Resource Link'}</Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>Resource Type</Text>
            <View style={styles.chipsRow}>
              {RESOURCE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.tagChip, r.resourceType === type && styles.tagChipSelected]}
                  onPress={() => form.updateResourceDetails({ resourceType: type })}
                  testID={`chip-type-${type}`}
                >
                  <Text style={[styles.tagChipText, r.resourceType === type && styles.tagChipTextSelected]}>
                    {type.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.paidRow}>
              <Text style={styles.fieldLabel}>Paid or Free Resource?</Text>
              <View style={styles.toggleRow}>
                <Text style={styles.freeText}>{r.isPaid ? 'Paid' : 'Free'}</Text>
                <Switch
                  value={r.isPaid}
                  onValueChange={(val) => form.updateResourceDetails({ isPaid: val })}
                  testID="toggle-resource-paid"
                />
              </View>
            </View>

            {r.isPaid && (
              <TextInput
                style={styles.input}
                placeholder="Approximate cost (e.g. $15 or Rs. 499)"
                value={r.cost || ''}
                onChangeText={(t) => form.updateResourceDetails({ cost: t || null })}
                testID="input-resource-cost"
              />
            )}
          </View>
        )}

        {/* ── STEP 2: WHY IT'S USEFUL ── */}
        {step === 2 && (
          <View testID="resource-step-2">
            <Text style={styles.sectionTitle}>Why is it Useful?</Text>
            <Text style={styles.sectionSubtitle}>
              Give honest guidance on how juniors should use this material.
            </Text>

            <Text style={styles.fieldLabel}>Subjects / Topics Covered</Text>
            <View style={styles.chipsRow}>
              {COMMON_SUBJECTS.map((sub) => {
                const isSel = r.subjectsCovered.includes(sub);
                return (
                  <TouchableOpacity
                    key={sub}
                    style={[styles.tagChip, isSel && styles.tagChipSelected]}
                    onPress={() => handleToggleSubject(sub)}
                    testID={`chip-subject-${sub}`}
                  >
                    <Text style={[styles.tagChipText, isSel && styles.tagChipTextSelected]}>
                      {sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Difficulty Level</Text>
            <View style={styles.chipsRow}>
              {(['beginner', 'intermediate', 'advanced'] as const).map((diff) => (
                <TouchableOpacity
                  key={diff}
                  style={[styles.tagChip, r.difficulty === diff && styles.tagChipSelected]}
                  onPress={() => form.updateResourceDetails({ difficulty: diff })}
                  testID={`chip-difficulty-${diff}`}
                >
                  <Text style={[styles.tagChipText, r.difficulty === diff && styles.tagChipTextSelected]}>
                    {diff.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>
              Personal Review * (Min 30 chars — {r.review.length}/30)
            </Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Why is this better than alternatives? What did it teach you?"
              multiline
              numberOfLines={4}
              value={r.review}
              onChangeText={(t) => form.updateResourceDetails({ review: t })}
              testID="input-resource-review"
            />

            <Text style={styles.fieldLabel}>Best Time to Use (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Start before 4th sem begins, or for interview prep"
              value={r.bestTimeToUse || ''}
              onChangeText={(t) => form.updateResourceDetails({ bestTimeToUse: t || null })}
              testID="input-resource-time"
            />
          </View>
        )}

        {/* ── STEP 3: TAGS & SUBMIT ── */}
        {step === 3 && (
          <View testID="resource-step-3">
            <Text style={styles.sectionTitle}>Tags & Review</Text>
            <Text style={styles.sectionSubtitle}>Add tags so students searching for this can find it.</Text>

            <Text style={styles.fieldLabel}>Tech / Subject Tags *</Text>
            <View style={styles.extraLinkRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="Add tag (e.g. Algorithms, Cloud)"
                value={tagInput}
                onChangeText={setTagInput}
                testID="input-resource-tag"
              />
              <TouchableOpacity
                style={styles.addLinkBtn}
                onPress={() => {
                  if (tagInput.trim()) {
                    form.addTag(tagInput.trim());
                    setTagInput('');
                  }
                }}
                testID="button-add-resource-tag"
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
        {step < 3 ? (
          <TouchableOpacity
            style={[
              styles.nextBtn,
              !(
                (step === 1 && isStep1Valid()) ||
                (step === 2 && isStep2Valid())
              ) && styles.nextBtnDisabled,
            ]}
            disabled={
              !(
                (step === 1 && isStep1Valid()) ||
                (step === 2 && isStep2Valid())
              )
            }
            onPress={() => setStep(step + 1)}
            testID="button-resource-next"
          >
            <Text style={styles.nextBtnText}>Continue to Step {step + 1} →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, !isStep3Valid() && styles.nextBtnDisabled]}
            disabled={!isStep3Valid() || form.isSubmitting}
            onPress={handleSubmit}
            testID="button-resource-submit"
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
  previewCard: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  previewDomain: { fontSize: 12, color: '#4338CA', fontWeight: '600' },
  previewTitle: { fontSize: 13, color: '#1E1B4B', marginTop: 2 },
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
  paidRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center' },
  freeText: { marginRight: 8, fontSize: 13, fontWeight: '600', color: '#334155' },
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

export default ResourceSubmissionFlow;

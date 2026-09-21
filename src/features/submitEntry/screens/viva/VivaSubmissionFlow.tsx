/**
 * Viva Q&A Submission Flow (4 Steps)
 * College Knowledge Vault
 *
 * Dedicated multi-step wizard for Viva preparation entries:
 * Step 1: Subject & Context (Subject, Semester, Academic Year, Exam Type)
 * Step 2: Add Questions (Q&A pairs with difficulty, frequency, follow-ups, tips)
 * Step 3: Related Study Material (Key topics list, reference links)
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

const ACADEMIC_YEARS = ['2024-25', '2023-24', '2022-23', '2021-22', '2020-21'];
const EXAM_TYPES = ['internal', 'external', 'both'] as const;

export const VivaSubmissionFlow: React.FC = () => {
  const navigation = useNavigation<any>();
  const form = useSubmitFormContext();
  const { user } = useAuthStore();
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    form.setType?.(EntryType.Viva);
  }, [form]);

  // New question form state in Step 2
  const [qText, setQText] = useState<string>('');
  const [aText, setAText] = useState<string>('');
  const [qDiff, setQDiff] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [qFreq, setQFreq] = useState<'rarely' | 'sometimes' | 'often' | 'always'>('sometimes');
  const [qFollowUp, setQFollowUp] = useState<string>('');
  const [qTip, setQTip] = useState<string>('');

  // Step 3 inputs
  const [topicInput, setTopicInput] = useState<string>('');
  const [linkLabel, setLinkLabel] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState<string>('');

  // Step 4 tag input
  const [tagInput, setTagInput] = useState<string>('');

  const viva = form.vivaDetails;

  const isStep1Valid = () => {
    const sem = parseInt(form.semester.trim(), 10);
    return form.subject.trim().length > 0 && !isNaN(sem) && sem >= 1 && sem <= 8;
  };

  const isStep2Valid = () => form.vivaQuestionsDetailed.length >= 1;

  const isStep3Valid = () => true; // Material is optional

  const isStep4Valid = () => form.selectedTags.length >= 1;

  const handleAddQuestion = () => {
    if (qText.trim().length < 10) {
      Alert.alert('Validation', 'Question must be at least 10 characters.');
      return;
    }
    if (aText.trim().length < 20) {
      Alert.alert('Validation', 'Suggested answer must be at least 20 characters.');
      return;
    }
    if (form.vivaQuestionsDetailed.length >= 50) {
      Alert.alert('Limit Reached', 'Maximum 50 questions per viva guide.');
      return;
    }

    form.addVivaQuestionDetailed({
      question: qText.trim(),
      answer: aText.trim(),
      difficulty: qDiff,
      frequency: qFreq,
      followUpQuestions: qFollowUp.trim() ? [qFollowUp.trim()] : [],
      answerTip: qTip.trim() || null,
    });

    setQText('');
    setAText('');
    setQFollowUp('');
    setQTip('');
  };

  const handleAddTopic = () => {
    if (!topicInput.trim()) return;
    form.updateVivaDetails((prev) => ({
      ...prev,
      relatedTopics: [...prev.relatedTopics, topicInput.trim()],
    }));
    setTopicInput('');
  };

  const handleRemoveTopic = (index: number) => {
    form.updateVivaDetails((prev) => ({
      ...prev,
      relatedTopics: prev.relatedTopics.filter((_, i) => i !== index),
    }));
  };

  const handleAddResource = () => {
    if (!linkLabel.trim() || !linkUrl.trim()) return;
    form.updateVivaDetails((prev) => ({
      ...prev,
      resourceLinks: [...prev.resourceLinks, { label: linkLabel.trim(), url: linkUrl.trim() }],
    }));
    setLinkLabel('');
    setLinkUrl('');
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be signed in to submit.');
      return;
    }
    if (!form.title.trim()) {
      form.setField('title', `${form.subject} Viva Q&A Guide`);
    }
    if (!form.description.trim()) {
      form.setField(
        'description',
        `Comprehensive viva evaluation questions and suggested answers for ${form.subject}.`,
      );
    }

    try {
      await form.submitEntry(user.id);
      if (form.error) {
        Alert.alert('Submission Failed', form.error);
        return;
      }
      Alert.alert(
        form.isEditMode ? 'Entry Resubmitted' : 'Entry Submitted',
        'Your viva Q&A guide has been submitted for review. You can track its status in My Submissions.',
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
          testID="button-viva-back"
        >
          <Icon name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>
            {form.isEditMode ? 'Editing Viva Guide' : 'Share Viva Q&A Guide'}
          </Text>
          <Text style={styles.stepIndicator}>Step {step} of 4</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* ── STEP 1: SUBJECT & CONTEXT ── */}
        {step === 1 && (
          <View testID="viva-step-1">
            <Text style={styles.sectionTitle}>Subject & Exam Context</Text>
            <Text style={styles.sectionSubtitle}>
              Which subject and semester are these questions from?
            </Text>

            <Text style={styles.fieldLabel}>Subject Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Operating Systems"
              value={form.subject}
              onChangeText={(t) => {
                form.setField('subject', t);
                form.updateVivaDetails({ subject: t });
              }}
              testID="input-viva-subject"
            />

            <Text style={styles.fieldLabel}>Semester * (1-8)</Text>
            <View style={styles.chipsRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.semChip,
                    form.semester === String(s) && styles.semChipSelected,
                  ]}
                  onPress={() => {
                    form.setField('semester', String(s));
                    form.updateVivaDetails({ semester: s });
                  }}
                  testID={`chip-viva-sem-${s}`}
                >
                  <Text
                    style={[
                      styles.semChipText,
                      form.semester === String(s) && styles.semChipTextSelected,
                    ]}
                  >
                    Sem {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Academic Year</Text>
            <View style={styles.chipsRow}>
              {ACADEMIC_YEARS.map((yr) => (
                <TouchableOpacity
                  key={yr}
                  style={[
                    styles.tagChip,
                    viva.academicYear === yr && styles.tagChipSelected,
                  ]}
                  onPress={() => form.updateVivaDetails({ academicYear: yr })}
                  testID={`chip-viva-year-${yr}`}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      viva.academicYear === yr && styles.tagChipTextSelected,
                    ]}
                  >
                    {yr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Exam Type</Text>
            <View style={styles.chipsRow}>
              {EXAM_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tagChip, viva.examType === t && styles.tagChipSelected]}
                  onPress={() => form.updateVivaDetails({ examType: t })}
                  testID={`chip-viva-exam-${t}`}
                >
                  <Text style={[styles.tagChipText, viva.examType === t && styles.tagChipTextSelected]}>
                    {t === 'both' ? 'Internal & External' : t.toUpperCase() + ' VIVA'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── STEP 2: ADD QUESTIONS ── */}
        {step === 2 && (
          <View testID="viva-step-2">
            <Text style={styles.sectionTitle}>Add Questions & Answers</Text>
            <Text style={styles.sectionSubtitle}>
              Include key questions asked by examiners with tips on how to score high.
            </Text>

            {/* Form for adding a question */}
            <View style={styles.addQuestionBox} testID="add-question-box">
              <Text style={styles.subHeading}>Add New Question ({form.vivaQuestionsDetailed.length}/50)</Text>

              <Text style={styles.fieldLabel}>Question * (Min 10 chars)</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="e.g. What is the difference between process and thread?"
                multiline
                numberOfLines={2}
                value={qText}
                onChangeText={setQText}
                testID="input-viva-question"
              />

              <Text style={styles.fieldLabel}>Suggested Answer * (Min 20 chars)</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Give a concise, high-scoring technical explanation..."
                multiline
                numberOfLines={3}
                value={aText}
                onChangeText={setAText}
                testID="input-viva-answer"
              />

              <Text style={styles.fieldLabel}>Difficulty</Text>
              <View style={styles.chipsRow}>
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.tagChip, qDiff === d && styles.tagChipSelected]}
                    onPress={() => setQDiff(d)}
                    testID={`chip-diff-${d}`}
                  >
                    <Text style={[styles.tagChipText, qDiff === d && styles.tagChipTextSelected]}>
                      {d.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Frequency Asked</Text>
              <View style={styles.chipsRow}>
                {(['rarely', 'sometimes', 'always'] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.tagChip, qFreq === f && styles.tagChipSelected]}
                    onPress={() => setQFreq(f)}
                    testID={`chip-freq-${f}`}
                  >
                    <Text style={[styles.tagChipText, qFreq === f && styles.tagChipTextSelected]}>
                      {f.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Examiner Follow-up (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Common follow-up question..."
                value={qFollowUp}
                onChangeText={setQFollowUp}
                testID="input-viva-followup"
              />

              <Text style={styles.fieldLabel}>Tip for Answering (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Draw diagram on board first..."
                value={qTip}
                onChangeText={setQTip}
                testID="input-viva-tip"
              />

              <TouchableOpacity
                style={styles.addQBtn}
                onPress={handleAddQuestion}
                testID="button-add-question"
              >
                <Text style={styles.addQBtnText}>+ Add to Guide</Text>
              </TouchableOpacity>
            </View>

            {/* List of questions */}
            <Text style={[styles.subHeading, { marginTop: 16 }]}>
              Questions in Guide ({form.vivaQuestionsDetailed.length})
            </Text>
            {form.vivaQuestionsDetailed.map((item, idx) => (
              <View key={item.id || idx} style={styles.qCard} testID={`question-card-${idx}`}>
                <View style={styles.rowBetween}>
                  <Text style={styles.qIndex}>Q{idx + 1}.</Text>
                  <TouchableOpacity onPress={() => form.removeVivaQuestionDetailed(idx)}>
                    <Text style={styles.removeText}>Delete</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.qTitle}>{item.question}</Text>
                <Text style={styles.aText}>{item.answer}</Text>
                <View style={styles.badgeRow}>
                  <Text style={styles.diffBadgeText}>Level: {item.difficulty}</Text>
                  <Text style={styles.freqBadgeText}>Freq: {item.frequency}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── STEP 3: RELATED STUDY MATERIAL ── */}
        {step === 3 && (
          <View testID="viva-step-3">
            <Text style={styles.sectionTitle}>Related Study Material</Text>
            <Text style={styles.sectionSubtitle}>
              List key topics and links juniors should revise before this viva.
            </Text>

            <Text style={styles.fieldLabel}>Key Topics to Master</Text>
            <View style={styles.extraLinkRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="e.g. Virtual Memory, Deadlocks"
                value={topicInput}
                onChangeText={setTopicInput}
                testID="input-related-topic"
              />
              <TouchableOpacity
                style={styles.addLinkBtn}
                onPress={handleAddTopic}
                testID="button-add-topic"
              >
                <Text style={styles.addLinkText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chipsRow}>
              {viva.relatedTopics.map((top, i) => (
                <View key={i} style={styles.topicPill}>
                  <Text style={styles.topicPillText}>📖 {top}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTopic(i)}>
                    <Text style={styles.topicClose}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Useful Study Links (optional)</Text>
            <View style={styles.extraLinkRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="Label (e.g. NPTEL Lecture)"
                value={linkLabel}
                onChangeText={setLinkLabel}
              />
              <TextInput
                style={[styles.input, { flex: 1.5, marginRight: 8 }]}
                placeholder="URL"
                value={linkUrl}
                onChangeText={setLinkUrl}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.addLinkBtn}
                onPress={handleAddResource}
                testID="button-add-viva-link"
              >
                <Text style={styles.addLinkText}>Add</Text>
              </TouchableOpacity>
            </View>

            {viva.resourceLinks.map((rl, idx) => (
              <Text key={idx} style={styles.linkPill}>
                🔗 {rl.label}: {rl.url}
              </Text>
            ))}
          </View>
        )}

        {/* ── STEP 4: TAGS & SUBMIT ── */}
        {step === 4 && (
          <View testID="viva-step-4">
            <Text style={styles.sectionTitle}>Tags & Review</Text>
            <Text style={styles.sectionSubtitle}>
              Attach subject tags to help juniors discover your viva questions.
            </Text>

            <View style={styles.reviewSummaryCard}>
              <Text style={styles.summaryTitle}>Guide Summary</Text>
              <Text style={styles.summaryRow}>Subject: {form.subject} (Sem {form.semester})</Text>
              <Text style={styles.summaryRow}>Total Questions: {form.vivaQuestionsDetailed.length}</Text>
              <Text style={styles.summaryRow}>Exam: {viva.examType.toUpperCase()}</Text>
            </View>

            <Text style={styles.fieldLabel}>Subject / Tech Tags *</Text>
            <View style={styles.extraLinkRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="Add subject tag (e.g. OS, Networking)"
                value={tagInput}
                onChangeText={setTagInput}
                testID="input-viva-tag"
              />
              <TouchableOpacity
                style={styles.addLinkBtn}
                onPress={() => {
                  if (tagInput.trim()) {
                    form.addTag(tagInput.trim());
                    setTagInput('');
                  }
                }}
                testID="button-add-viva-tag"
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
            testID="button-viva-next"
          >
            <Text style={styles.nextBtnText}>Continue to Step {step + 1} →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, !isStep4Valid() && styles.nextBtnDisabled]}
            disabled={!isStep4Valid() || form.isSubmitting}
            onPress={handleSubmit}
            testID="button-viva-submit"
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
  multilineInput: { minHeight: 70, textAlignVertical: 'top' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  semChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  semChipSelected: { backgroundColor: '#3D52A0', borderColor: '#3D52A0' },
  semChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  semChipTextSelected: { color: '#FFFFFF' },
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
  addQuestionBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  subHeading: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  addQBtn: {
    backgroundColor: '#3D52A0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addQBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  qCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  qIndex: { fontSize: 13, fontWeight: '700', color: '#6366F1' },
  removeText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  qTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  aText: { fontSize: 13, color: '#475569', lineHeight: 18 },
  badgeRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  diffBadgeText: { fontSize: 11, color: '#D97706', fontWeight: '600' },
  freqBadgeText: { fontSize: 11, color: '#2563EB', fontWeight: '600' },
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
  linkPill: { fontSize: 12, color: '#2563EB', marginBottom: 4 },
  reviewSummaryCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: '#3730A3', marginBottom: 4 },
  summaryRow: { fontSize: 13, color: '#4338CA', marginBottom: 2 },
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

export default VivaSubmissionFlow;

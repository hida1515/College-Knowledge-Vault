/**
 * Project Submission Flow (6 Steps)
 * College Knowledge Vault
 *
 * Dedicated multi-step wizard for project guides:
 * Step 1: Project Nature (Individual vs Group with team members)
 * Step 2: Academic Context (Subject, Semester, Category, Complexity)
 * Step 3: Project Resources (GitHub/GitLab, PDF Report, Demo Link, Links)
 * Step 4: Your Experience (Description >=50, Challenges >=30, Solutions >=30, Time, Grade)
 * Step 5: Viva Questions (Up to 30 Q&A cards)
 * Step 6: Final Details (Tips, Tags, Submit for Review)
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
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/material-icons';
import DocumentPicker from 'react-native-document-picker';
import { supabase } from '../../../../core/services/supabase';
import { useSubmitFormContext } from '../../context/SubmitFormContext';
import { useAuthStore } from '../../../../core/store/authStore';
import { TeamMember, EntryType } from '../../../../core/types/entry.types';
import { computeEffectiveRole } from '../../../../core/utils/roleChecker';
import { EffectiveRole } from '../../../../core/types/user.types';

const CATEGORIES = [
  'Web App',
  'Mobile App',
  'ML/AI',
  'IoT',
  'Desktop',
  'Research',
  'Data Science',
  'Other',
];

const COMPLEXITIES: Array<'beginner' | 'intermediate' | 'advanced'> = [
  'beginner',
  'intermediate',
  'advanced',
];

const TIME_TAKEN_OPTIONS = [
  '1 week',
  '2 weeks',
  '1 month',
  '2-3 months',
  'Full semester',
  'Other',
];

const PREDEFINED_TECH_TAGS = [
  'React Native',
  'TypeScript',
  'Python',
  'Node.js',
  'Flutter',
  'Kotlin',
  'Swift',
  'Supabase',
  'Firebase',
  'TensorFlow',
  'Docker',
  'PostgreSQL',
  'MongoDB',
  'Next.js',
];

export const ProjectSubmissionFlow: React.FC = () => {
  const navigation = useNavigation<any>();
  const form = useSubmitFormContext();
  const { user } = useAuthStore();
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    form.setType?.(EntryType.Project);
    if (user && (computeEffectiveRole(user) === EffectiveRole.Faculty || user.role === 'faculty')) {
      Alert.alert(
        'Student Only',
        'Project Guide submissions are reserved for student authors. Faculty can share Viva Questions, Mistake Guides, or Study Resources.',
      );
      navigation.goBack();
    }
  }, [user, navigation, form]);

  // Modal for adding viva questions
  const [showVivaModal, setShowVivaModal] = useState<boolean>(false);
  const [vivaQ, setVivaQ] = useState<string>('');
  const [vivaA, setVivaA] = useState<string>('');
  const [vivaDiff, setVivaDiff] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [vivaFreq] = useState<'rarely' | 'sometimes' | 'often' | 'always'>('often');
  const [vivaFollowUp, setVivaFollowUp] = useState<string>('');
  const [vivaTip, setVivaTip] = useState<string>('');

  // Local state for custom links
  const [linkLabel, setLinkLabel] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [customTagInput, setCustomTagInput] = useState<string>('');

  // PDF upload states
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [reportFileName, setReportFileName] = useState<string | null>(null);
  const [reportFileSize, setReportFileSize] = useState<number | null>(null);
  async function readUriAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
    try {
      const res = await fetch(uri);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        if (buffer && buffer.byteLength > 0) {
          return buffer;
        }
      }
    } catch {
      // Fallback to XHR
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        if (xhr.response && xhr.response.byteLength !== undefined) {
          resolve(xhr.response);
        } else {
          reject(new Error('Failed to read file buffer via XHR.'));
        }
      };
      xhr.onerror = () => {
        reject(new Error('Network error reading local file into buffer.'));
      };
      xhr.responseType = 'arraybuffer';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });
  }

  async function handlePDFUpload(): Promise<void> {
    try {
      setUploadError(null);
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf],
        copyTo: 'cachesDirectory',
      });

      if (!result) return; // user cancelled

      const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

      if (result.size && result.size > MAX_SIZE_BYTES) {
        Alert.alert(
          'File Too Large',
          'Project report must be under 15MB. Try compressing your PDF before uploading.',
        );
        return;
      }

      // Estimate size if size property is absent
      if (!result.size) {
        try {
          const rawUri = result.fileCopyUri || result.uri;
          const sample = await readUriAsArrayBuffer(rawUri);
          if (sample && sample.byteLength > MAX_SIZE_BYTES) {
            Alert.alert(
              'File Too Large',
              'Project report must be under 15MB. Try compressing your PDF before uploading.',
            );
            return;
          }
        } catch {}
      }

      setIsUploading(true);

      const fileExt = 'pdf';
      const userId = user?.id || 'anonymous';
      const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const fileName = `${userId}/${fileId}.${fileExt}`;
      const rawUri = result.fileCopyUri || result.uri;

      let uploadPayload: ArrayBuffer | FormData;
      try {
        uploadPayload = await readUriAsArrayBuffer(rawUri);
      } catch (readErr) {
        console.warn('Could not read file as ArrayBuffer, falling back to FormData payload:', readErr);
        const formData = new FormData();
        formData.append('file', {
          uri: Platform.OS === 'android' ? rawUri : rawUri.replace('file://', ''),
          name: result.name || 'project_report.pdf',
          type: 'application/pdf',
        } as any);

        if (!(formData as any).has) {
          (formData as any).has = (name: string) =>
            Array.isArray((formData as any)._parts) &&
            (formData as any)._parts.some((p: any) => Array.isArray(p) && p[0] === name);
        }
        if (!(formData as any).get) {
          (formData as any).get = (name: string) => {
            const part = (formData as any)._parts?.find((p: any) => Array.isArray(p) && p[0] === name);
            return part ? part[1] : null;
          };
        }
        uploadPayload = formData;
      }

      const { data, error } = await supabase.storage
        .from('project-reports')
        .upload(fileName, uploadPayload, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        if (
          error.message?.includes('Bucket') ||
          error.message?.includes('bucket') ||
          error.message?.includes('row-level security') ||
          error.message?.includes('403') ||
          error.message?.includes('not found')
        ) {
          throw new Error(
            "Storage bucket 'project-reports' is not configured in Supabase. Please run migration 006 or COMPLETE_DATABASE_SETUP.sql in your Supabase SQL Editor.",
          );
        }
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('project-reports')
        .getPublicUrl(data?.path || fileName);

      form.updateProjectDetails({ reportUrl: urlData.publicUrl });
      setReportFileName(result.name || 'project_report.pdf');
      if (result.size) {
        setReportFileSize(result.size);
      }
      Alert.alert('Report Attached', 'Project report uploaded successfully.');
    } catch (err: any) {
      if (DocumentPicker.isCancel(err)) return;
      console.error('PDF upload error:', err);
      const msg = err?.message || 'Failed to upload PDF. Please try again.';
      setUploadError(msg);
      Alert.alert('Upload Failed', msg);
    } finally {
      setIsUploading(false);
    }
  }

  const details = form.projectDetails;

  // Validation checks per step
  const isStep1Valid = () => {
    if (details.projectType === 'individual') return true;
    if (details.teamMembers.length < 2 || details.teamMembers.length > 5) return false;
    return details.teamMembers.every((m) => m.name.trim().length > 0);
  };

  const isStep2Valid = () => {
    const sem = parseInt(form.semester.trim(), 10);
    return form.subject.trim().length > 0 && !isNaN(sem) && sem >= 1 && sem <= 8;
  };

  const isStep3Valid = () => {
    if (details.githubUrl && details.githubUrl.trim().length > 0) {
      const url = details.githubUrl.trim().toLowerCase();
      if (!url.includes('github.com') && !url.includes('gitlab.com')) {
        return false;
      }
    }
    return true;
  };

  const isStep4Valid = () => {
    const desc = (details.description || form.description || '').trim();
    const ch = (details.challenges || '').trim();
    const sol = (details.solutions || '').trim();
    return desc.length >= 50 && ch.length >= 30 && sol.length >= 30;
  };

  const isStep5Valid = () => true; // Viva questions are optional

  const isStep6Valid = () => form.selectedTags.length >= 1;

  // Handlers
  const handleAddMember = () => {
    if (details.teamMembers.length >= 5) return;
    const newMember: TeamMember = {
      name: '',
      linkedinUrl: null,
      githubUrl: null,
      email: null,
      openToConnect: true,
    };
    form.updateProjectDetails((prev) => ({
      ...prev,
      teamMembers: [...prev.teamMembers, newMember],
    }));
  };

  const handleUpdateMember = (index: number, updates: Partial<TeamMember>) => {
    const updated = [...details.teamMembers];
    updated[index] = { ...updated[index], ...updates };
    form.updateProjectDetails((prev) => ({
      ...prev,
      teamMembers: updated,
    }));
  };

  const handleRemoveMember = (index: number) => {
    const updated = details.teamMembers.filter((_, i) => i !== index);
    form.updateProjectDetails((prev) => ({
      ...prev,
      teamMembers: updated,
    }));
  };

  const handleAddExtraLink = () => {
    if (!linkLabel.trim() || !linkUrl.trim()) return;
    form.updateProjectDetails((prev) => ({
      ...prev,
      otherLinks: [...prev.otherLinks, { label: linkLabel.trim(), url: linkUrl.trim() }],
    }));
    setLinkLabel('');
    setLinkUrl('');
  };

  const handleAddVivaQuestion = () => {
    if (!vivaQ.trim() || !vivaA.trim()) {
      Alert.alert('Required', 'Please enter both question and suggested answer.');
      return;
    }
    form.addVivaQuestionDetailed({
      question: vivaQ.trim(),
      answer: vivaA.trim(),
      difficulty: vivaDiff,
      frequency: vivaFreq,
      followUpQuestions: vivaFollowUp.trim() ? [vivaFollowUp.trim()] : [],
      answerTip: vivaTip.trim() || null,
    });
    setVivaQ('');
    setVivaA('');
    setVivaFollowUp('');
    setVivaTip('');
    setShowVivaModal(false);
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be signed in to submit an entry.');
      return;
    }
    try {
      form.setType?.(EntryType.Project);
      if (details.description && !form.description) {
        form.setField('description', details.description);
      }
      await form.submitEntry(user.id);
      if (form.error) {
        Alert.alert('Submission Failed', form.error);
        return;
      }
      setStep(1);
      setReportFileName(null);
      setReportFileSize(null);
      setUploadError(null);
      Alert.alert(
        form.isEditMode ? 'Entry Resubmitted' : 'Entry Submitted',
        'Your project entry has been sent for review. You can track its status in My Submissions.',
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
          testID="button-project-back"
        >
          <Icon name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>
            {form.isEditMode ? 'Editing Project Guide' : 'Share Project Guide'}
          </Text>
          <Text style={styles.stepIndicator}>Step {step} of 6</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* ── STEP 1: PROJECT NATURE ── */}
        {step === 1 && (
          <View testID="project-step-1">
            <Text style={styles.sectionTitle}>About Your Project</Text>
            <Text style={styles.sectionSubtitle}>
              Was this built individually or as a team collaboration?
            </Text>

            <View style={styles.natureCardsRow}>
              <TouchableOpacity
                style={[
                  styles.natureCard,
                  details.projectType === 'individual' && styles.natureCardSelected,
                ]}
                onPress={() =>
                  form.updateProjectDetails((prev) => ({
                    ...prev,
                    projectType: 'individual',
                    teamMembers: [],
                  }))
                }
                testID="button-individual-project"
              >
                <Text style={styles.natureEmoji}>👤</Text>
                <Text style={styles.natureCardTitle}>Individual Project</Text>
                <Text style={styles.natureCardDesc}>Built solely by yourself</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.natureCard,
                  details.projectType === 'group' && styles.natureCardSelected,
                ]}
                onPress={() => {
                  form.updateProjectDetails((prev) => ({
                    ...prev,
                    projectType: 'group',
                    teamMembers:
                      prev.teamMembers.length >= 2
                        ? prev.teamMembers
                        : [
                            {
                              name: user?.displayName || '',
                              linkedinUrl: null,
                              githubUrl: null,
                              email: user?.email || null,
                              openToConnect: true,
                            },
                            {
                              name: '',
                              linkedinUrl: null,
                              githubUrl: null,
                              email: null,
                              openToConnect: true,
                            },
                          ],
                  }));
                }}
                testID="button-group-project"
              >
                <Text style={styles.natureEmoji}>👥</Text>
                <Text style={styles.natureCardTitle}>Group Project</Text>
                <Text style={styles.natureCardDesc}>Collaborated with 2-5 members</Text>
              </TouchableOpacity>
            </View>

            {details.projectType === 'group' && (
              <View style={styles.groupSection} testID="group-members-section">
                <View style={styles.rowBetween}>
                  <Text style={styles.subHeading}>Team Members ({details.teamMembers.length}/5)</Text>
                  {details.teamMembers.length < 5 && (
                    <TouchableOpacity
                      onPress={handleAddMember}
                      style={styles.addMemberBtn}
                      testID="button-add-member"
                    >
                      <Text style={styles.addMemberText}>+ Add Member</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.infoHint}>
                  Team member info helps juniors reach out for guidance. Only shared info will be visible.
                </Text>

                {details.teamMembers.map((member, idx) => (
                  <View key={idx} style={styles.memberCard} testID={`member-card-${idx}`}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.memberNum}>Member {idx + 1}</Text>
                      {idx > 1 && (
                        <TouchableOpacity onPress={() => handleRemoveMember(idx)}>
                          <Text style={styles.removeText}>Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name *"
                      value={member.name}
                      onChangeText={(t) => handleUpdateMember(idx, { name: t })}
                      testID={`input-member-name-${idx}`}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="LinkedIn URL (optional)"
                      value={member.linkedinUrl || ''}
                      onChangeText={(t) => handleUpdateMember(idx, { linkedinUrl: t })}
                      testID={`input-member-linkedin-${idx}`}
                      autoCapitalize="none"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="GitHub URL (optional)"
                      value={member.githubUrl || ''}
                      onChangeText={(t) => handleUpdateMember(idx, { githubUrl: t })}
                      testID={`input-member-github-${idx}`}
                      autoCapitalize="none"
                    />
                    <View style={styles.connectToggleRow}>
                      <Text style={styles.toggleLabel}>Open to connect with juniors?</Text>
                      <Switch
                        value={member.openToConnect}
                        onValueChange={(val) => handleUpdateMember(idx, { openToConnect: val })}
                        testID={`toggle-member-connect-${idx}`}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── STEP 2: ACADEMIC CONTEXT ── */}
        {step === 2 && (
          <View testID="project-step-2">
            <Text style={styles.sectionTitle}>Academic Details</Text>
            <Text style={styles.sectionSubtitle}>Tag your course and technical specifications</Text>

            <Text style={styles.fieldLabel}>Project Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Smart Campus Navigation System"
              value={form.title}
              onChangeText={(t) => form.setField('title', t)}
              testID="input-project-title"
            />

            <Text style={styles.fieldLabel}>Course / Subject *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mobile Application Development"
              value={form.subject}
              onChangeText={(t) => form.setField('subject', t)}
              testID="input-project-subject"
            />

            <Text style={styles.fieldLabel}>Semester * (1-8)</Text>
            <View style={styles.chipsRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <TouchableOpacity
                  key={sem}
                  style={[
                    styles.semChip,
                    form.semester === String(sem) && styles.semChipSelected,
                  ]}
                  onPress={() => form.setField('semester', String(sem))}
                  testID={`chip-semester-${sem}`}
                >
                  <Text
                    style={[
                      styles.semChipText,
                      form.semester === String(sem) && styles.semChipTextSelected,
                    ]}
                  >
                    Sem {sem}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Project Category</Text>
            <View style={styles.chipsRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.tagChip,
                    details.category === cat && styles.tagChipSelected,
                  ]}
                  onPress={() => form.updateProjectDetails({ category: cat })}
                  testID={`chip-category-${cat}`}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      details.category === cat && styles.tagChipTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Complexity Level</Text>
            <View style={styles.chipsRow}>
              {COMPLEXITIES.map((comp) => (
                <TouchableOpacity
                  key={comp}
                  style={[
                    styles.tagChip,
                    details.complexity === comp && styles.tagChipSelected,
                  ]}
                  onPress={() => form.updateProjectDetails({ complexity: comp })}
                  testID={`chip-complexity-${comp}`}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      details.complexity === comp && styles.tagChipTextSelected,
                    ]}
                  >
                    {comp.charAt(0).toUpperCase() + comp.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── STEP 3: PROJECT RESOURCES ── */}
        {step === 3 && (
          <View testID="project-step-3">
            <Text style={styles.sectionTitle}>Project Resources</Text>
            <Text style={styles.sectionSubtitle}>
              Share links and reports so juniors can learn from your codebase.
            </Text>

            <Text style={styles.fieldLabel}>GitHub / GitLab Repository URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://github.com/username/project"
              value={details.githubUrl || ''}
              onChangeText={(t) => form.updateProjectDetails({ githubUrl: t || null })}
              autoCapitalize="none"
              testID="input-github-url"
            />
            {details.githubUrl &&
              !details.githubUrl.toLowerCase().includes('github.com') &&
              !details.githubUrl.toLowerCase().includes('gitlab.com') && (
                <Text style={styles.errorText} testID="error-github-url">
                  URL must begin with github.com or gitlab.com
                </Text>
              )}

            <Text style={styles.fieldLabel}>Demo / Live Link (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://myproject.com or APK link"
              value={details.demoUrl || ''}
              onChangeText={(t) => form.updateProjectDetails({ demoUrl: t || null })}
              autoCapitalize="none"
              testID="input-demo-url"
            />

            <Text style={styles.fieldLabel}>Project Report (PDF)</Text>
            <View style={styles.uploadCard}>
              <Text style={styles.uploadCardEmoji}>📄</Text>
              <Text style={styles.uploadCardTitle}>
                {details.reportUrl ? 'Report Attached' : 'Upload Final Project Report'}
              </Text>
              <Text style={styles.uploadCardDesc}>
                {reportFileName
                  ? `${reportFileName}${reportFileSize ? ` (${(reportFileSize / (1024 * 1024)).toFixed(2)} MB)` : ''} ✓`
                  : 'PDF format, max 10MB'}
              </Text>
              {uploadError ? <Text style={styles.errorText}>{uploadError}</Text> : null}
              <TouchableOpacity
                style={[styles.uploadBtn, isUploading && styles.nextBtnDisabled]}
                onPress={handlePDFUpload}
                disabled={isUploading}
                testID="button-upload-report"
              >
                {isUploading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.uploadBtnText}>
                    {details.reportUrl ? 'Replace PDF' : 'Select PDF'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Additional Reference Links (Figma, Paper, etc.)</Text>
            <View style={styles.extraLinkRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="Label (e.g. Figma)"
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
                onPress={handleAddExtraLink}
                testID="button-add-link"
              >
                <Text style={styles.addLinkText}>Add</Text>
              </TouchableOpacity>
            </View>
            {details.otherLinks.map((l, i) => (
              <Text key={i} style={styles.linkPill}>
                🔗 {l.label}: {l.url}
              </Text>
            ))}
          </View>
        )}

        {/* ── STEP 4: YOUR EXPERIENCE ── */}
        {step === 4 && (
          <View testID="project-step-4">
            <Text style={styles.sectionTitle}>Your Experience</Text>
            <Text style={styles.sectionSubtitle}>
              The most valuable advice for juniors is your real project journey.
            </Text>

            <Text style={styles.fieldLabel}>
              Project Description * (Min 50 chars — {details.description?.length || 0}/50)
            </Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Explain what problem your project solves and its core features..."
              multiline
              numberOfLines={4}
              value={details.description}
              onChangeText={(t) => {
                form.updateProjectDetails({ description: t });
                form.setField('description', t);
              }}
              testID="input-project-description"
            />

            <Text style={styles.fieldLabel}>
              Key Challenges Faced * (Min 30 chars — {details.challenges?.length || 0}/30)
            </Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="What were the hardest bugs, bottlenecks, or obstacles?"
              multiline
              numberOfLines={3}
              value={details.challenges}
              onChangeText={(t) => form.updateProjectDetails({ challenges: t })}
              testID="input-project-challenges"
            />

            <Text style={styles.fieldLabel}>
              How You Solved Them * (Min 30 chars — {details.solutions?.length || 0}/30)
            </Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="How did you resolve these challenges?"
              multiline
              numberOfLines={3}
              value={details.solutions}
              onChangeText={(t) => form.updateProjectDetails({ solutions: t })}
              testID="input-project-solutions"
            />

            <Text style={styles.fieldLabel}>What Worked Well (optional)</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Architectural choices or team workflows you're proud of"
              multiline
              numberOfLines={2}
              value={details.whatWorkedWell || ''}
              onChangeText={(t) => form.updateProjectDetails({ whatWorkedWell: t || null })}
            />

            <Text style={styles.fieldLabel}>What You'd Do Differently (optional)</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="If restarting today, what would you change?"
              multiline
              numberOfLines={2}
              value={details.whatToDoDifferently || ''}
              onChangeText={(t) => form.updateProjectDetails({ whatToDoDifferently: t || null })}
            />

            <Text style={styles.fieldLabel}>Time Taken</Text>
            <View style={styles.chipsRow}>
              {TIME_TAKEN_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.tagChip,
                    details.timeTaken === opt && styles.tagChipSelected,
                  ]}
                  onPress={() => form.updateProjectDetails({ timeTaken: opt })}
                  testID={`chip-time-${opt}`}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      details.timeTaken === opt && styles.tagChipTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.gradeRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.fieldLabel}>Grade Received (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. A+ or 95/100"
                  value={details.gradeReceived || ''}
                  onChangeText={(t) => form.updateProjectDetails({ gradeReceived: t || null })}
                  testID="input-grade"
                />
              </View>
              <View style={styles.gradeToggleCol}>
                <Text style={styles.toggleLabel}>Make Visible</Text>
                <Switch
                  value={details.gradeVisible}
                  onValueChange={(val) => form.updateProjectDetails({ gradeVisible: val })}
                  testID="toggle-grade-visible"
                />
              </View>
            </View>
          </View>
        )}

        {/* ── STEP 5: VIVA QUESTIONS ── */}
        {step === 5 && (
          <View testID="project-step-5">
            <Text style={styles.sectionTitle}>Viva Questions</Text>
            <Text style={styles.sectionSubtitle}>
              Share questions asked by external examiners during your project evaluation.
            </Text>

            <TouchableOpacity
              style={styles.openModalBtn}
              onPress={() => setShowVivaModal(true)}
              testID="button-open-add-viva-modal"
            >
              <Text style={styles.openModalBtnText}>
                + Add Viva Question ({(form.vivaQuestionsDetailed || []).length}/30)
              </Text>
            </TouchableOpacity>

            {(form.vivaQuestionsDetailed || []).map((q, idx) => (
              <View key={q.id || idx} style={styles.vivaCard} testID={`viva-question-card-${idx}`}>
                <View style={styles.rowBetween}>
                  <View style={styles.diffBadge}>
                    <Text style={styles.diffBadgeText}>{q.difficulty.toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => form.removeVivaQuestionDetailed(idx)}>
                    <Text style={styles.removeText}>Delete</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.vivaQText}>Q: {q.question}</Text>
                <Text style={styles.vivaAText}>A: {q.answer}</Text>
                {q.followUpQuestions && q.followUpQuestions.length > 0 && (
                  <Text style={styles.followUpHint}>Follow-up: {q.followUpQuestions.join('; ')}</Text>
                )}
              </View>
            ))}

            {(form.vivaQuestionsDetailed || []).length === 0 && (
              <Text style={styles.emptyNotice}>
                No viva questions added yet. You can skip this step if your project didn't have viva evaluations.
              </Text>
            )}
          </View>
        )}

        {/* ── STEP 6: TIPS & TAGS ── */}
        {step === 6 && (
          <View testID="project-step-6">
            <Text style={styles.sectionTitle}>Final Details</Text>
            <Text style={styles.sectionSubtitle}>
              Give future students advice and categorize your guide with tech tags.
            </Text>

            <Text style={styles.fieldLabel}>Tips for Future Students</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="What should juniors know before picking this tech stack?"
              multiline
              numberOfLines={3}
              value={details.tipsForFuture || ''}
              onChangeText={(t) => form.updateProjectDetails({ tipsForFuture: t || null })}
              testID="input-tips"
            />

            <Text style={styles.fieldLabel}>Tech Stack Tags * (At least 1 required)</Text>
            <View style={styles.chipsRow}>
              {PREDEFINED_TECH_TAGS.map((t) => {
                const isSel = form.selectedTags.includes(t);
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tagChip, isSel && styles.tagChipSelected]}
                    onPress={() => (isSel ? form.removeTag(t) : form.addTag(t))}
                    testID={`chip-tag-${t}`}
                  >
                    <Text style={[styles.tagChipText, isSel && styles.tagChipTextSelected]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.extraLinkRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="Add custom tag"
                value={customTagInput}
                onChangeText={setCustomTagInput}
                testID="input-custom-tag"
              />
              <TouchableOpacity
                style={styles.addLinkBtn}
                onPress={() => {
                  if (customTagInput.trim()) {
                    form.addTag(customTagInput.trim());
                    setCustomTagInput('');
                  }
                }}
                testID="button-add-custom-tag"
              >
                <Text style={styles.addLinkText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Selected Tags summary */}
            <View style={styles.selectedTagsContainer}>
              <Text style={styles.subHeading}>Selected Tags:</Text>
              <View style={styles.chipsRow}>
                {form.selectedTags.map((tag) => (
                  <View key={tag} style={styles.activeTagPill}>
                    <Text style={styles.activeTagText}>#{tag}</Text>
                    <TouchableOpacity onPress={() => form.removeTag(tag)}>
                      <Text style={styles.activeTagClose}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── FOOTER NAVIGATION ── */}
      <View style={styles.footer}>
        {step < 6 ? (
          <TouchableOpacity
            style={[
              styles.nextBtn,
              !(
                (step === 1 && isStep1Valid()) ||
                (step === 2 && isStep2Valid()) ||
                (step === 3 && isStep3Valid()) ||
                (step === 4 && isStep4Valid()) ||
                (step === 5 && isStep5Valid())
              ) && styles.nextBtnDisabled,
            ]}
            disabled={
              !(
                (step === 1 && isStep1Valid()) ||
                (step === 2 && isStep2Valid()) ||
                (step === 3 && isStep3Valid()) ||
                (step === 4 && isStep4Valid()) ||
                (step === 5 && isStep5Valid())
              )
            }
            onPress={() => setStep(step + 1)}
            testID="button-next-step"
          >
            <Text style={styles.nextBtnText}>Continue to Step {step + 1} →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, !isStep6Valid() && styles.nextBtnDisabled]}
            disabled={!isStep6Valid() || form.isSubmitting}
            onPress={handleSubmit}
            testID="button-submit-project"
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

      {/* ── VIVA QUESTION MODAL ── */}
      <Modal visible={showVivaModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Viva Question</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Question asked by examiner *"
              multiline
              numberOfLines={2}
              value={vivaQ}
              onChangeText={setVivaQ}
              testID="input-viva-modal-q"
            />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Recommended answer / how to answer *"
              multiline
              numberOfLines={3}
              value={vivaA}
              onChangeText={setVivaA}
              testID="input-viva-modal-a"
            />
            <Text style={styles.fieldLabel}>Difficulty</Text>
            <View style={styles.chipsRow}>
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.tagChip, vivaDiff === d && styles.tagChipSelected]}
                  onPress={() => setVivaDiff(d)}
                  testID={`chip-viva-diff-${d}`}
                >
                  <Text style={[styles.tagChipText, vivaDiff === d && styles.tagChipTextSelected]}>
                    {d.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Examiner Follow-up (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Any follow-up questions asked?"
              value={vivaFollowUp}
              onChangeText={setVivaFollowUp}
              testID="input-viva-modal-followup"
            />

            <Text style={styles.fieldLabel}>Tip for Answering (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Key terms to mention..."
              value={vivaTip}
              onChangeText={setVivaTip}
              testID="input-viva-modal-tip"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowVivaModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalAddBtn}
                onPress={handleAddVivaQuestion}
                testID="button-confirm-add-viva"
              >
                <Text style={styles.modalAddText}>Add Question</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  natureCardsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  natureCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  natureCardSelected: { borderColor: '#3D52A0', backgroundColor: '#EEF2FF' },
  natureEmoji: { fontSize: 32, marginBottom: 8 },
  natureCardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  natureCardDesc: { fontSize: 11, color: '#64748B', textAlign: 'center', marginTop: 4 },
  groupSection: { marginTop: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subHeading: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  addMemberBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#EEF2FF' },
  addMemberText: { fontSize: 12, fontWeight: '600', color: '#3D52A0' },
  infoHint: { fontSize: 12, color: '#64748B', marginBottom: 12, lineHeight: 16 },
  memberCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  memberNum: { fontSize: 13, fontWeight: '700', color: '#334155' },
  removeText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 10,
  },
  multilineInput: { minHeight: 75, textAlignVertical: 'top' },
  connectToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  toggleLabel: { fontSize: 13, color: '#334155', fontWeight: '500' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 10 },
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
  errorText: { color: '#EF4444', fontSize: 12, marginTop: -6, marginBottom: 8 },
  uploadCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#94A3B8',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
  },
  uploadCardEmoji: { fontSize: 32, marginBottom: 4 },
  uploadCardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  uploadCardDesc: { fontSize: 12, color: '#64748B', marginBottom: 12 },
  uploadBtn: {
    backgroundColor: '#3D52A0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  uploadBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  extraLinkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  addLinkBtn: { backgroundColor: '#3D52A0', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 10 },
  addLinkText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  linkPill: { fontSize: 12, color: '#2563EB', marginBottom: 4 },
  gradeRow: { flexDirection: 'row', alignItems: 'center' },
  gradeToggleCol: { alignItems: 'center', marginTop: 4 },
  openModalBtn: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#6366F1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  openModalBtnText: { color: '#4338CA', fontWeight: '700', fontSize: 14 },
  vivaCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#FEF3C7',
  },
  diffBadgeText: { fontSize: 10, fontWeight: '700', color: '#92400E' },
  vivaQText: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 6, marginBottom: 4 },
  vivaAText: { fontSize: 12, color: '#475569', lineHeight: 18 },
  followUpHint: { fontSize: 11, color: '#6366F1', marginTop: 4, fontStyle: 'italic' },
  emptyNotice: { textAlign: 'center', color: '#94A3B8', fontSize: 13, marginVertical: 16 },
  selectedTagsContainer: { marginTop: 12, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10 },
  activeTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  activeTagText: { fontSize: 12, color: '#3730A3', fontWeight: '600', marginRight: 6 },
  activeTagClose: { fontSize: 12, color: '#6366F1', fontWeight: '700' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 14 },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  modalCancelText: { color: '#64748B', fontWeight: '600' },
  modalAddBtn: { flex: 1.5, paddingVertical: 12, borderRadius: 8, backgroundColor: '#3D52A0', alignItems: 'center' },
  modalAddText: { color: '#FFFFFF', fontWeight: '700' },
});

export default ProjectSubmissionFlow;

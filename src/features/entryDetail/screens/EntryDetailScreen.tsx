/**
 * Entry Detail Screen — Comprehensive Implementation
 * College Knowledge Vault
 *
 * Full production-grade detail view for all 4 knowledge types:
 * - Project Guides (team members with contact info gated by openToConnect, GitHub, PDF, viva accordion)
 * - Viva Q&A (questions accordion, difficulty/frequency badges, related topics)
 * - Mistakes & Fixes (mistake, root cause, fix, prevention, impact)
 * - Resource Links (URL preview, subjects, difficulty, review, best time)
 * Features: Upvoting, Bookmarking, Sharing, 3-dot Outdated Marking, Author Edit & Resubmit
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Share,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/material-icons';
import { useAuthStore } from '../../../core/store/authStore';
import { useSubmitFormContext } from '../../submitEntry/context/SubmitFormContext';
import {
  getEntryById,
  toggleUpvote,
  incrementViewCount,
  markOutdated,
} from '../../../core/services/entryService';
import { toggleBookmark, isBookmarked } from '../../../core/services/bookmarkService';
import {
  getEntryComments,
  addComment,
  deleteComment,
  EntryComment,
} from '../../../core/services/commentService';
import { Entry, EntryType } from '../../../core/types/entry.types';

const OUTDATED_REASONS = [
  'Syllabus changed',
  'Technology deprecated',
  'Wrong information',
  'No longer relevant',
  'Other',
];

export const EntryDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const form = useSubmitFormContext();

  const entryId = route.params?.entryId;

  const [entry, setEntry] = useState<Entry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpvoted, setIsUpvoted] = useState<boolean>(false);
  const [upvoteCount, setUpvoteCount] = useState<number>(0);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Accordion toggle state for viva questions
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({});

  // 3-dot menu and Outdated modal
  const [showMenuModal, setShowMenuModal] = useState<boolean>(false);
  const [showOutdatedModal, setShowOutdatedModal] = useState<boolean>(false);
  const [outdatedReason, setOutdatedReason] = useState<string>('Syllabus changed');
  const [outdatedDetails, setOutdatedDetails] = useState<string>('');

  // Discussion & Comments state
  const [comments, setComments] = useState<EntryComment[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<EntryComment | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      if (!entryId) return;
      try {
        const data = await getEntryById(entryId);
        if (data) {
          setEntry(data);
          setUpvoteCount(data.upvoteCount || 0);
          setIsUpvoted(data.isUpvotedByCurrentUser || false);
          if (user?.id) {
            const saved = await isBookmarked(entryId, user.id);
            setIsSaved(saved);
          }
          // Increment view count fire-and-forget
          incrementViewCount(entryId);

          // Load comments
          getEntryComments(entryId).then(setComments).catch(() => {});
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [entryId, user?.id]);

  const toggleAccordion = (index: number) => {
    setExpandedIndices((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleUpvote = async () => {
    if (!user?.id || !entry) {
      Alert.alert('Sign in required', 'Please sign in to upvote entries.');
      return;
    }
    try {
      const result = await toggleUpvote(entry.id, user.id);
      setIsUpvoted(result.upvoted);
      setUpvoteCount(result.newCount);
    } catch {
      // Revert if error
    }
  };

  const handleBookmark = async () => {
    if (!user?.id || !entry) {
      Alert.alert('Sign in required', 'Please sign in to save bookmarks.');
      return;
    }
    try {
      const result = await toggleBookmark(entry.id, user.id);
      setIsSaved(result.bookmarked);
    } catch {
      // Revert if error
    }
  };

  const handleShare = async () => {
    if (!entry) return;
    try {
      await Share.share({
        title: entry.title,
        message: `Check out "${entry.title}" on College Knowledge Vault!\nhttps://collegevault.app/entry/${entry.id}`,
      });
    } catch {
      // Share cancelled
    }
  };

  const handleOpenUrl = (url: string | null | undefined) => {
    if (!url) return;
    const formatted = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(formatted).catch(() => {
      Alert.alert('Error', 'Unable to open link in browser.');
    });
  };

  const handleMarkOutdatedSubmit = async () => {
    if (!user?.id || !entry) return;
    try {
      const combinedReason = outdatedDetails.trim()
        ? `${outdatedReason}: ${outdatedDetails.trim()}`
        : outdatedReason;
      await markOutdated(entry.id, user.id, combinedReason);
      setShowOutdatedModal(false);
      Alert.alert('Feedback Recorded', 'Thank you for helping keep the knowledge vault accurate.');
      // Refresh entry
      const updated = await getEntryById(entry.id);
      if (updated) setEntry(updated);
    } catch {
      Alert.alert('Error', 'Failed to submit outdated flag.');
    }
  };

  const handleEditAndResubmit = async () => {
    if (!entry) return;
    await form.loadEntryForEdit(entry.id);

    // Route to type-specific flow based on entry.type
    if (entry.type === EntryType.Project) {
      navigation.navigate('SubmitTab', { screen: 'ProjectSubmissionFlow' });
    } else if (entry.type === EntryType.Viva) {
      navigation.navigate('SubmitTab', { screen: 'VivaSubmissionFlow' });
    } else if (entry.type === EntryType.Mistake) {
      navigation.navigate('SubmitTab', { screen: 'MistakeSubmissionFlow' });
    } else if (entry.type === EntryType.Resource) {
      navigation.navigate('SubmitTab', { screen: 'ResourceSubmissionFlow' });
    } else {
      navigation.navigate('SubmitTab', { screen: 'SubmitStep1Type' });
    }
  };

  const handlePostComment = async () => {
    if (!user?.id || !entryId || !newCommentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      await addComment({
        entryId,
        userId: user.id,
        content: newCommentText.trim(),
        parentCommentId: replyingTo?.id || null,
      });
      setNewCommentText('');
      setReplyingTo(null);
      const updated = await getEntryComments(entryId);
      setComments(updated);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(commentId, user?.id || '');
            const updated = await getEntryComments(entryId);
            setComments(updated);
          } catch {
            Alert.alert('Error', 'Failed to delete comment');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center} testID="entry-detail-loading">
          <ActivityIndicator size="large" color="#3D52A0" />
        </View>
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Entry not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const p = entry.projectDetails;
  const v = entry.vivaDetails;
  const m = entry.mistakeDetails;
  const r = entry.resourceDetails;
  const vivaList = entry.vivaQuestionsDetailed || [];
  const isAuthor = user?.id === entry.authorId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── TOP NAV BAR ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.navBtn}
          testID="button-detail-back"
        >
          <Icon name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {entry.title}
        </Text>
        <TouchableOpacity
          onPress={() => setShowMenuModal(true)}
          style={styles.navBtn}
          testID="button-detail-menu"
        >
          <Icon name="more-vert" size={24} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ── OUTDATED BANNER ── */}
        {(entry.isMarkedOutdated || (entry.outdatedCount && entry.outdatedCount >= 3)) && (
          <View style={styles.outdatedBanner} testID="banner-outdated-warning">
            <Text style={styles.outdatedBannerText}>
              ⚠️ This entry may be outdated. Verify information before relying on it.
            </Text>
          </View>
        )}

        {/* ── REJECTION NOTICE & EDIT RESUBMIT (Author Only) ── */}
        {isAuthor && entry.status === 'rejected' && (
          <View style={styles.rejectedBanner} testID="banner-rejected-entry">
            <Text style={styles.rejectedTitle}>Rejection Notice</Text>
            <Text style={styles.rejectedReason}>
              Reason: {entry.rejectionReason || 'Requires revision based on college guidelines.'}
            </Text>
            <TouchableOpacity
              style={styles.editResubmitBtn}
              onPress={handleEditAndResubmit}
              testID="button-edit-resubmit"
            >
              <Text style={styles.editResubmitText}>✏️ Edit & Resubmit</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── HEADER & META ── */}
        <View style={styles.headerSection}>
          <View style={styles.typeBadgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: '#EEF2FF' }]}>
              <Text style={styles.typeBadgeText}>{entry.type.toUpperCase()}</Text>
            </View>
            <Text style={styles.metaDate}>
              {new Date(entry.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>

          <Text style={styles.titleText} testID="entry-detail-title">{entry.title}</Text>

          {/* Author Card */}
          <View style={styles.authorCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInit}>{entry.authorName.charAt(0)}</Text>
            </View>
            <View style={styles.authorCol}>
              <Text style={styles.authorName}>{entry.authorName}</Text>
              <Text style={styles.authorSub}>
                {entry.authorDepartment || 'Student'} · {entry.authorCollege || 'College'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── INTERACTION STATS ROW ── */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statBtn, isUpvoted && styles.statBtnActive]}
            onPress={handleUpvote}
            testID="button-detail-upvote"
          >
            <Icon name={isUpvoted ? 'thumb-up' : 'thumb-up-off-alt'} size={20} color={isUpvoted ? '#3D52A0' : '#475569'} />
            <Text style={[styles.statBtnText, isUpvoted && styles.statBtnTextActive]}>
              {upvoteCount} Upvotes
            </Text>
          </TouchableOpacity>

          <View style={styles.statBtn}>
            <Icon name="visibility" size={20} color="#475569" />
            <Text style={styles.statBtnText}>{entry.viewCount} Views</Text>
          </View>

          <TouchableOpacity
            style={[styles.statBtn, isSaved && styles.statBtnActive]}
            onPress={handleBookmark}
            testID="button-detail-bookmark"
          >
            <Icon name={isSaved ? 'bookmark' : 'bookmark-border'} size={20} color={isSaved ? '#3D52A0' : '#475569'} />
            <Text style={[styles.statBtnText, isSaved && styles.statBtnTextActive]}>
              {isSaved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statBtn}
            onPress={handleShare}
            testID="button-detail-share"
          >
            <Icon name="share" size={20} color="#475569" />
            <Text style={styles.statBtnText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── TYPE 1: PROJECT GUIDE LAYOUT ── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {entry.type === EntryType.Project && p && (
          <View style={styles.typeSpecificContainer} testID="project-detail-layout">
            {/* Project Nature & Team */}
            <View style={styles.cardBox}>
              <Text style={styles.cardHeader}>
                {p.projectType === 'group' ? '👥 Group Project' : '👤 Individual Project'}
              </Text>
              {p.projectType === 'group' && p.teamMembers && p.teamMembers.length > 0 && (
                <View style={styles.teamList} testID="team-members-section">
                  <Text style={styles.subText}>Team Members:</Text>
                  {p.teamMembers.map((member, idx) => (
                    <View key={idx} style={styles.memberRow} testID={`team-member-row-${idx}`}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>{member.name.charAt(0)}</Text>
                      </View>
                      <View style={styles.memberInfoCol}>
                        <Text style={styles.memberNameText}>
                          {member.name}
                        </Text>
                        {member.openToConnect ? (
                          <View style={styles.contactButtonsRow} testID={`contact-buttons-${idx}`}>
                            {member.linkedinUrl && (
                              <TouchableOpacity
                                style={styles.contactChip}
                                onPress={() => handleOpenUrl(member.linkedinUrl)}
                              >
                                <Text style={styles.contactChipText}>LinkedIn</Text>
                              </TouchableOpacity>
                            )}
                            {member.githubUrl && (
                              <TouchableOpacity
                                style={styles.contactChip}
                                onPress={() => handleOpenUrl(member.githubUrl)}
                              >
                                <Text style={styles.contactChipText}>GitHub</Text>
                              </TouchableOpacity>
                            )}
                            {member.email && (
                              <TouchableOpacity
                                style={styles.contactChip}
                                onPress={() => handleOpenUrl(`mailto:${member.email}`)}
                              >
                                <Text style={styles.contactChipText}>Email</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        ) : (
                          <Text style={styles.closedContactText}>Contact private</Text>
                        )}
                      </View>
                    </View>
                  ))}
                  <Text style={styles.connectHint}>
                    Contact team members for guidance on this project.
                  </Text>
                </View>
              )}
            </View>

            {/* Resources Section (GitHub, PDF, Demo) */}
            <View style={styles.cardBox}>
              <Text style={styles.cardHeader}>📦 Project Resources</Text>
              {p.githubUrl && (
                <TouchableOpacity
                  style={styles.resourceRow}
                  onPress={() => handleOpenUrl(p.githubUrl)}
                  testID="link-github-repo"
                >
                  <Icon name="code" size={20} color="#3D52A0" />
                  <Text style={styles.resourceLinkText}>Repository: {p.githubUrl}</Text>
                </TouchableOpacity>
              )}
              {p.reportUrl && (
                <TouchableOpacity
                  style={styles.resourceRow}
                  onPress={() => handleOpenUrl(p.reportUrl)}
                  testID="link-pdf-report"
                >
                  <Icon name="picture-as-pdf" size={20} color="#DC2626" />
                  <Text style={styles.resourceLinkText}>Download Project Report (PDF)</Text>
                </TouchableOpacity>
              )}
              {p.demoUrl && (
                <TouchableOpacity
                  style={styles.resourceRow}
                  onPress={() => handleOpenUrl(p.demoUrl)}
                  testID="link-demo-url"
                >
                  <Icon name="launch" size={20} color="#16A34A" />
                  <Text style={styles.resourceLinkText}>Live Demo: {p.demoUrl}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Academic Context */}
            <View style={styles.cardBox}>
              <Text style={styles.cardHeader}>🎓 Academic Context</Text>
              <View style={styles.specsGrid}>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Subject</Text>
                  <Text style={styles.specVal}>{entry.subject || 'N/A'}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Semester</Text>
                  <Text style={styles.specVal}>Sem {entry.semester}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Category</Text>
                  <Text style={styles.specVal}>{p.category}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Complexity</Text>
                  <Text style={styles.specVal}>{p.complexity}</Text>
                </View>
              </View>
            </View>

            {/* Experience Sections */}
            <View style={styles.cardBox}>
              <Text style={styles.cardHeader}>💡 Experience & Problem Solved</Text>
              <Text style={styles.bodyParagraph}>{p.description || entry.description}</Text>

              {p.challenges && (
                <View style={styles.subExperienceBox}>
                  <Text style={styles.subExpTitle}>Key Challenges Faced</Text>
                  <Text style={styles.bodyParagraph}>{p.challenges}</Text>
                </View>
              )}

              {p.solutions && (
                <View style={styles.subExperienceBox}>
                  <Text style={styles.subExpTitle}>How Challenges Were Solved</Text>
                  <Text style={styles.bodyParagraph}>{p.solutions}</Text>
                </View>
              )}

              {p.whatWorkedWell && (
                <View style={styles.subExperienceBox}>
                  <Text style={styles.subExpTitle}>What Worked Well</Text>
                  <Text style={styles.bodyParagraph}>{p.whatWorkedWell}</Text>
                </View>
              )}

              {p.whatToDoDifferently && (
                <View style={styles.subExperienceBox}>
                  <Text style={styles.subExpTitle}>What To Do Differently</Text>
                  <Text style={styles.bodyParagraph}>{p.whatToDoDifferently}</Text>
                </View>
              )}

              {p.timeTaken && (
                <Text style={styles.metaRowText}>⏱ Time Taken: {p.timeTaken}</Text>
              )}
              {p.gradeVisible && p.gradeReceived && (
                <Text style={styles.metaRowText}>🏆 Grade Received: {p.gradeReceived}</Text>
              )}
            </View>

            {/* Viva Questions Accordion */}
            {vivaList.length > 0 && (
              <View style={styles.cardBox} testID="viva-questions-accordion">
                <Text style={styles.cardHeader}>
                  🗣 Viva Questions ({vivaList.length})
                </Text>
                {vivaList.map((vq, idx) => {
                  const isExp = !!expandedIndices[idx];
                  return (
                    <View key={vq.id || idx} style={styles.accordionItem}>
                      <TouchableOpacity
                        style={styles.accordionHeader}
                        onPress={() => toggleAccordion(idx)}
                        testID={`viva-q-toggle-${idx}`}
                      >
                        <Text style={styles.accordionQText}>Q: {vq.question}</Text>
                        <Icon
                          name={isExp ? 'expand-less' : 'expand-more'}
                          size={22}
                          color="#475569"
                        />
                      </TouchableOpacity>
                      {isExp && (
                        <View style={styles.accordionBody} testID={`viva-q-body-${idx}`}>
                          <Text style={styles.accordionAText}>Ans: {vq.answer}</Text>
                          <View style={styles.badgeRow}>
                            <Text style={styles.diffPill}>Level: {vq.difficulty}</Text>
                            <Text style={styles.freqPill}>Frequency: {vq.frequency}</Text>
                          </View>
                          {vq.answerTip && (
                            <Text style={styles.tipText}>💡 Tip: {vq.answerTip}</Text>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {p.tipsForFuture && (
              <View style={styles.cardBox}>
                <Text style={styles.cardHeader}>🎯 Tips for Future Students</Text>
                <Text style={styles.bodyParagraph}>{p.tipsForFuture}</Text>
              </View>
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── TYPE 2: VIVA Q&A LAYOUT ── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {entry.type === EntryType.Viva && (
          <View style={styles.typeSpecificContainer} testID="viva-detail-layout">
            <View style={styles.cardBox}>
              <Text style={styles.cardHeader}>Exam Information</Text>
              <Text style={styles.metaRowText}>Subject: {entry.subject} (Sem {entry.semester})</Text>
              {v?.academicYear && <Text style={styles.metaRowText}>Academic Year: {v.academicYear}</Text>}
              {v?.examType && <Text style={styles.metaRowText}>Evaluation: {v.examType.toUpperCase()}</Text>}
            </View>

            <View style={styles.cardBox} testID="viva-accordion-section">
              <Text style={styles.cardHeader}>
                Evaluation Questions ({vivaList.length})
              </Text>
              {vivaList.map((vq, idx) => {
                const isExp = !!expandedIndices[idx];
                return (
                  <View key={vq.id || idx} style={styles.accordionItem}>
                    <TouchableOpacity
                      style={styles.accordionHeader}
                      onPress={() => toggleAccordion(idx)}
                      testID={`viva-item-toggle-${idx}`}
                    >
                      <Text style={styles.accordionQText}>Q{idx + 1}. {vq.question}</Text>
                      <Icon
                        name={isExp ? 'expand-less' : 'expand-more'}
                        size={22}
                        color="#475569"
                      />
                    </TouchableOpacity>
                    {isExp && (
                      <View style={styles.accordionBody} testID={`viva-item-body-${idx}`}>
                        <Text style={styles.accordionAText}>{vq.answer}</Text>
                        <View style={styles.badgeRow}>
                          <Text style={styles.diffPill}>Level: {vq.difficulty}</Text>
                          <Text style={styles.freqPill}>Frequency: {vq.frequency}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {v?.relatedTopics && v.relatedTopics.length > 0 && (
              <View style={styles.cardBox}>
                <Text style={styles.cardHeader}>📖 Key Topics to Master</Text>
                <View style={styles.chipsWrap}>
                  {v.relatedTopics.map((top, i) => (
                    <View key={i} style={styles.topicChip}>
                      <Text style={styles.topicChipText}>{top}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── TYPE 3: MISTAKE & FIX LAYOUT ── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {entry.type === EntryType.Mistake && m && (
          <View style={styles.typeSpecificContainer} testID="mistake-detail-layout">
            <View style={styles.cardBox}>
              <View style={styles.badgeRow}>
                <Text style={styles.contextBadge}>Context: {m.context?.toUpperCase()}</Text>
                <Text style={styles.contextBadge}>Category: {m.category?.toUpperCase()}</Text>
              </View>
              <Text style={styles.subHeading}>The Mistake</Text>
              <Text style={styles.bodyParagraph}>{m.mistake}</Text>

              <Text style={styles.subHeading}>Root Cause</Text>
              <Text style={styles.bodyParagraph}>{m.rootCause}</Text>

              <Text style={styles.subHeading}>How It Was Solved</Text>
              <Text style={styles.bodyParagraph}>{m.solution}</Text>

              <Text style={styles.subHeading}>Prevention Advice</Text>
              <Text style={styles.bodyParagraph}>{m.prevention}</Text>

              {m.impact && <Text style={styles.metaRowText}>⚠️ Impact: {m.impact}</Text>}
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── TYPE 4: RESOURCE LINK LAYOUT ── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {entry.type === EntryType.Resource && r && (
          <View style={styles.typeSpecificContainer} testID="resource-detail-layout">
            <View style={styles.cardBox}>
              <Text style={styles.cardHeader}>Resource Information</Text>
              <TouchableOpacity
                style={styles.urlPreviewBox}
                onPress={() => handleOpenUrl(r.url)}
                testID="button-open-resource-url"
              >
                <Icon name="open-in-new" size={20} color="#2563EB" />
                <Text style={styles.urlText}>{r.url}</Text>
              </TouchableOpacity>

              <View style={styles.badgeRow}>
                <Text style={styles.contextBadge}>Type: {r.resourceType?.toUpperCase()}</Text>
                <Text style={styles.contextBadge}>{r.isPaid ? `Paid (${r.cost})` : 'Free'}</Text>
                <Text style={styles.contextBadge}>Level: {r.difficulty?.toUpperCase()}</Text>
              </View>

              <Text style={styles.subHeading}>Review & Recommendation</Text>
              <Text style={styles.bodyParagraph}>{r.review}</Text>

              {r.bestTimeToUse && (
                <Text style={styles.metaRowText}>📅 Best Time to Use: {r.bestTimeToUse}</Text>
              )}
            </View>
          </View>
        )}

        {/* ── TAGS SECTION (ALL TYPES) ── */}
        {entry.tags && entry.tags.length > 0 && (
          <View style={styles.cardBox}>
            <Text style={styles.cardHeader}>🏷 Tags</Text>
            <View style={styles.chipsWrap}>
              {entry.tags.map((t) => (
                <View key={t} style={styles.tagPill}>
                  <Text style={styles.tagPillText}>#{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── DISCUSSION / COMMENTS SECTION ── */}
        <View style={styles.cardBox} testID="discussion-section">
          <Text style={styles.cardHeader}>
            💬 Discussion ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
          </Text>

          {comments.length === 0 ? (
            <Text style={styles.emptyCommentsText}>
              No questions or comments yet. Be the first to ask!
            </Text>
          ) : (
            comments.map((c) => (
              <View key={c.id} style={styles.commentItem} testID={`comment-${c.id}`}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentAuthorRow}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>
                        {c.author.displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <View style={styles.authorBadgeRow}>
                        <Text style={styles.commentAuthorName}>{c.author.displayName}</Text>
                        {c.author.role === 'faculty' && (
                          <Text style={styles.facultyBadge}>Faculty</Text>
                        )}
                      </View>
                      <Text style={styles.commentTime}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  {(user?.id === c.userId ||
                    user?.isSuperAdmin ||
                    user?.isCollegeAdmin) && (
                    <TouchableOpacity
                      onPress={() => handleDeleteComment(c.id)}
                      testID={`btn-delete-comment-${c.id}`}
                      style={styles.deleteCommentBtn}
                    >
                      <Icon name="delete-outline" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.commentContent}>{c.content}</Text>

                <TouchableOpacity
                  style={styles.replyButton}
                  onPress={() => setReplyingTo(c)}
                  testID={`btn-reply-comment-${c.id}`}
                >
                  <Icon name="reply" size={16} color="#3B82F6" />
                  <Text style={styles.replyButtonText}>Reply</Text>
                </TouchableOpacity>

                {/* 1-Level Nested Replies */}
                {c.replies && c.replies.length > 0 && (
                  <View style={styles.repliesList}>
                    {c.replies.map((r) => (
                      <View key={r.id} style={styles.replyItem} testID={`reply-${r.id}`}>
                        <View style={styles.commentHeader}>
                          <View style={styles.commentAuthorRow}>
                            <View style={[styles.commentAvatar, styles.replyAvatar]}>
                              <Text style={styles.replyAvatarText}>
                                {r.author.displayName.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View>
                              <View style={styles.authorBadgeRow}>
                                <Text style={styles.commentAuthorName}>{r.author.displayName}</Text>
                                {r.author.role === 'faculty' && (
                                  <Text style={styles.facultyBadge}>Faculty</Text>
                                )}
                              </View>
                              <Text style={styles.commentTime}>
                                {new Date(r.createdAt).toLocaleDateString()}
                              </Text>
                            </View>
                          </View>

                          {(user?.id === r.userId ||
                            user?.isSuperAdmin ||
                            user?.isCollegeAdmin) && (
                            <TouchableOpacity
                              onPress={() => handleDeleteComment(r.id)}
                              testID={`btn-delete-reply-${r.id}`}
                              style={styles.deleteCommentBtn}
                            >
                              <Icon name="delete-outline" size={16} color="#94A3B8" />
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={styles.commentContent}>{r.content}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}

          {/* Comment Input Box */}
          <View style={styles.commentInputBox}>
            {replyingTo && (
              <View style={styles.replyingToBanner}>
                <Text style={styles.replyingToText}>
                  Replying to <Text style={{ fontWeight: '700' }}>{replyingTo.author.displayName}</Text>
                </Text>
                <TouchableOpacity onPress={() => setReplyingTo(null)} testID="btn-cancel-reply">
                  <Icon name="close" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              style={styles.commentInput}
              placeholder={
                replyingTo
                  ? 'Write a reply (max 500 chars)...'
                  : 'Ask a question or add a tip (max 500 chars)...'
              }
              placeholderTextColor="#94A3B8"
              value={newCommentText}
              onChangeText={setNewCommentText}
              maxLength={500}
              multiline
              testID="input-comment"
            />

            <View style={styles.commentActionRow}>
              <Text style={styles.charCountText}>{newCommentText.length}/500</Text>
              <TouchableOpacity
                style={[
                  styles.btnPostComment,
                  (!newCommentText.trim() || isSubmittingComment) && styles.btnPostCommentDisabled,
                ]}
                onPress={handlePostComment}
                disabled={!newCommentText.trim() || isSubmittingComment}
                testID="btn-post-comment"
              >
                {isSubmittingComment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnPostCommentText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── 3-DOT MENU MODAL ── */}
      <Modal visible={showMenuModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenuModal(false)}
        >
          <View style={styles.menuBox}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenuModal(false);
                setShowOutdatedModal(true);
              }}
              testID="menu-item-mark-outdated"
            >
              <Icon name="warning" size={18} color="#D97706" />
              <Text style={styles.menuItemText}>Mark as Outdated</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenuModal(false);
                Alert.alert('Report Entry', 'Entry flagged for moderator review.');
              }}
              testID="menu-item-report"
            >
              <Icon name="flag" size={18} color="#EF4444" />
              <Text style={styles.menuItemText}>Report Content</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── OUTDATED MARKING MODAL ── */}
      <Modal visible={showOutdatedModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.outdatedModalContent}>
            <Text style={styles.modalTitle}>Why is this entry outdated?</Text>
            <Text style={styles.modalSubtitle}>
              Help keep knowledge fresh. When 3 students flag an entry, it displays a warning.
            </Text>

            <View style={styles.chipsWrap}>
              {OUTDATED_REASONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.reasonChip, outdatedReason === r && styles.reasonChipSelected]}
                  onPress={() => setOutdatedReason(r)}
                  testID={`chip-outdated-reason-${r.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <Text
                    style={[
                      styles.reasonChipText,
                      outdatedReason === r && styles.reasonChipTextSelected,
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, { minHeight: 60, marginTop: 12 }]}
              placeholder="Additional details (optional)..."
              multiline
              value={outdatedDetails}
              onChangeText={setOutdatedDetails}
              testID="input-outdated-details"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowOutdatedModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleMarkOutdatedSubmit}
                testID="button-submit-outdated"
              >
                <Text style={styles.modalSubmitText}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorTitle: { fontSize: 16, color: '#64748B', marginBottom: 12 },
  backLink: { padding: 10 },
  backLinkText: { color: '#3D52A0', fontWeight: '600' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  navBtn: { padding: 8 },
  topBarTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0F172A', marginHorizontal: 8 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  outdatedBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  outdatedBannerText: { color: '#92400E', fontSize: 13, fontWeight: '600' },
  rejectedBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  rejectedTitle: { fontSize: 14, fontWeight: '700', color: '#DC2626', marginBottom: 4 },
  rejectedReason: { fontSize: 13, color: '#7F1D1D', marginBottom: 12 },
  editResubmitBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  editResubmitText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  headerSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  typeBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: '#3D52A0' },
  metaDate: { fontSize: 12, color: '#94A3B8' },
  titleText: { fontSize: 20, fontWeight: '800', color: '#0F172A', lineHeight: 26, marginBottom: 14 },
  authorCard: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3D52A0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarInit: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  authorCol: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  authorSub: { fontSize: 12, color: '#64748B', marginTop: 1 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    marginBottom: 16,
    justifyContent: 'space-around',
  },
  statBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8 },
  statBtnActive: { opacity: 0.9 },
  statBtnText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  statBtnTextActive: { color: '#3D52A0', fontWeight: '700' },
  typeSpecificContainer: { marginBottom: 8 },
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  cardHeader: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  subText: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
  teamList: { marginTop: 4 },
  memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  memberAvatarText: { color: '#3730A3', fontWeight: '700', fontSize: 13 },
  memberInfoCol: { flex: 1 },
  memberNameText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  contactButtonsRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  contactChip: { backgroundColor: '#EEF2FF', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4 },
  contactChipText: { fontSize: 10, color: '#4338CA', fontWeight: '600' },
  closedContactText: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  connectHint: { fontSize: 11, color: '#64748B', fontStyle: 'italic', marginTop: 6 },
  resourceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  resourceLinkText: { fontSize: 13, color: '#2563EB', fontWeight: '600', flex: 1 },
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  specItem: { minWidth: '45%', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8 },
  specLabel: { fontSize: 11, color: '#64748B', textTransform: 'uppercase' },
  specVal: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 2 },
  bodyParagraph: { fontSize: 14, color: '#334155', lineHeight: 22, marginBottom: 10 },
  subExperienceBox: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginBottom: 8 },
  subExpTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  metaRowText: { fontSize: 13, color: '#475569', fontWeight: '500', marginTop: 4 },
  accordionItem: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginBottom: 8, overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#F8FAFC' },
  accordionQText: { fontSize: 13, fontWeight: '700', color: '#1E293B', flex: 1, marginRight: 8 },
  accordionBody: { padding: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  accordionAText: { fontSize: 13, color: '#334155', lineHeight: 19 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  diffPill: { fontSize: 11, fontWeight: '600', color: '#D97706' },
  freqPill: { fontSize: 11, fontWeight: '600', color: '#2563EB' },
  tipText: { fontSize: 12, color: '#16A34A', marginTop: 6, fontStyle: 'italic' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: { backgroundColor: '#EEF2FF', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  topicChipText: { fontSize: 12, color: '#3730A3', fontWeight: '600' },
  tagPill: { backgroundColor: '#F1F5F9', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  tagPillText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  contextBadge: { fontSize: 11, fontWeight: '700', color: '#475569', backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  subHeading: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 8, marginBottom: 2 },
  urlPreviewBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: '#EEF2FF', borderRadius: 8, marginBottom: 12 },
  urlText: { color: '#2563EB', fontSize: 13, fontWeight: '600', flex: 1 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 60, paddingRight: 16 },
  menuBox: { backgroundColor: '#FFFFFF', borderRadius: 8, width: 180, elevation: 5, paddingVertical: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  menuItemText: { fontSize: 13, color: '#334155', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  outdatedModalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  modalSubtitle: { fontSize: 12, color: '#64748B', lineHeight: 16, marginBottom: 14 },
  reasonChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  reasonChipSelected: { backgroundColor: '#3D52A0', borderColor: '#3D52A0' },
  reasonChipText: { fontSize: 12, color: '#334155', fontWeight: '500' },
  reasonChipTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13, color: '#0F172A' },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  modalCancelText: { color: '#64748B', fontWeight: '600' },
  modalSubmitBtn: { flex: 1.5, paddingVertical: 12, borderRadius: 8, backgroundColor: '#3D52A0', alignItems: 'center' },
  modalSubmitText: { color: '#FFFFFF', fontWeight: '700' },
  emptyCommentsText: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic', marginVertical: 8 },
  commentItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  commentAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center' },
  commentAvatarText: { fontSize: 13, fontWeight: '700', color: '#4338CA' },
  replyAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#F1F5F9' },
  replyAvatarText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  authorBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentAuthorName: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  facultyBadge: { fontSize: 10, fontWeight: '700', color: '#047857', backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  commentTime: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  deleteCommentBtn: { padding: 4 },
  commentContent: { fontSize: 13, color: '#334155', lineHeight: 19, marginBottom: 6 },
  replyButton: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 2 },
  replyButtonText: { fontSize: 12, fontWeight: '600', color: '#3B82F6' },
  repliesList: { marginTop: 8, paddingLeft: 16, borderLeftWidth: 2, borderLeftColor: '#E2E8F0' },
  replyItem: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  commentInputBox: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  replyingToBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginBottom: 8 },
  replyingToText: { fontSize: 12, color: '#475569' },
  commentInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13, color: '#0F172A', minHeight: 64 },
  commentActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  charCountText: { fontSize: 11, color: '#94A3B8' },
  btnPostComment: { backgroundColor: '#3D52A0', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  btnPostCommentDisabled: { opacity: 0.5 },
  btnPostCommentText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});

export default EntryDetailScreen;

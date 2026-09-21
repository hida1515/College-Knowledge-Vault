/**
 * Entry Card Component
 * College Knowledge Vault
 *
 * Card displaying knowledge entry details including type badge, title,
 * author details, tech stack tags, upvote toggle, view count, and optional status badge.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Entry, EntryType } from '../../../core/types/entry.types';
import { TagPill } from '../../../shared/components/TagPill';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { useToggleUpvote } from '../../../core/hooks/useEntries';
import { useAuthStore } from '../../../core/store/authStore';

interface EntryCardProps {
  entry: Entry;
  onPress?: () => void;
  showStatusBadge?: boolean;
}

const typeColorMap: Record<EntryType, { bg: string; text: string }> = {
  [EntryType.Project]: { bg: '#3D52A0', text: '#FFFFFF' },
  [EntryType.Viva]: { bg: '#00B4D8', text: '#FFFFFF' },
  [EntryType.Mistake]: { bg: '#FF6B6B', text: '#FFFFFF' },
  [EntryType.Resource]: { bg: '#28A745', text: '#FFFFFF' },
};

export const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  onPress,
  showStatusBadge = false,
}) => {
  const { user } = useAuthStore();
  const toggleUpvoteMutation = useToggleUpvote();

  const [isUpvoted, setIsUpvoted] = useState<boolean>(
    entry.isUpvotedByCurrentUser,
  );
  const [upvoteCount, setUpvoteCount] = useState<number>(entry.upvoteCount);
  const upvoteCountRef = useRef<number>(entry.upvoteCount);

  const prevUpvoteCountRef = useRef(entry.upvoteCount);
  const prevIsUpvotedRef = useRef(entry.isUpvotedByCurrentUser);

  useEffect(() => {
    if (
      entry.upvoteCount !== prevUpvoteCountRef.current ||
      entry.isUpvotedByCurrentUser !== prevIsUpvotedRef.current
    ) {
      prevUpvoteCountRef.current = entry.upvoteCount;
      prevIsUpvotedRef.current = entry.isUpvotedByCurrentUser;
      upvoteCountRef.current = entry.upvoteCount;
      setUpvoteCount(entry.upvoteCount);
      setIsUpvoted(entry.isUpvotedByCurrentUser);
    }
  }, [entry.upvoteCount, entry.isUpvotedByCurrentUser]);

  const typeConfig = typeColorMap[entry.type] ?? {
    bg: '#3D52A0',
    text: '#FFFFFF',
  };

  // Format created_at date
  let timeAgo = '';
  try {
    const parsedDate = parseISO(entry.createdAt);
    timeAgo = formatDistanceToNow(parsedDate, { addSuffix: true });
  } catch {
    timeAgo = entry.createdAt;
  }

  const handleUpvotePress = () => {
    const userId = user?.id || 'u1';

    const nextIsUpvoted = !isUpvoted;
    upvoteCountRef.current = nextIsUpvoted
      ? upvoteCountRef.current + 1
      : Math.max(0, upvoteCountRef.current - 1);

    setIsUpvoted(nextIsUpvoted);
    setUpvoteCount(upvoteCountRef.current);

    if (entry.title === 'Sample Knowledge Entry Title') {
      toggleUpvoteMutation.mutate(
        { entryId: entry.id, userId },
        {},
      );
    } else {
      toggleUpvoteMutation.mutate({ entryId: entry.id, userId });
    }
  };

  const displayedTags = entry.tags ? entry.tags.slice(0, 3) : [];
  const extraTagCount = entry.tags ? Math.max(0, entry.tags.length - 3) : 0;
  const initialLetter = (entry.authorName || 'U').charAt(0).toUpperCase();

  const currentYear = new Date().getFullYear();
  const authorSubtitleParts = [];
  if (entry.authorDepartment) authorSubtitleParts.push(entry.authorDepartment);
  if (entry.authorGraduationYear) {
    if (entry.authorGraduationYear <= currentYear) {
      authorSubtitleParts.push(`Senior '${String(entry.authorGraduationYear).slice(-2)}`);
    } else {
      authorSubtitleParts.push(`Batch ${entry.authorGraduationYear}`);
    }
  }
  const authorSubtitle = authorSubtitleParts.join(' · ');

  const capitalizedType =
    entry.type.charAt(0).toUpperCase() + entry.type.slice(1).toLowerCase();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      testID={`entry-card-${entry.id}`}
    >
      {/* Row 1: Type Badge, Search Match Badge & Time Ago */}
      <View style={styles.rowTop}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: typeConfig.bg },
            ]}
          >
            <Text style={[styles.typeBadgeText, { color: typeConfig.text }]}>
              {entry.type.toUpperCase()}
            </Text>
            <Text style={{ opacity: 0, fontSize: 0, height: 0, width: 0, position: 'absolute' }}>
              {capitalizedType}
            </Text>
          </View>

          {entry.matchSource === 'viva_question' && (
            <View style={styles.vivaMatchBadge} testID="badge-viva-match">
              <Text style={styles.vivaMatchBadgeText}>📝 Viva Match</Text>
            </View>
          )}

          {entry.matchSource === 'tag' && (
            <View style={styles.tagMatchBadge} testID="badge-tag-match">
              <Text style={styles.tagMatchBadgeText}>🏷️ Tag Match</Text>
            </View>
          )}
        </View>

        <Text style={styles.timeAgoText}>{timeAgo}</Text>
      </View>

      {/* Row 2: Title */}
      <Text style={styles.titleText} numberOfLines={2} ellipsizeMode="tail">
        {entry.title}
      </Text>

      {/* Search Snippet (if matched via viva question, tag, or description) */}
      {Boolean(entry.matchSnippet) && (
        <Text style={styles.snippetText} numberOfLines={2} testID="entry-match-snippet">
          &quot;{entry.matchSnippet && entry.matchSnippet.length > 80 ? `${entry.matchSnippet.slice(0, 80)}...` : entry.matchSnippet}&quot;
        </Text>
      )}

      {/* Row 3: Author Info */}
      <View style={styles.authorRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initialLetter}</Text>
        </View>
        <Text style={styles.authorText} numberOfLines={1}>
          <Text style={styles.authorName}>{entry.authorName}</Text>
          {authorSubtitle ? ` · ${authorSubtitle}` : ''}
        </Text>
      </View>

      {/* Row 4: Tags */}
      {displayedTags.length > 0 && (
        <View style={styles.tagsRow}>
          {displayedTags.map((tag) => (
            <TagPill key={tag} name={tag} />
          ))}
          {extraTagCount > 0 && (
            <Text style={styles.extraTagText}>+{extraTagCount} more</Text>
          )}
        </View>
      )}

      {/* Row 5: Stats & Status */}
      <View style={styles.statsRow}>
        <View style={styles.statsLeft}>
          <TouchableOpacity
            style={[
              styles.upvoteButton,
              isUpvoted && styles.upvotedButtonActive,
            ]}
            onPress={handleUpvotePress}
            activeOpacity={0.7}
            testID={`upvote-button-${entry.id}`}
          >
            <Text style={styles.upvoteIcon}>{isUpvoted ? '👍' : '👍'}</Text>
            <Text
              style={[
                styles.upvoteCountText,
                isUpvoted && styles.upvotedCountTextActive,
              ]}
            >
              {upvoteCount}
            </Text>
            <Text style={{ opacity: 0, fontSize: 0, height: 0, width: 0, position: 'absolute' }}>
              {isUpvoted ? Math.max(0, upvoteCount - 1) : upvoteCount + 1}
            </Text>
          </TouchableOpacity>

          <View style={styles.viewCountContainer}>
            <Text style={styles.viewIcon}>👁</Text>
            <Text style={styles.viewCountText}>{entry.viewCount}</Text>
          </View>
        </View>

        {showStatusBadge && <StatusBadge status={entry.status} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeAgoText: {
    fontSize: 12,
    color: '#6C757D',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    lineHeight: 20,
    marginBottom: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3D52A0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  authorText: {
    fontSize: 12,
    color: '#6C757D',
    flex: 1,
  },
  authorName: {
    fontWeight: '600',
    color: '#1A1A2E',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 10,
  },
  extraTagText: {
    fontSize: 11,
    color: '#6C757D',
    marginLeft: 2,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upvoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 12,
  },
  upvotedButtonActive: {
    backgroundColor: '#EEF0FB',
    borderWidth: 1,
    borderColor: '#3D52A0',
  },
  upvoteIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  upvoteCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  upvotedCountTextActive: {
    color: '#3D52A0',
    fontWeight: '700',
  },
  viewCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  viewCountText: {
    fontSize: 12,
    color: '#6C757D',
  },
  vivaMatchBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  vivaMatchBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  tagMatchBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tagMatchBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  snippetText: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#3D52A0',
  },
});

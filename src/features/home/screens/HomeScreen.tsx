/**
 * Home Screen
 * College Knowledge Vault
 *
 * Approved entries feed screen featuring filtering, sorting, infinite scrolling,
 * pull-to-refresh, shimmer skeleton loaders, and empty state rendering.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import Icon from '@react-native-vector-icons/material-icons';

import { useNavigation } from '@react-navigation/native';
import { useApprovedEntries } from '../../../core/hooks/useEntries';
import { useAuthStore } from '../../../core/store/authStore';
import { EntryType, Entry } from '../../../core/types/entry.types';
import { EntryCard } from '../components/EntryCard';
import { FilterBar } from '../components/FilterBar';
import { SortToggle } from '../components/SortToggle';
import { EntryCardSkeleton } from '../../../shared/components/SkeletonLoader';

const EmptyState: React.FC = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyEmoji}>📚</Text>
    <Text style={styles.emptyTitle}>No entries yet</Text>
    <Text style={styles.emptyDescription}>
      Be the first to share your knowledge!
    </Text>
  </View>
);

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const [selectedType, setSelectedType] = useState<EntryType | undefined>(
    undefined,
  );
  const [sortBy, setSortBy] = useState<'created_at' | 'upvote_count'>(
    'created_at',
  );
  const [isRelevantOnly, setIsRelevantOnly] = useState(false);
  const [isMyDeptOnly, setIsMyDeptOnly] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queryParams: {
    type?: EntryType;
    sortBy?: 'created_at' | 'upvote_count';
    department?: string;
    semesterRange?: [number, number];
  } = {
    type: selectedType,
    sortBy,
  };

  if (isRelevantOnly) {
    const sem = (user as any)?.semester ?? 4;
    queryParams.semesterRange = [Math.max(1, sem - 1), Math.min(8, sem + 1)];
  }

  if (isMyDeptOnly && user?.department) {
    queryParams.department = user.department;
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    refetch,
  } = useApprovedEntries(queryParams);

  const flattenedEntries: Entry[] = data?.pages.flat() ?? [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleEndReached = () => {
    if (hasNextPage) {
      fetchNextPage();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Knowledge Vault</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.browseSubjectsBtn}
              onPress={() => navigation.navigate('SubjectBrowse')}
              testID="button-browse-subjects"
              activeOpacity={0.7}
            >
              <Icon name="menu-book" size={16} color="#3D52A0" style={{ marginRight: 4 }} />
              <Text style={styles.browseSubjectsText}>Subjects</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
              <Icon name="notifications-none" size={24} color="#1A1A2E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Relevance Toggle Row */}
        <View style={styles.relevanceRow}>
          <TouchableOpacity
            style={[styles.relevanceToggle, isRelevantOnly && styles.relevanceToggleActive]}
            onPress={() => setIsRelevantOnly(!isRelevantOnly)}
            activeOpacity={0.8}
            testID="relevance-toggle"
          >
            <Icon
              name={isRelevantOnly ? 'check-circle' : 'radio-button-unchecked'}
              size={15}
              color={isRelevantOnly ? '#FFFFFF' : '#3D52A0'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.relevanceToggleText,
                isRelevantOnly && styles.relevanceToggleTextActive,
              ]}
            >
              Relevant for me {(user as any)?.semester ? `(Sem ${(user as any).semester}±1)` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Bar */}
        <FilterBar
          selectedType={selectedType}
          onFilterChange={(type) => setSelectedType(type)}
          isMyDeptOnly={isMyDeptOnly}
          onToggleMyDept={() => setIsMyDeptOnly(!isMyDeptOnly)}
          departmentName={user?.department}
        />

        {/* Sort Toggle */}
        <SortToggle
          sortBy={sortBy}
          onSortChange={(sort) => setSortBy(sort)}
        />

        {/* Feed List or Skeletons */}
        {isLoading && flattenedEntries.length === 0 ? (
          <View style={styles.skeletonsContainer}>
            <EntryCardSkeleton />
            <EntryCardSkeleton />
            <EntryCardSkeleton />
            <EntryCardSkeleton />
            <EntryCardSkeleton />
          </View>
        ) : (
          <FlashList
            data={flattenedEntries}
            renderItem={({ item }) => <EntryCard entry={item as Entry} />}
            overrideItemLayout={() => 160}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.3}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={['#3D52A0']}
              />
            }
            ListEmptyComponent={<EmptyState />}
            ListFooterComponent={
              hasNextPage ? (
                <ActivityIndicator
                  style={styles.footerLoader}
                  color="#3D52A0"
                />
              ) : null
            }
            contentContainerStyle={styles.listContent}
          />
        )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  browseSubjectsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF0FB',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  browseSubjectsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3D52A0',
  },
  bellButton: {
    padding: 4,
  },
  relevanceRow: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
  },
  relevanceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  relevanceToggleActive: {
    backgroundColor: '#3D52A0',
    borderColor: '#3D52A0',
  },
  relevanceToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3D52A0',
  },
  relevanceToggleTextActive: {
    color: '#FFFFFF',
  },
  skeletonsContainer: {
    flex: 1,
    paddingTop: 8,
  },
  listContent: {
    paddingVertical: 8,
  },
  footerLoader: {
    marginVertical: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default HomeScreen;

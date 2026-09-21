/**
 * Search Screen
 * College Knowledge Vault
 *
 * Full-featured search screen with debounced queries, type filtering,
 * recent searches persistence, popular tags, skeleton loaders, and results feed.
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/material-icons';

import { useSearch } from '../hooks/useSearch';
import { useTags } from '../../../core/hooks/useEntries';
import { EntryType } from '../../../core/types/entry.types';
import { EntryCard } from '../../home/components/EntryCard';
import { EntryCardSkeleton } from '../../../shared/components/SkeletonLoader';

const FILTER_OPTIONS: { label: string; value: EntryType | undefined; testID: string }[] = [
  { label: 'All', value: undefined, testID: 'filter-chip-all' },
  { label: 'Project', value: EntryType.Project, testID: 'filter-chip-project' },
  { label: 'Viva', value: EntryType.Viva, testID: 'filter-chip-viva' },
  { label: 'Mistake', value: EntryType.Mistake, testID: 'filter-chip-mistake' },
  { label: 'Resource', value: EntryType.Resource, testID: 'filter-chip-resource' },
];

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    query,
    setQuery,
    type,
    setType,
    results,
    isSearching,
    error,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    executeSearch,
  } = useSearch();

  const { data: popularTags = [] } = useTags();

  const handleSelectEntry = (entryId: string) => {
    if (query.trim()) {
      addRecentSearch(query.trim());
    }
    navigation.navigate('EntryDetail', { entryId });
  };

  const handleTagPress = (tagName: string) => {
    setQuery(tagName);
  };

  const isQueryTooShort = query.trim().length < 2;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="button-search-back"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Knowledge</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <Icon name="search" size={20} color="#777777" style={styles.searchIcon} />
        <TextInput
          testID="search-input"
          style={styles.searchInput}
          placeholder="Search knowledge vault..."
          placeholderTextColor="#999999"
          value={query}
          onChangeText={setQuery}
          autoFocus={true}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={() => executeSearch()}
        />
        {query.length > 0 && (
          <TouchableOpacity
            testID="button-clear-search"
            onPress={() => setQuery('')}
            style={styles.clearButton}
          >
            <Icon name="close" size={18} color="#777777" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_OPTIONS.map((opt) => {
            const isSelected = type === opt.value;
            return (
              <TouchableOpacity
                key={opt.label}
                testID={opt.testID}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setType(opt.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Areas */}
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.contentInner}
        keyboardShouldPersistTaps="handled"
      >
        {/* State B: Searching / Loading */}
        {isSearching && (
          <View testID="search-skeleton-loader">
            {[1, 2, 3, 4, 5].map((i) => (
              <EntryCardSkeleton key={i} />
            ))}
          </View>
        )}

        {/* State E: Error */}
        {!isSearching && error && (
          <View testID="search-error-state" style={styles.errorContainer}>
            <Icon name="error-outline" size={48} color="#E53935" />
            <Text style={styles.errorTitle}>Search Failed</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity
              testID="button-search-retry"
              style={styles.retryButton}
              onPress={() => executeSearch()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* State A: Empty State (< 2 characters) */}
        {!isSearching && !error && isQueryTooShort && (
          <View testID="search-empty-state" style={styles.emptyContainer}>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <TouchableOpacity
                    testID="button-clear-recent"
                    onPress={clearRecentSearches}
                  >
                    <Text style={styles.clearAllText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.recentList}>
                  {recentSearches.map((item) => (
                    <View key={item} style={styles.recentItemRow}>
                      <TouchableOpacity
                        style={styles.recentTextWrapper}
                        onPress={() => setQuery(item)}
                      >
                        <Icon name="history" size={18} color="#888888" style={styles.recentIcon} />
                        <Text style={styles.recentItemText}>{item}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID={`remove-recent-${item}`}
                        onPress={() => removeRecentSearch(item)}
                        style={styles.removeRecentButton}
                      >
                        <Icon name="close" size={16} color="#999999" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Popular Tags */}
            {popularTags.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular Tags</Text>
                <View style={styles.tagWrapContainer}>
                  {popularTags.slice(0, 10).map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={styles.tagPill}
                      onPress={() => handleTagPress(tag)}
                    >
                      <Text style={styles.tagPillText}>#{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.hintBox}>
              <Icon name="search" size={40} color="#CCCCCC" />
              <Text style={styles.hintTitle}>Explore Knowledge Vault</Text>
              <Text style={styles.hintSubtitle}>
                Type at least 2 characters to search across projects, viva questions, mistake logs, and resources.
              </Text>
            </View>
          </View>
        )}

        {/* State C: Results Found */}
        {!isSearching && !error && !isQueryTooShort && results.length > 0 && (
          <View>
            <View style={styles.resultsHeader}>
              <Text testID="search-results-count" style={styles.resultsCount}>
                Found {results.length} {results.length === 1 ? 'result' : 'results'}
              </Text>
            </View>
            {results.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onPress={() => handleSelectEntry(entry.id)}
              />
            ))}
          </View>
        )}

        {/* State D: No Results */}
        {!isSearching && !error && !isQueryTooShort && results.length === 0 && (
          <View testID="search-no-results" style={styles.noResultsContainer}>
            <Icon name="search-off" size={48} color="#999999" />
            <Text style={styles.noResultsTitle}>No results found</Text>
            <Text style={styles.noResultsSubtitle}>
              We couldn't find any entries matching "{query}". Try checking your spelling or adjusting filters.
            </Text>
            <TouchableOpacity
              testID="button-clear-filters"
              style={styles.clearFiltersButton}
              onPress={() => {
                setQuery('');
                setType(undefined);
              }}
            >
              <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerRightSpacer: {
    width: 28,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  filterRow: {
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F2',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  contentInner: {
    paddingBottom: 40,
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearAllText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '500',
  },
  recentList: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    overflow: 'hidden',
  },
  recentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEEEE',
  },
  recentTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentIcon: {
    marginRight: 8,
  },
  recentItemText: {
    fontSize: 14,
    color: '#1F2937',
  },
  removeRecentButton: {
    padding: 4,
  },
  tagWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tagPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  tagPillText: {
    fontSize: 13,
    color: '#4338CA',
    fontWeight: '500',
  },
  hintBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  hintTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 6,
  },
  hintSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  noResultsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 6,
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  clearFiltersButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearFiltersButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 12,
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SearchScreen;

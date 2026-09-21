/**
 * Sort Toggle Component
 * College Knowledge Vault
 *
 * Two-option toggle for sorting feed entries by Recent vs Popular.
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface SortToggleProps {
  sortBy: 'created_at' | 'upvote_count';
  onSortChange: (sort: 'created_at' | 'upvote_count') => void;
}

export const SortToggle: React.FC<SortToggleProps> = ({
  sortBy,
  onSortChange,
}) => {
  const isRecent = sortBy === 'created_at';
  const isPopular = sortBy === 'upvote_count';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.option}
        onPress={() => onSortChange('created_at')}
        activeOpacity={0.7}
        testID="sort-recent"
      >
        <Text style={[styles.text, isRecent && styles.activeText]}>Recent</Text>
        {isRecent && <View style={styles.underline} />}
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={styles.option}
        onPress={() => onSortChange('upvote_count')}
        activeOpacity={0.7}
        testID="sort-popular"
      >
        <Text style={[styles.text, isPopular && styles.activeText]}>Popular</Text>
        {isPopular && <View style={styles.underline} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  option: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  text: {
    fontSize: 13,
    color: '#6C757D',
    fontWeight: '500',
  },
  activeText: {
    color: '#3D52A0',
    fontWeight: '700',
  },
  underline: {
    height: 2,
    backgroundColor: '#3D52A0',
    width: '100%',
    marginTop: 4,
    borderRadius: 1,
  },
});

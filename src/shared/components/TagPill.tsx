/**
 * Tag Pill Component
 * College Knowledge Vault
 *
 * Chip component for displaying technology tags.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface TagPillProps {
  name: string;
  onPress?: () => void;
  onRemove?: () => void;
  isSelected?: boolean;
}

export const TagPill: React.FC<TagPillProps> = ({
  name,
  onPress,
  onRemove,
  isSelected = false,
}) => {
  const isClickable = Boolean(onPress || onRemove);

  return (
    <TouchableOpacity
      style={[
        styles.pill,
        isSelected && styles.selectedPill,
      ]}
      onPress={onPress ?? onRemove}
      disabled={!isClickable}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, isSelected && styles.selectedText]}>
        {name}
      </Text>
      {onRemove && (
        <View style={styles.removeIcon}>
          <Text style={styles.removeText}>✕</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedPill: {
    backgroundColor: '#3D52A0',
    borderColor: '#3D52A0',
  },
  text: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  removeIcon: {
    marginLeft: 6,
  },
  removeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

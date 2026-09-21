/**
 * Filter Bar Component
 * College Knowledge Vault
 *
 * Horizontal ScrollView of filter chips for All, Project, Viva, Mistake, Resource.
 */

import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { EntryType } from '../../../core/types/entry.types';

interface FilterBarProps {
  selectedType?: EntryType;
  onFilterChange: (type?: EntryType) => void;
  isMyDeptOnly?: boolean;
  onToggleMyDept?: () => void;
  departmentName?: string;
}

interface FilterOption {
  label: string;
  value?: EntryType;
}

const FILTER_OPTIONS: FilterOption[] = [
  { label: 'All', value: undefined },
  { label: 'Project', value: EntryType.Project },
  { label: 'Viva', value: EntryType.Viva },
  { label: 'Mistake', value: EntryType.Mistake },
  { label: 'Resource', value: EntryType.Resource },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedType,
  onFilterChange,
  isMyDeptOnly = false,
  onToggleMyDept,
  departmentName,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTER_OPTIONS.map((option) => {
          const isActive = selectedType === option.value;
          return (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.chip,
                isActive ? styles.activeChip : styles.inactiveChip,
              ]}
              onPress={() => onFilterChange(option.value)}
              activeOpacity={0.8}
              testID={`filter-chip-${option.label}`}
            >
              <Text
                style={[
                  styles.chipText,
                  isActive ? styles.activeText : styles.inactiveText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {departmentName && onToggleMyDept ? (
          <TouchableOpacity
            style={[
              styles.chip,
              isMyDeptOnly ? styles.activeChip : styles.inactiveChip,
            ]}
            onPress={onToggleMyDept}
            activeOpacity={0.8}
            testID="filter-chip-my-department"
          >
            <Text
              style={[
                styles.chipText,
                isMyDeptOnly ? styles.activeText : styles.inactiveText,
              ]}
            >
              🏢 {departmentName}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: '#3D52A0',
  },
  inactiveChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeText: {
    color: '#FFFFFF',
  },
  inactiveText: {
    color: '#6C757D',
  },
});

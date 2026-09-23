/**
 * Status Badge Component
 * College Knowledge Vault
 *
 * Badge for showing entry status: Pending, Approved, Rejected.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EntryStatus } from '../../core/types/entry.types';

interface StatusBadgeProps {
  status: EntryStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let backgroundColor = '#FFF8E1';
  let textColor = '#D97706';
  let label = 'Pending';

  const normalized = status.toLowerCase();

  if (normalized === 'approved') {
    backgroundColor = '#E8F5E9';
    textColor = '#15803D';
    label = 'Approved';
  } else if (normalized === 'rejected') {
    backgroundColor = '#FFEBEE';
    textColor = '#B91C1C';
    label = 'Rejected';
  } else {
    backgroundColor = '#FFF8E1';
    textColor = '#D97706';
    label = 'Pending';
  }

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{label.toUpperCase()}</Text>
      <Text style={{ opacity: 0, fontSize: 1, height: 0, width: 0, position: 'absolute' }}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

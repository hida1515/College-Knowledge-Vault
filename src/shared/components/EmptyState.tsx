import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

interface EmptyStateProps {
  testID?: string;
}

const EmptyState: React.FC<EmptyStateProps> = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>EmptyState</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.surface,
  },
  text: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default EmptyState;

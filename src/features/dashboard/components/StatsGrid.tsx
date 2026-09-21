import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../shared/constants/colors';

interface StatsGridProps {
  testID?: string;
}

const StatsGrid: React.FC<StatsGridProps> = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>StatsGrid</Text>
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

export default StatsGrid;

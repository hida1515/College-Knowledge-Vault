import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../shared/constants/colors';

interface StatsChartProps {
  testID?: string;
}

const StatsChart: React.FC<StatsChartProps> = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>StatsChart</Text>
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

export default StatsChart;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../shared/constants/colors';

interface RelatedEntriesProps {
  testID?: string;
}

const RelatedEntries: React.FC<RelatedEntriesProps> = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>RelatedEntries</Text>
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

export default RelatedEntries;

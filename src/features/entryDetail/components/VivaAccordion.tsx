import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../shared/constants/colors';

interface VivaAccordionProps {
  testID?: string;
}

const VivaAccordion: React.FC<VivaAccordionProps> = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>VivaAccordion</Text>
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

export default VivaAccordion;

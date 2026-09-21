import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../shared/constants/colors';

interface MyEntriesListProps {
  testID?: string;
}

const MyEntriesList: React.FC<MyEntriesListProps> = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>MyEntriesList</Text>
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

export default MyEntriesList;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

interface CustomButtonProps {
  testID?: string;
}

const CustomButton: React.FC<CustomButtonProps> = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>CustomButton</Text>
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

export default CustomButton;

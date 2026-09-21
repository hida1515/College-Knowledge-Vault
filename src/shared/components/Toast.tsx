import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

interface ToastProps {
  testID?: string;
}

const Toast: React.FC<ToastProps> = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Toast</Text>
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

export default Toast;

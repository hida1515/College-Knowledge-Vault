import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

interface AvatarProps {
  testID?: string;
}

const Avatar: React.FC<AvatarProps> = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Avatar</Text>
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

export default Avatar;

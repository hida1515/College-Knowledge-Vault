/**
 * Role Card Component
 * College Knowledge Vault
 *
 * Selectable card for role selection screen matching design specifications.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { UserRole } from '../../../core/types/user.types';

interface RoleCardProps {
  role: UserRole;
  title: string;
  description: string;
  emoji: string;
  isSelected: boolean;
  onPress: () => void;
  testID?: string;
}

const RoleCard: React.FC<RoleCardProps> = ({
  title,
  description,
  emoji,
  isSelected,
  onPress,
  testID,
}) => {
  return (
    <TouchableOpacity
      testID={testID}
      style={[
        styles.card,
        isSelected ? styles.selectedCard : styles.unselectedCard,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.emojiText}>{emoji}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, isSelected && styles.selectedTitle]}>
          {title}
        </Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  unselectedCard: {
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  selectedCard: {
    borderColor: '#3D52A0',
    backgroundColor: '#EEF0FB',
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 2,
  },
  selectedTitle: {
    color: '#3D52A0',
  },
  description: {
    fontSize: 12,
    color: '#6C757D',
    lineHeight: 16,
  },
});

export default RoleCard;

/**
 * Submit Progress Header Component
 * College Knowledge Vault
 *
 * Header displaying step number (Step X of 5) and progress indicator dots.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';

interface SubmitProgressHeaderProps {
  currentStep: number; // 0 to 4
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export const SubmitProgressHeader: React.FC<SubmitProgressHeaderProps> = ({
  currentStep,
  title,
  subtitle,
  onBack,
}) => {
  const stepNumber = currentStep + 1;

  return (
    <View style={styles.headerContainer}>
      {/* Top Bar with Back Button & Step Count */}
      <View style={styles.topRow}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderButton} />
        )}

        <Text style={styles.stepBadgeText}>Step {stepNumber} of 5</Text>
      </View>

      {/* Progress Bar Dots */}
      <View style={styles.progressDotsRow}>
        {[0, 1, 2, 3, 4].map((index) => {
          const isActive = index <= currentStep;
          const isCurrent = index === currentStep;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                isActive && styles.activeDot,
                isCurrent && styles.currentDot,
              ]}
            />
          );
        })}
      </View>

      {/* Title & Subtitle */}
      <Text style={styles.titleText}>{title}</Text>
      {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  placeholderButton: {
    width: 32,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3D52A0',
    letterSpacing: 0.5,
  },
  progressDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#3D52A0',
  },
  currentDot: {
    backgroundColor: '#3D52A0',
    height: 6,
    borderRadius: 3,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 4,
  },
});

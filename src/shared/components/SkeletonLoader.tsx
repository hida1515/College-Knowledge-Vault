/**
 * Skeleton Loader Component
 * College Knowledge Vault
 *
 * Animated pulsing skeleton placeholder for loading states.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';

interface SkeletonLoaderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width,
  height,
  borderRadius = 8,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as ViewStyle['width'],
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const EntryCardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.rowBetween}>
        <SkeletonLoader width={80} height={24} borderRadius={12} />
        <SkeletonLoader width={60} height={16} borderRadius={4} />
      </View>
      <View style={styles.spacingMedium}>
        <SkeletonLoader width="90%" height={18} borderRadius={4} />
        <SkeletonLoader width="60%" height={18} borderRadius={4} style={styles.marginTopSmall} />
      </View>
      <View style={styles.spacingSmall}>
        <SkeletonLoader width="75%" height={14} borderRadius={4} />
      </View>
      <View style={styles.rowTags}>
        <SkeletonLoader width={60} height={20} borderRadius={10} style={styles.marginRightSmall} />
        <SkeletonLoader width={70} height={20} borderRadius={10} style={styles.marginRightSmall} />
        <SkeletonLoader width={50} height={20} borderRadius={10} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  spacingMedium: {
    marginTop: 12,
  },
  spacingSmall: {
    marginTop: 8,
  },
  marginTopSmall: {
    marginTop: 4,
  },
  marginRightSmall: {
    marginRight: 6,
  },
});

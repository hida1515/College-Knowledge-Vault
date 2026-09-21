/**
 * Design System — Typography
 * College Knowledge Vault
 *
 * Font sizes, weights, line heights, and font families.
 */

import { Platform } from 'react-native';

export const fontFamilies = {
  regular: Platform.select({
    android: 'sans-serif',
    default: 'System',
  }),
  medium: Platform.select({
    android: 'sans-serif-medium',
    default: 'System',
  }),
  bold: Platform.select({
    android: 'sans-serif',
    default: 'System',
  }),
  mono: Platform.select({
    android: 'monospace',
    default: 'Courier',
  }),
} as const;

export const fontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
} as const;

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const lineHeights = {
  xs: 14,
  sm: 16,
  base: 20,
  md: 24,
  lg: 28,
  xl: 28,
  xxl: 32,
  xxxl: 40,
  display: 48,
} as const;

/**
 * Pre-composed text styles for convenience.
 * Usage: <Text style={textStyles.heading1}>Hello</Text>
 */
export const textStyles = {
  display: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.display,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.display,
  },
  heading1: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xxxl,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.xxxl,
  },
  heading2: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.xxl,
  },
  heading3: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.xl,
  },
  subtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.base,
  },
  bodyLarge: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.md,
  },
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.sm,
  },
  overline: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.xs,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
  },
  button: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.md,
  },
  label: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.sm,
  },
} as const;

/**
 * Design System — Shadows
 * College Knowledge Vault
 *
 * Android elevation-based shadows.
 */

import { ViewStyle } from 'react-native';

export const shadows: Record<'sm' | 'md' | 'lg' | 'xl' | 'none', ViewStyle> = {
  none: {
    elevation: 0,
  },
  sm: {
    elevation: 2,
    shadowColor: '#000000',
  },
  md: {
    elevation: 4,
    shadowColor: '#000000',
  },
  lg: {
    elevation: 8,
    shadowColor: '#000000',
  },
  xl: {
    elevation: 16,
    shadowColor: '#000000',
  },
} as const;

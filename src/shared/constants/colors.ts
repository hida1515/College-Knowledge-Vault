/**
 * Design System — Color Tokens
 * College Knowledge Vault
 *
 * All color values used throughout the app.
 * No hardcoded hex values should appear outside this file.
 */

export const colors = {
  // Primary palette
  primary: '#6C63FF',
  primaryLight: '#9D97FF',
  primaryDark: '#4A42DB',

  // Secondary & accent
  secondary: '#FF6B6B',
  secondaryLight: '#FF9B9B',
  secondaryDark: '#CC5555',
  accent: '#00D9A6',
  accentLight: '#66EDCF',
  accentDark: '#00A87E',

  // Backgrounds
  background: '#F5F7FB',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardElevated: '#FAFBFE',

  // Text
  text: '#1A1D26',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Semantic — status
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // UI elements
  border: '#E5E7EB',
  divider: '#F3F4F6',
  disabled: '#D1D5DB',
  placeholder: '#9CA3AF',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Role-specific
  studentColor: '#3B82F6',
  seniorColor: '#8B5CF6',
  facultyColor: '#F59E0B',

  // Entry status
  pendingColor: '#F59E0B',
  approvedColor: '#22C55E',
  rejectedColor: '#EF4444',

  // Entry type
  projectColor: '#6C63FF',
  vivaColor: '#EC4899',
  mistakeColor: '#F97316',
  resourceColor: '#06B6D4',

  // Tab bar
  tabActive: '#6C63FF',
  tabInactive: '#9CA3AF',
  tabBackground: '#FFFFFF',

  // Misc
  skeleton: '#E5E7EB',
  skeletonHighlight: '#F3F4F6',
  shadow: '#000000',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof colors;

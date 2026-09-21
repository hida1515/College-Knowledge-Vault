/**
 * Design System — Spacing Scale
 * College Knowledge Vault
 *
 * Consistent spacing values used for margins, paddings, and gaps.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  '4xl': 48,
  '5xl': 64,
} as const;

/** Common layout values */
export const layout = {
  screenPaddingHorizontal: 16,
  screenPaddingVertical: 24,
  cardPadding: 16,
  cardBorderRadius: 12,
  buttonBorderRadius: 8,
  inputBorderRadius: 8,
  chipBorderRadius: 20,
  avatarSizeSm: 32,
  avatarSizeMd: 40,
  avatarSizeLg: 64,
  iconSizeSm: 16,
  iconSizeMd: 24,
  iconSizeLg: 32,
  tabBarHeight: 60,
  headerHeight: 56,
} as const;

export type SpacingKey = keyof typeof spacing;

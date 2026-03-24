import { TextStyle } from 'react-native';

export const colors = {
  background: '#1A1A2E',
  surface: '#16213E',
  surfaceLight: '#1C2A4A',
  surfaceBorder: '#243054',
  accent: '#C9A96E',
  accentDim: '#A08450',
  accentGlow: 'rgba(201, 169, 110, 0.15)',
  parchment: '#E8D5B7',
  textPrimary: '#F0E6D3',
  textSecondary: '#8B7D6B',
  textMuted: '#5C5347',
  error: '#C75050',
  success: '#5CAA6E',
  white: '#FFFFFF',
  black: '#000000',
  tabInactive: '#4A4A5E',
  tabActive: '#C9A96E',
  divider: 'rgba(201, 169, 110, 0.12)',
  overlay: 'rgba(26, 26, 46, 0.92)',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
} as const;

export const readerThemes = {
  night: {
    background: '#0D0D1A',
    text: '#C8C0B0',
    accent: '#C9A96E',
    surface: '#141428',
  },
  sepia: {
    background: '#F4E8D1',
    text: '#3A2F20',
    accent: '#8B6914',
    surface: '#EDE0C8',
  },
  day: {
    background: '#FAFAF5',
    text: '#2C2C2C',
    accent: '#8B6914',
    surface: '#F0F0EB',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  round: 999,
} as const;

export const fonts = {
  serifBold: {
    fontFamily: 'Georgia',
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  serifRegular: {
    fontFamily: 'Georgia',
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  serifItalic: {
    fontFamily: 'Georgia',
    fontStyle: 'italic' as TextStyle['fontStyle'],
  },
  sansBold: {
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  sansRegular: {
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  sansLight: {
    fontWeight: '300' as TextStyle['fontWeight'],
  },
} as const;

export const typography = {
  h1: {
    ...fonts.serifBold,
    fontSize: 28,
    lineHeight: 36,
    color: colors.textPrimary,
  },
  h2: {
    ...fonts.serifBold,
    fontSize: 22,
    lineHeight: 30,
    color: colors.textPrimary,
  },
  h3: {
    ...fonts.serifBold,
    fontSize: 18,
    lineHeight: 26,
    color: colors.textPrimary,
  },
  body: {
    ...fonts.sansRegular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  bodySmall: {
    ...fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  caption: {
    ...fonts.sansLight,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
  },
  label: {
    ...fonts.sansBold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  },
} as const;

export const shadows = {
  card: {
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  glow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export const APP_CONFIG = {
  PRIVACY_POLICY_URL: 'https://printmaxx.com/privacy',
  TERMS_URL: 'https://printmaxx.com/tos',
  SUPPORT_URL: 'https://pocket-alexandria.surge.sh/support',
};

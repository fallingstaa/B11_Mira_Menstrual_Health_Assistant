/**
 * Mira design system.
 * Teen-friendly menstrual health assistant — clean, warm, and reassuring.
 * UI-only: every screen in this app currently renders against mock data.
 */

import '@/global.css';

export const Colors = {
  // Brand
  primary: '#AD0E38',
  primaryDark: '#7C0A28',
  primaryLight: '#D94667',

  // Primary tints, lightest → darkest — used for soft backgrounds, badges, chips
  tint50: '#FDF1F4',
  tint100: '#FCE1E8',
  tint200: '#F8C2CF',
  tint300: '#F0A0B5',

  // Secondary accents for variety across features
  lavender: '#8B7CF6',
  lavenderTint: '#F0EDFE',
  peach: '#FF9E6D',
  peachTint: '#FFF0E7',
  teal: '#2FB8A6',
  tealTint: '#E7F8F5',

  // Semantic
  success: '#2FAE66',
  successTint: '#E7F7EE',
  warning: '#E8A23A',
  warningTint: '#FDF3E3',
  info: '#3B82F6',
  infoTint: '#EAF1FE',

  // Flow intensity scale
  flowLight: '#F0A0B5',
  flowMedium: '#D94667',
  flowHeavy: '#AD0E38',

  // Neutrals
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#FBF7F8',
  border: '#F1E4E8',
  text: '#1A1A1A',
  textSecondary: '#6B6469',
  textMuted: '#9B9498',
  textOnPrimary: '#FFFFFF',
  overlay: 'rgba(26, 12, 16, 0.45)',
} as const;

export const Fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

export const FontsToLoad = {
  Poppins_400Regular: require('@expo-google-fonts/poppins/400Regular/Poppins_400Regular.ttf'),
  Poppins_500Medium: require('@expo-google-fonts/poppins/500Medium/Poppins_500Medium.ttf'),
  Poppins_600SemiBold: require('@expo-google-fonts/poppins/600SemiBold/Poppins_600SemiBold.ttf'),
  Poppins_700Bold: require('@expo-google-fonts/poppins/700Bold/Poppins_700Bold.ttf'),
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const Radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const Shadow = {
  soft: {
    shadowColor: '#5A1A2A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  card: {
    shadowColor: '#5A1A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  raised: {
    shadowColor: '#5A1A2A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const MaxContentWidth = 480;

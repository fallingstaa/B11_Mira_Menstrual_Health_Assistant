import { TextStyle } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

export const Typography = {
  display: { fontFamily: Fonts.bold, fontSize: 30, lineHeight: 38, color: Colors.text },
  h1: { fontFamily: Fonts.bold, fontSize: 24, lineHeight: 32, color: Colors.text },
  h2: { fontFamily: Fonts.semiBold, fontSize: 20, lineHeight: 28, color: Colors.text },
  h3: { fontFamily: Fonts.semiBold, fontSize: 17, lineHeight: 24, color: Colors.text },
  bodyLarge: { fontFamily: Fonts.regular, fontSize: 16, lineHeight: 24, color: Colors.text },
  body: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 21, color: Colors.text },
  bodyMedium: { fontFamily: Fonts.medium, fontSize: 14, lineHeight: 21, color: Colors.text },
  small: { fontFamily: Fonts.regular, fontSize: 12.5, lineHeight: 18, color: Colors.textSecondary },
  caption: { fontFamily: Fonts.medium, fontSize: 11.5, lineHeight: 16, color: Colors.textMuted },
  button: { fontFamily: Fonts.semiBold, fontSize: 15, lineHeight: 20, color: Colors.textOnPrimary },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof Typography;

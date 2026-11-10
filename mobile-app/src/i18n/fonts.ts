import { StyleProp, StyleSheet, TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { KHMER_LINE_HEIGHT_SCALE, KhmerFontFor } from '@/constants/theme';

/**
 * Returns `style` adjusted for the current language: in Khmer, Poppins is swapped for the
 * matching Koh Santepheap weight and line height is scaled up so stacked vowels/subscripts
 * aren't clipped. In English it returns `style` untouched.
 */
export function useLocalizedTextStyle(style: StyleProp<TextStyle>): StyleProp<TextStyle> {
  const { i18n } = useTranslation();
  if (i18n.language !== 'km') return style;

  const flat = StyleSheet.flatten(style) ?? {};
  const khmer: TextStyle = {
    ...(flat.fontFamily && KhmerFontFor[flat.fontFamily] ? { fontFamily: KhmerFontFor[flat.fontFamily] } : null),
    ...(flat.lineHeight ? { lineHeight: Math.round(flat.lineHeight * KHMER_LINE_HEIGHT_SCALE) } : null),
  };
  return [style, khmer];
}

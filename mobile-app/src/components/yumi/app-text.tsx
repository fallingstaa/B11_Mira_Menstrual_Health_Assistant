import { Text, TextProps } from 'react-native';

import { Typography, TypographyVariant } from '@/constants/typography';
import { useLocalizedTextStyle } from '@/i18n/fonts';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: string;
  center?: boolean;
};

export function AppText({ variant = 'body', color, center, style, ...rest }: Props) {
  const localized = useLocalizedTextStyle([
    Typography[variant],
    color ? { color } : null,
    center ? { textAlign: 'center' } : null,
    style,
  ]);
  return <Text style={localized} {...rest} />;
}

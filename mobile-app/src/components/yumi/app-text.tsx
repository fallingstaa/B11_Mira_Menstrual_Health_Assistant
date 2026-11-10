import { Text, TextProps } from 'react-native';

import { Typography, TypographyVariant } from '@/constants/typography';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: string;
  center?: boolean;
};

export function AppText({ variant = 'body', color, center, style, ...rest }: Props) {
  return (
    <Text
      style={[Typography[variant], color ? { color } : null, center ? { textAlign: 'center' } : null, style]}
      {...rest}
    />
  );
}

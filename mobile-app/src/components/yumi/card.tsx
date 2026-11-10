import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  padded?: boolean;
  delay?: number;
  noShadow?: boolean;
};

/** Rounded, soft-shadow surface used everywhere. Fades + slides in on mount. */
export function Card({ children, style, padded = true, delay = 0, noShadow }: Props) {
  return (
    <Animated.View
      entering={FadeInUp.duration(420).delay(delay).springify().damping(18)}
      style={[styles.card, padded && styles.padded, !noShadow && Shadow.card, style]}>
      {children}
    </Animated.View>
  );
}

/** Static variant (no entrance animation) for lists that animate their own items. */
export function StaticCard({ children, style, padded = true, noShadow }: Omit<Props, 'delay'>) {
  return (
    <View style={[styles.card, padded && styles.padded, !noShadow && Shadow.card, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
  },
  padded: { padding: Spacing.xl },
});

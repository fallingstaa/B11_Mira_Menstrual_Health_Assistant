import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Colors, Radius, Spacing } from '@/constants/theme';

type Props = { count: number; activeIndex: number };

/** Pagination indicator dots — the active dot animates into a pill shape. */
export function ProgressDots({ count, activeIndex }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <Dot key={i} active={i === activeIndex} />
      ))}
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const style = useAnimatedStyle(
    () => ({
      width: withTiming(active ? 22 : 8, { duration: 250 }),
      backgroundColor: withTiming(active ? Colors.primary : Colors.tint200, { duration: 250 }),
    }),
    [active],
  );
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', justifyContent: 'center' },
  dot: { height: 8, borderRadius: Radius.pill },
});

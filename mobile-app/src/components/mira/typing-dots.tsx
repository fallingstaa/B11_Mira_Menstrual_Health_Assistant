import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { Colors, Radius, Spacing } from '@/constants/theme';

/** Three bouncing dots — shown while Mira "types" a reply. */
export function TypingDots() {
  return (
    <View style={styles.wrap}>
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const y = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 320, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 320, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 5, paddingVertical: Spacing.sm, paddingHorizontal: 4, alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: Radius.pill, backgroundColor: Colors.textMuted },
});

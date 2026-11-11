import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useSeasonalTheme } from '@/context/seasonal-theme';

export const CHRISTMAS_GREEN = '#1E7A4C';
export const CHRISTMAS_GOLD = '#F2C14E';
const BULB_COLORS = ['#FF5A5F', '#FFD27A', '#7ED957', '#6EC6FF'];

/** A strand of twinkling fairy lights. `wire` is the strand's colour. */
export function FairyLights({ count = 11, wire = 'rgba(255,255,255,0.35)', style }: { count?: number; wire?: string; style?: ViewStyle }) {
  return (
    <View style={[styles.lights, { borderTopColor: wire }, style]} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => (
        <Bulb key={i} color={BULB_COLORS[i % BULB_COLORS.length]} index={i} />
      ))}
    </View>
  );
}

function Bulb({ color, index }: { color: string; index: number }) {
  const glow = useSharedValue(0.45);

  useEffect(() => {
    glow.value = withDelay(
      (index % 4) * 250,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.45, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={[styles.bulbHolder, { marginTop: index % 2 === 0 ? 0 : 4 }]}>
      <View style={styles.cap} />
      <Animated.View style={[styles.bulb, { backgroundColor: color, shadowColor: color }, style]} />
    </View>
  );
}

/** Lights strung along the top of the floating tab bar (Christmas mode only). */
export function TabBarGarland() {
  const { christmas } = useSeasonalTheme();
  if (!christmas) return null;
  return <FairyLights count={13} wire="rgba(30,122,76,0.55)" style={styles.garland} />;
}

/**
 * Ornaments hanging from the top-right corner of the main tab screens, gently swaying.
 * Purely decorative and touch-transparent (Christmas mode only).
 */
export function HangingOrnaments() {
  const { christmas } = useSeasonalTheme();
  if (!christmas) return null;
  return (
    <View style={styles.ornaments} pointerEvents="none">
      <Ornament length={26} icon="ornament" color="#C41E3A" delay={0} />
      <Ornament length={48} icon="star-four-points" color={CHRISTMAS_GOLD} delay={300} />
      <Ornament length={14} icon="ornament" color={CHRISTMAS_GREEN} delay={600} />
    </View>
  );
}

function Ornament({
  length,
  icon,
  color,
  delay,
}: {
  length: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  delay: number;
}) {
  const swing = useSharedValue(0);

  useEffect(() => {
    swing.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(6, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          withTiming(-6, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${swing.value}deg` }], transformOrigin: 'top' }));

  return (
    <Animated.View style={[styles.ornament, style]}>
      <View style={[styles.string, { height: length }]} />
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  lights: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2 },
  bulbHolder: { alignItems: 'center' },
  cap: { width: 5, height: 4, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1 },
  bulb: { width: 9, height: 13, borderRadius: 5, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  garland: { position: 'absolute', top: -2, left: 18, right: 18 },
  ornaments: { position: 'absolute', top: 0, right: 14, flexDirection: 'row', gap: 6, zIndex: 5 },
  ornament: { alignItems: 'center' },
  string: { width: 1.2, backgroundColor: 'rgba(120,120,120,0.45)' },
});

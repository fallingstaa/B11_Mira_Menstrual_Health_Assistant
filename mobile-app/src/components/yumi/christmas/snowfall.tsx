import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useSeasonalTheme } from '@/context/seasonal-theme';

const FLAKE_COUNT = 26;
// Icy blue rather than white — most screens are white, where white snow would be invisible.
const FLAKE_COLOR = '#9CCBF0';

type Flake = { x: number; size: number; duration: number; delay: number; sway: number; icon: boolean; opacity: number };

function makeFlakes(): Flake[] {
  return Array.from({ length: FLAKE_COUNT }, (_, i) => ({
    x: Math.random(),
    size: i % 3 === 0 ? 10 + Math.random() * 8 : 4 + Math.random() * 4,
    duration: 7000 + Math.random() * 7000,
    delay: Math.random() * 7000,
    sway: 8 + Math.random() * 22,
    icon: i % 3 === 0, // every third flake is a ❄ shape, the rest soft dots
    opacity: 0.55 + Math.random() * 0.4,
  }));
}

/**
 * Gentle falling snow over the whole app while Christmas mode is on. Drawn on top of every
 * screen but with pointerEvents="none", so it can never block a tap. Hidden entirely when the
 * device asks for reduced motion.
 */
export function Snowfall() {
  const { christmas } = useSeasonalTheme();
  const reduceMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const flakes = useMemo(() => makeFlakes(), []);

  if (!christmas || reduceMotion) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {flakes.map((f, i) => (
        <FallingFlake key={i} flake={f} width={width} height={height} />
      ))}
    </View>
  );
}

function FallingFlake({ flake, width, height }: { flake: Flake; width: number; height: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      flake.delay,
      withRepeat(withTiming(1, { duration: flake.duration, easing: Easing.linear }), -1, false),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -24 + progress.value * (height + 48) },
      { translateX: flake.x * width + Math.sin(progress.value * Math.PI * 4) * flake.sway },
      { rotate: `${progress.value * 360}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.flake, { opacity: flake.opacity }, style]}>
      {flake.icon ? (
        <Ionicons name="snow" size={flake.size} color={FLAKE_COLOR} />
      ) : (
        <View style={{ width: flake.size, height: flake.size, borderRadius: flake.size / 2, backgroundColor: FLAKE_COLOR }} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flake: { position: 'absolute', top: 0, left: 0 },
});

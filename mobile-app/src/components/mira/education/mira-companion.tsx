import { Ionicons } from '@expo/vector-icons';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { Mascot } from '@/components/mira/mascot';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

/** Extra bottom padding a screen should add so its last item isn't hidden behind Mira Drop. */
export const MIRA_CLEARANCE = 120;

type Mood = 'happy' | 'cheer';
type Say = (message: string, mood?: Mood) => void;

const MiraContext = createContext<Say>(() => {});

/** Lets any widget make Mira Drop speak: `const say = useMira(); say('Nice one!', 'cheer')`. */
export function useMira(): Say {
  return useContext(MiraContext);
}

// Warm, general reassurance for when she's tapped — encouragement only, no medical claims.
const IDLE_LINES = [
  'Every question you ask about your body is a good one.',
  'You are doing great by learning this.',
  'There is nothing to be embarrassed about here.',
  'Take your time. There is no rush.',
];

type Props = { greeting: string; children: ReactNode };

/**
 * Wraps a screen and floats Mira Drop in its bottom-right corner. She speaks in a bubble, hops when
 * a widget calls `say(..., 'cheer')`, and can be tapped for a kind word. Touches pass through
 * everything except her own body.
 */
export function MiraProvider({ greeting, children }: Props) {
  const [line, setLine] = useState({ message: greeting, mood: 'happy' as Mood, tick: 1 });
  const [idleIndex, setIdleIndex] = useState(0);

  const say = useCallback<Say>((message, mood = 'happy') => {
    setLine((prev) => ({ message, mood, tick: prev.tick + 1 }));
  }, []);

  const onTap = () => {
    say(IDLE_LINES[idleIndex % IDLE_LINES.length], 'cheer');
    setIdleIndex((i) => i + 1);
  };

  const bubbleOpacity = useSharedValue(0);
  const hop = useSharedValue(0);
  const tilt = useSharedValue(0);

  useEffect(() => {
    bubbleOpacity.value = withSequence(withTiming(1, { duration: 220 }), withDelay(6000, withTiming(0, { duration: 400 })));
    if (line.mood === 'cheer') {
      hop.value = withSequence(withSpring(-18, { damping: 6, stiffness: 240 }), withSpring(0, { damping: 8 }));
      tilt.value = withSequence(withTiming(-10, { duration: 90 }), withTiming(10, { duration: 130 }), withTiming(0, { duration: 110 }));
    }
  }, [line, bubbleOpacity, hop, tilt]);

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [{ scale: 0.92 + bubbleOpacity.value * 0.08 }],
  }));
  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hop.value }, { rotate: `${tilt.value}deg` }],
  }));

  const value = useMemo(() => say, [say]);

  return (
    <MiraContext.Provider value={value}>
      <View style={styles.fill}>
        {children}
        <View style={styles.overlay} pointerEvents="box-none">
          <Animated.View style={[styles.bubble, bubbleStyle]} pointerEvents="none">
            <AppText variant="small" color={Colors.text} style={styles.bubbleText}>
              {line.message}
            </AppText>
          </Animated.View>
          <Pressable onPress={onTap} accessibilityRole="button" accessibilityLabel="Mira Drop, tap for a kind word">
            <Animated.View style={mascotStyle}>
              <Mascot size={64} waving={false} mood={line.mood === 'cheer' ? 'wink' : 'happy'} />
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </MiraContext.Provider>
  );
}

const HEART_COUNT = 9;

/** A burst of hearts that floats up from the middle of its parent. Bump `trigger` to fire it. */
export function HeartBurst({ trigger }: { trigger: number }) {
  if (trigger === 0) return null;
  return (
    <View style={styles.burst} pointerEvents="none" key={trigger}>
      {Array.from({ length: HEART_COUNT }).map((_, i) => (
        <Heart key={i} index={i} />
      ))}
    </View>
  );
}

function Heart({ index }: { index: number }) {
  const progress = useSharedValue(0);
  // Fan the hearts out left/right with a little variety in size and height.
  const spread = ((index % HEART_COUNT) - (HEART_COUNT - 1) / 2) * 20;
  const rise = 70 + (index % 3) * 28;

  useEffect(() => {
    progress.value = withDelay(index * 40, withTiming(1, { duration: 1100 }));
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: spread * progress.value },
      { translateY: -rise * progress.value },
      { scale: 0.6 + progress.value * 0.6 },
    ],
  }));

  return (
    <Animated.View style={[styles.heart, style]}>
      <Ionicons name="heart" size={index % 2 ? 18 : 24} color={index % 3 ? Colors.primaryLight : Colors.tint300} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  overlay: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    alignItems: 'flex-end',
    maxWidth: 260,
  },
  bubble: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderBottomRightRadius: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
    borderWidth: 1.5,
    borderColor: Colors.tint200,
    ...Shadow.soft,
  },
  bubbleText: { lineHeight: 18 },
  burst: { position: 'absolute', left: 0, right: 0, top: '50%', alignItems: 'center' },
  heart: { position: 'absolute' },
});

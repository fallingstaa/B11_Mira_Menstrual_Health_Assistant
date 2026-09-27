import { ReactNode, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

type Props = {
  front: ReactNode;
  /** Back content — scrolls if it is taller than the card. */
  back: ReactNode;
  flipped: boolean;
  onFlip: () => void;
  height: number;
  frontColor: string;
  backColor: string;
  accent: string;
  /** Text of the "flip back" footer on the back face. */
  backLabel?: string;
};

/** A card that flips in 3D (spring) between a front and a back face. Fixed height; the back scrolls. */
export function FlipCard({ front, back, flipped, onFlip, height, frontColor, backColor, accent, backLabel = 'Tap to flip back' }: Props) {
  const progress = useSharedValue(flipped ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(flipped ? 1 : 0, { damping: 14, stiffness: 110 });
  }, [flipped, progress]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(progress.value, [0, 1], [180, 360])}deg` }],
  }));

  return (
    <View style={[styles.wrap, { height }]}>
      <Animated.View style={[styles.face, { backgroundColor: frontColor, borderColor: accent }, frontStyle]} pointerEvents={flipped ? 'none' : 'auto'}>
        <Pressable
          onPress={onFlip}
          accessibilityRole="button"
          accessibilityState={{ expanded: flipped }}
          style={styles.frontPress}>
          {front}
        </Pressable>
      </Animated.View>

      <Animated.View style={[styles.face, { backgroundColor: backColor, borderColor: accent }, backStyle]} pointerEvents={flipped ? 'auto' : 'none'}>
        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={styles.backContent} style={styles.backScroll}>
          {back}
        </ScrollView>
        <Pressable onPress={onFlip} accessibilityRole="button" style={styles.backFooter}>
          <AppText variant="bodyMedium" color={accent}>
            {backLabel}
          </AppText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  face: {
    ...StyleSheet.absoluteFill,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
    ...Shadow.card,
  },
  frontPress: { flex: 1, padding: Spacing.xl, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  backScroll: { flex: 1 },
  backContent: { padding: Spacing.xl, gap: Spacing.md },
  backFooter: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});

import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { Mascot } from '@/components/mira/mascot';
import { ProgressDots } from '@/components/mira/progress-dots';
import { Colors, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

const pages = [
  {
    title: 'Track your cycle with ease',
    body: 'Log your period in seconds and Mira quietly keeps track of your cycle, flow, and symptoms for you.',
    illustration: <TrackIllustration />,
  },
  {
    title: 'Learn about your body',
    body: 'Bite-sized, judgement-free articles about periods, hygiene, and symptoms — written for first-timers.',
    illustration: <LearnIllustration />,
  },
  {
    title: 'Ask Mira anything',
    body: "No question is too awkward. Mira's AI assistant is here 24/7 to help you understand what's normal.",
    illustration: <Mascot size={150} waving={false} />,
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isLast = index === pages.length - 1;

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(i);
  };

  const finish = () => router.replace('/login');

  return (
    <View style={styles.container}>
      <View style={styles.skipRow}>
        <View />
        {!isLast && (
          <Pressable onPress={finish} hitSlop={8}>
            <AppText variant="bodyMedium" color={Colors.textSecondary}>
              Skip
            </AppText>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        style={styles.pager}>
        {pages.map((page, i) => (
          <View key={i} style={[styles.page, { width }]}>
            <Animated.View entering={FadeIn.duration(500)} style={styles.illustrationWrap}>
              {page.illustration}
            </Animated.View>
            <AppText variant="h1" center style={styles.title}>
              {page.title}
            </AppText>
            <AppText variant="bodyLarge" center color={Colors.textSecondary} style={styles.body}>
              {page.body}
            </AppText>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <ProgressDots count={pages.length} activeIndex={index} />
        <Button
          label={isLast ? 'Get Started' : 'Continue'}
          onPress={() => (isLast ? finish() : goTo(index + 1))}
          style={styles.cta}
        />
      </View>
    </View>
  );
}

function TrackIllustration() {
  return (
    <Svg width={190} height={150} viewBox="0 0 190 150">
      <Rect x="35" y="20" width="120" height="120" rx="22" fill={Colors.tint50} />
      <Rect x="55" y="10" width="10" height="24" rx="5" fill={Colors.primary} />
      <Rect x="125" y="10" width="10" height="24" rx="5" fill={Colors.primary} />
      <Rect x="35" y="52" width="120" height="2" fill={Colors.tint200} />
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3, 4].map((col) => {
          const isMarked = (row === 1 && col === 2) || (row === 1 && col === 3) || (row === 2 && col === 0);
          return (
            <Circle
              key={`${row}-${col}`}
              cx={55 + col * 20}
              cy={75 + row * 18}
              r={isMarked ? 7 : 3.5}
              fill={isMarked ? Colors.primary : Colors.tint200}
            />
          );
        }),
      )}
    </Svg>
  );
}

function LearnIllustration() {
  return (
    <Svg width={190} height={150} viewBox="0 0 190 150">
      <Rect x="40" y="25" width="75" height="100" rx="14" fill={Colors.lavenderTint} />
      <Rect x="70" y="15" width="80" height="100" rx="14" fill={Colors.tint50} />
      <Path d="M85,40 H135 M85,58 H135 M85,76 H120" stroke={Colors.primary} strokeWidth={4} strokeLinecap="round" />
      <Circle cx="140" cy="100" r="16" fill={Colors.primary} />
      <Path d="M140,92 V100 L146,106" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    height: 32,
  },
  pager: { flexGrow: 0 },
  page: { alignItems: 'center', paddingHorizontal: Spacing.xxxl, paddingTop: Spacing.xxxl },
  illustrationWrap: { height: 170, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  title: { marginBottom: Spacing.md },
  body: { paddingHorizontal: Spacing.md },
  footer: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xl, gap: Spacing.xxl },
  cta: {},
});

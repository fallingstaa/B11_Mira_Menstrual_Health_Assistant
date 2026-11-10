import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Fragment, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { AppText } from '@/components/yumi/app-text';
import { Button } from '@/components/yumi/button';
import { ProgressDots } from '@/components/yumi/progress-dots';
import { Colors, Radius, Spacing } from '@/constants/theme';
import i18n from '@/i18n';

const { width } = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

type PhaseInfo = {
  key: string;
  label: string;
  days: string;
  description: string;
  color: string;
  tint: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const phases: PhaseInfo[] = [
  {
    key: 'menstrual',
    get label() {
      return i18n.t('cycleBasics.phases.menstrual.label');
    },
    get days() {
      return i18n.t('cycleBasics.phases.menstrual.days');
    },
    get description() {
      return i18n.t('cycleBasics.phases.menstrual.description');
    },
    color: Colors.primary,
    tint: Colors.tint50,
    icon: 'moon-outline',
  },
  {
    key: 'follicular',
    get label() {
      return i18n.t('cycleBasics.phases.follicular.label');
    },
    get days() {
      return i18n.t('cycleBasics.phases.follicular.days');
    },
    get description() {
      return i18n.t('cycleBasics.phases.follicular.description');
    },
    color: Colors.peach,
    tint: Colors.peachTint,
    icon: 'leaf-outline',
  },
  {
    key: 'ovulation',
    get label() {
      return i18n.t('cycleBasics.phases.ovulation.label');
    },
    get days() {
      return i18n.t('cycleBasics.phases.ovulation.days');
    },
    get description() {
      return i18n.t('cycleBasics.phases.ovulation.description');
    },
    color: Colors.teal,
    tint: Colors.tealTint,
    icon: 'sunny-outline',
  },
  {
    key: 'luteal',
    get label() {
      return i18n.t('cycleBasics.phases.luteal.label');
    },
    get days() {
      return i18n.t('cycleBasics.phases.luteal.days');
    },
    get description() {
      return i18n.t('cycleBasics.phases.luteal.description');
    },
    color: Colors.lavender,
    tint: Colors.lavenderTint,
    icon: 'partly-sunny-outline',
  },
];

type CardMeta = {
  key: string;
  title: string;
  body: string;
  example?: string;
  subtext?: string;
  illustration?: React.ReactNode;
};

const cards: CardMeta[] = [
  {
    key: 'period',
    get title() {
      return i18n.t('cycleBasics.cards.period.title');
    },
    get body() {
      return i18n.t('cycleBasics.cards.period.body');
    },
    get example() {
      return i18n.t('cycleBasics.cards.period.example');
    },
    illustration: <PeriodDurationIllustration />,
  },
  {
    key: 'cycle',
    get title() {
      return i18n.t('cycleBasics.cards.cycle.title');
    },
    get body() {
      return i18n.t('cycleBasics.cards.cycle.body');
    },
    get example() {
      return i18n.t('cycleBasics.cards.cycle.example');
    },
    illustration: <CycleLengthIllustration />,
  },
  {
    key: 'phases',
    get title() {
      return i18n.t('cycleBasics.cards.phases.title');
    },
    get body() {
      return i18n.t('cycleBasics.cards.phases.body');
    },
  },
  {
    key: 'unknown',
    get title() {
      return i18n.t('cycleBasics.cards.unknown.title');
    },
    get body() {
      return i18n.t('cycleBasics.cards.unknown.body');
    },
    get subtext() {
      return i18n.t('cycleBasics.cards.unknown.subtext');
    },
    illustration: <AllSetIllustration />,
  },
];

/**
 * "Cycle Basics 101" — a 4-card swipeable micro-guide. Teaches Period Duration, Cycle Length,
 * and the 4 cycle phases up front so those words mean something by the time period-setup.tsx
 * asks about them. No emoji anywhere — every icon here is a vector Ionicon or hand-drawn SVG.
 *
 * Two ways in, distinguished by the `mode=review` param:
 *  - Setup (default): auto-opened by register.tsx right after a brand-new account is created,
 *    before period-setup.tsx asks for any real dates. Finishing (or skipping) hands off there.
 *  - Review: opened any time later from Home's "Cycle Basics 101" banner, by anyone — a new
 *    user who skipped it, or a returning one who just wants a refresher. Finishing just closes
 *    it back to Home, no forced hand-off to period setup.
 */
export default function CycleBasicsScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isReview = mode === 'review';
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const isLast = index === cards.length - 1;

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(i);
  };

  const finish = () => {
    if (isReview) {
      // Just a refresher — close back to whatever screen (Home) opened it.
      router.back();
      return;
    }
    // First-time setup flow: quietly establishes Home as the screen beneath this one (so the
    // later setup screens can dismiss back to it), then moves straight on to period-setup —
    // no need to actually stop at Home first.
    router.replace('/(tabs)/home');
    router.push('/period-setup');
  };

  return (
    <View style={styles.container}>
      <View style={styles.skipRow}>
        <View />
        {!isLast && (
          <Pressable onPress={finish} hitSlop={8}>
            <AppText variant="bodyMedium" color={Colors.textSecondary}>
              {isReview ? t('common.close') : t('common.skip')}
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
        {cards.map((card) => (
          <View key={card.key} style={[styles.page, { width }]}>
            {card.illustration && <View style={styles.illustrationWrap}>{card.illustration}</View>}

            <AppText variant="h1" center style={styles.title}>
              {card.title}
            </AppText>
            <AppText variant="bodyLarge" center color={Colors.textSecondary} style={styles.body}>
              {card.body}
            </AppText>

            {card.key === 'phases' && <PhasesCard />}

            {card.example && (
              <View style={styles.exampleTag}>
                <Ionicons name="calendar-outline" size={13} color={Colors.primary} />
                <AppText variant="small" color={Colors.primary}>
                  {card.example}
                </AppText>
              </View>
            )}

            {card.subtext && (
              <AppText variant="small" color={Colors.textMuted} style={styles.subtext}>
                {card.subtext}
              </AppText>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <ProgressDots count={cards.length} activeIndex={index} />
        <Button
          label={isLast ? (isReview ? t('common.done') : t('cycleBasics.letsGo')) : t('common.continue')}
          onPress={() => (isLast ? finish() : goTo(index + 1))}
          style={styles.cta}
        />
      </View>
    </View>
  );
}

/** Card 1 — a week strip where Aug 1–5 light up one after another with a soft rose glow. */
function PeriodDurationIllustration() {
  const days = [1, 2, 3, 4, 5, 6, 7];
  return (
    <Svg width={190} height={150} viewBox="0 0 190 150">
      <Rect x="25" y="34" width="140" height="88" rx="18" fill={Colors.tint50} />
      <Rect x="53" y="24" width="10" height="20" rx="5" fill={Colors.primary} />
      <Rect x="127" y="24" width="10" height="20" rx="5" fill={Colors.primary} />
      <Rect x="25" y="60" width="140" height="2" fill={Colors.tint200} />
      {days.map((day, i) => {
        const isPeriodDay = day <= 5;
        const cx = 43 + i * 16;
        const cy = 90;
        const delay = 200 + i * 130;
        return (
          <Fragment key={day}>
            {isPeriodDay ? (
              <>
                {/* soft glow halo, behind the day dot */}
                <AnimatedCircle entering={FadeIn.delay(delay).duration(340)} cx={cx} cy={cy} r={13} fill={Colors.tint200} />
                <AnimatedCircle entering={FadeIn.delay(delay + 60).duration(260)} cx={cx} cy={cy} r={9} fill={Colors.primary} />
              </>
            ) : (
              <Circle cx={cx} cy={cy} r={9} fill={Colors.tint100} />
            )}
            <SvgText
              x={cx}
              y={cy + 3}
              fontSize={9}
              fontWeight="600"
              fill={isPeriodDay ? Colors.textOnPrimary : Colors.textMuted}
              textAnchor="middle">
              {day}
            </SvgText>
          </Fragment>
        );
      })}
    </Svg>
  );
}

/** Card 2 — a full month grid: Day 1 lights up, then a path sweeps across and lands on Day 29. */
function CycleLengthIllustration() {
  const totalDays = 31;
  const cols = 7;
  return (
    <Svg width={200} height={170} viewBox="0 0 200 170">
      <Rect x="14" y="16" width="172" height="140" rx="18" fill={Colors.tint50} />
      <Rect x="42" y="6" width="10" height="20" rx="5" fill={Colors.primary} />
      <Rect x="148" y="6" width="10" height="20" rx="5" fill={Colors.primary} />
      <Rect x="14" y="42" width="172" height="2" fill={Colors.tint200} />
      {Array.from({ length: totalDays }, (_, idx) => {
        const day = idx + 1;
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const cx = 32 + col * 22;
        const cy = 58 + row * 20;
        const isMarked = day === 1 || day === 29;
        const delay = day === 1 ? 150 : 900;
        return (
          <Fragment key={day}>
            {isMarked ? (
              <>
                <AnimatedCircle entering={FadeIn.delay(delay).duration(340)} cx={cx} cy={cy} r={11} fill={Colors.tint200} />
                <AnimatedCircle entering={FadeIn.delay(delay + 60).duration(260)} cx={cx} cy={cy} r={7.5} fill={Colors.primary} />
                <SvgText x={cx} y={cy + 3} fontSize={8} fontWeight="700" fill={Colors.textOnPrimary} textAnchor="middle">
                  {day}
                </SvgText>
              </>
            ) : (
              <Circle cx={cx} cy={cy} r={3} fill={Colors.tint200} />
            )}
          </Fragment>
        );
      })}
      <AnimatedPath
        entering={FadeIn.delay(500).duration(500)}
        d="M32,58 C150,40 150,132 32,138"
        stroke={Colors.primary}
        strokeWidth={2.5}
        strokeDasharray="6,6"
        fill="none"
      />
    </Svg>
  );
}

const WHEEL_SIZE = 120;
const WHEEL_CENTER = WHEEL_SIZE / 2;
const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const QUARTER = RING_CIRCUMFERENCE / 4;

/** Card 3 — a rotating 4-color wheel plus a tappable, auto-cycling list of the 4 cycle phases. */
function PhasesCard() {
  const [activePhase, setActivePhase] = useState(0);
  const autoCycle = useRef(true);
  const rotation = useSharedValue(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!autoCycle.current) return;
      setActivePhase((p) => (p + 1) % phases.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    rotation.value = withTiming(-activePhase * 90, { duration: 480, easing: Easing.out(Easing.cubic) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePhase]);

  const wheelStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  const selectPhase = (i: number) => {
    autoCycle.current = false;
    setActivePhase(i);
  };

  const active = phases[activePhase];

  return (
    <View style={styles.phasesCard}>
      <View style={styles.wheelWrap}>
        <Ionicons name="caret-down" size={14} color={Colors.textMuted} style={styles.wheelPointer} />
        <Animated.View style={wheelStyle}>
          <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}>
            <G transform={`rotate(-90 ${WHEEL_CENTER} ${WHEEL_CENTER})`}>
              {phases.map((phase, i) => (
                <Circle
                  key={phase.key}
                  cx={WHEEL_CENTER}
                  cy={WHEEL_CENTER}
                  r={RING_RADIUS}
                  stroke={phase.color}
                  strokeWidth={14}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${QUARTER - 4} ${RING_CIRCUMFERENCE - QUARTER + 4}`}
                  strokeDashoffset={-i * QUARTER}
                />
              ))}
            </G>
          </Svg>
        </Animated.View>
        <View style={styles.wheelCenter}>
          <Ionicons name={active.icon} size={22} color={active.color} />
        </View>
      </View>

      <View style={styles.phaseList}>
        {phases.map((phase, i) => {
          const isActive = i === activePhase;
          return (
            <Pressable
              key={phase.key}
              onPress={() => selectPhase(i)}
              style={[styles.phaseRow, isActive && { backgroundColor: phase.tint, borderColor: phase.color }]}>
              <View style={[styles.phaseDot, { backgroundColor: phase.color }]} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMedium" color={isActive ? phase.color : Colors.text}>
                  {phase.label}
                </AppText>
                <AppText variant="caption" color={Colors.textMuted}>
                  {phase.days}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>

      <AppText variant="small" color={Colors.textSecondary} style={styles.phaseDescription}>
        {active.description}
      </AppText>
    </View>
  );
}

/** Card 4 — a checkmark that pops in with a little spring, plus a couple of sparkles. */
function AllSetIllustration() {
  const scale = useSharedValue(0.4);
  const sparkleOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.15, { duration: 380, easing: Easing.out(Easing.back(1.6)) }),
      withTiming(1, { duration: 180 }),
    );
    sparkleOpacity.value = withDelay(300, withTiming(1, { duration: 300 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const sparkleStyle = useAnimatedStyle(() => ({ opacity: sparkleOpacity.value }));

  return (
    <View style={styles.allSetWrap}>
      <Animated.View style={[styles.sparkle, styles.sparkleTopLeft, sparkleStyle]}>
        <Ionicons name="sparkles" size={22} color={Colors.peach} />
      </Animated.View>
      <Animated.View style={[styles.sparkle, styles.sparkleTopRight, sparkleStyle]}>
        <Ionicons name="star" size={16} color={Colors.lavender} />
      </Animated.View>
      <Animated.View style={checkStyle}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={56} color={Colors.textOnPrimary} />
        </View>
      </Animated.View>
      <Animated.View style={[styles.sparkle, styles.sparkleBottom, sparkleStyle]}>
        <Ionicons name="star" size={14} color={Colors.teal} />
      </Animated.View>
    </View>
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
  page: { alignItems: 'center', paddingHorizontal: Spacing.xxxl, paddingTop: Spacing.xl },
  illustrationWrap: { height: 170, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  title: { marginBottom: Spacing.md },
  body: { paddingHorizontal: Spacing.md },
  exampleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.tint50,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.lg,
  },
  subtext: { marginTop: Spacing.sm, textAlign: 'center' },
  footer: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xl, gap: Spacing.xxl },
  cta: {},

  allSetWrap: { width: 190, height: 150, alignItems: 'center', justifyContent: 'center' },
  checkCircle: {
    width: 110,
    height: 110,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: { position: 'absolute' },
  sparkleTopLeft: { top: 8, left: 24 },
  sparkleTopRight: { top: 16, right: 20 },
  sparkleBottom: { bottom: 4, left: 44 },

  phasesCard: { width: '100%', alignItems: 'center', marginTop: Spacing.lg },
  wheelWrap: { width: WHEEL_SIZE, height: WHEEL_SIZE, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  wheelPointer: { position: 'absolute', top: -14 },
  wheelCenter: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseList: { width: '100%', gap: Spacing.sm },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
  },
  phaseDot: { width: 10, height: 10, borderRadius: 5 },
  phaseDescription: { marginTop: Spacing.md, textAlign: 'center', paddingHorizontal: Spacing.md, lineHeight: 18 },
});

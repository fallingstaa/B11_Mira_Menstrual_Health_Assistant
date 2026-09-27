import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '@/components/mira/app-text';
import { HeartBurst, useMira } from '@/components/mira/education/mira-companion';
import { educationTopics } from '@/constants/education-hub';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

// The four phases come straight from Topic 2's "The Four Phases" section, so the wheel and the
// written text can never drift apart.
const cycleTopic = educationTopics.find((t) => t.id === 'understanding-your-cycle');
const phaseSection = cycleTopic?.sections.find((s) => s.kind === 'phases');
const INTRO = phaseSection?.kind === 'phases' ? phaseSection.intro : '';
const PHASES = phaseSection?.kind === 'phases' ? phaseSection.slides : [];

// What the lining does in each phase, in the same order as PHASES — drawn in the wheel's centre.
const LINING = [
  { label: 'Lining sheds', height: 0.22 },
  { label: 'Lining thickens', height: 0.55 },
  { label: 'Egg is released', height: 0.62 },
  { label: 'Lining is held', height: 0.95 },
] as const;

const SIZE_MAX = 300;
const GAP = 3; // degrees of white space between segments

/** Angle measured clockwise from 12 o'clock. */
function polar(cx: number, cy: number, radius: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + radius * Math.sin(rad), y: cy - radius * Math.cos(rad) };
}

/** A ring segment (donut slice) from `from` to `to` degrees. */
function segmentPath(cx: number, cy: number, outer: number, inner: number, from: number, to: number) {
  const a = polar(cx, cy, outer, from);
  const b = polar(cx, cy, outer, to);
  const c = polar(cx, cy, inner, to);
  const d = polar(cx, cy, inner, from);
  return `M ${a.x} ${a.y} A ${outer} ${outer} 0 0 1 ${b.x} ${b.y} L ${c.x} ${c.y} A ${inner} ${inner} 0 0 0 ${d.x} ${d.y} Z`;
}

/** Topic 2: a four-phase wheel that spins the tapped phase to the top and shows what the lining does. */
export function CycleWheel() {
  const say = useMira();
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [burst, setBurst] = useState(0);
  const [width, setWidth] = useState(0);

  const size = Math.min(width || SIZE_MAX, SIZE_MAX);
  const center = size / 2;
  const outer = size / 2 - 4;
  const inner = outer * 0.66;

  const angle = useSharedValue(0);
  useEffect(() => {
    angle.value = withSpring(turn, { damping: 15, stiffness: 70 });
  }, [turn, angle]);

  const wheelStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));
  const upright = useAnimatedStyle(() => ({ transform: [{ rotate: `${-angle.value}deg` }] }));

  const select = (i: number) => {
    if (i === index) return;
    // Spin the short way round, even after several taps.
    setTurn((prev) => prev + ((((-i * 90 - prev + 180) % 360) + 360) % 360) - 180);
    setIndex(i);

    const nextVisited = new Set(visited).add(i);
    setVisited(nextVisited);
    if (nextVisited.size === PHASES.length && visited.size < PHASES.length) {
      setBurst((n) => n + 1);
      say('You explored all four phases! Nicely done.', 'cheer');
    } else {
      say(`${PHASES[i].title}. Tap another phase to keep spinning.`);
    }
  };

  const phase = PHASES[index];
  if (!phase) return null;

  return (
    <View style={styles.card}>
      <AppText variant="h3">The cycle wheel</AppText>
      <AppText variant="small" style={styles.hint}>
        {INTRO}
      </AppText>

      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.wheelArea}>
        {width > 0 ? (
          <View style={{ width: size, height: size }}>
            <Animated.View style={[{ width: size, height: size }, wheelStyle]}>
              <Svg width={size} height={size}>
                {PHASES.map((p, i) => (
                  <Path
                    key={p.title}
                    d={segmentPath(center, center, outer, inner, i * 90 - 45 + GAP / 2, i * 90 + 45 - GAP / 2)}
                    fill={i === index ? p.color : p.tint}
                    onPress={() => select(i)}
                  />
                ))}
              </Svg>

              {PHASES.map((p, i) => {
                const mid = (outer + inner) / 2;
                const pos = polar(center, center, mid, i * 90);
                return (
                  <Animated.View key={p.title} style={[styles.icon, { left: pos.x - 20, top: pos.y - 20 }, upright]} pointerEvents="none">
                    <Ionicons name={p.icon} size={22} color={i === index ? '#FFFFFF' : p.color} />
                  </Animated.View>
                );
              })}
            </Animated.View>

            {/* fixed pointer at 12 o'clock marks the selected phase */}
            <View style={[styles.pointer, { left: center - 9 }]} pointerEvents="none">
              <Ionicons name="caret-down" size={18} color={Colors.text} />
            </View>

            <View style={[styles.centre, { width: inner * 2 - 16, height: inner * 2 - 16, left: center - inner + 8, top: center - inner + 8 }]} pointerEvents="none">
              <LiningGraphic index={index} color={phase.color} tint={phase.tint} />
            </View>
          </View>
        ) : null}
        <HeartBurst trigger={burst} />
      </View>

      <View style={styles.dots}>
        {PHASES.map((p, i) => (
          <View key={p.title} style={[styles.dot, { backgroundColor: visited.has(i) ? p.color : Colors.border }]} />
        ))}
        <AppText variant="caption" style={styles.dotsLabel}>
          {visited.size} of {PHASES.length} phases explored
        </AppText>
      </View>

      <View style={[styles.detail, { backgroundColor: phase.tint }]}>
        <View style={styles.detailHead}>
          <Ionicons name={phase.icon} size={20} color={phase.color} />
          <AppText variant="h3" color={phase.color}>
            {phase.title}
          </AppText>
        </View>
        <AppText variant="bodyLarge" style={styles.detailText}>
          {phase.text}
        </AppText>
      </View>
    </View>
  );
}

/** The lining drawn as a soft bar whose height follows the phase; drops fall while it is shedding. */
function LiningGraphic({ index, color, tint }: { index: number; color: string; tint: string }) {
  const level = useSharedValue(LINING[index].height);
  useEffect(() => {
    level.value = withSpring(LINING[index].height, { damping: 12, stiffness: 90 });
  }, [index, level]);

  const barStyle = useAnimatedStyle(() => ({ height: `${level.value * 60}%` }));

  return (
    <View style={styles.lining}>
      <View style={styles.liningStage}>
        <View style={[styles.cavity, { backgroundColor: tint }]}>
          <Animated.View style={[styles.wall, { backgroundColor: color }, barStyle]} />
        </View>
        {index === 0 ? <Drops color={color} /> : null}
        {index === 2 ? <Egg /> : null}
      </View>
      <Animated.View key={index} entering={FadeInDown.duration(250)}>
        <AppText variant="caption" color={color} center>
          {LINING[index].label.toUpperCase()}
        </AppText>
      </Animated.View>
    </View>
  );
}

function Drops({ color }: { color: string }) {
  return (
    <View style={styles.drops}>
      {[0, 1, 2].map((i) => (
        <Drop key={i} delay={i * 260} color={color} />
      ))}
    </View>
  );
}

function Drop({ delay, color }: { delay: number; color: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0, { duration: 0 })), -1));
  }, [delay, t]);
  const style = useAnimatedStyle(() => ({ opacity: 1 - t.value, transform: [{ translateY: t.value * 22 }] }));
  return (
    <Animated.View style={style}>
      <Ionicons name="water" size={12} color={color} />
    </Animated.View>
  );
}

function Egg() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withSequence(withTiming(1, { duration: 1400 }), withTiming(0, { duration: 1400 })), -1);
  }, [t]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -t.value * 8 }, { scale: 1 + t.value * 0.15 }] }));
  return (
    <Animated.View style={[styles.egg, style]}>
      <Ionicons name="ellipse" size={18} color={Colors.peach} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, ...Shadow.card },
  hint: { marginTop: 2, marginBottom: Spacing.md, lineHeight: 19 },
  wheelArea: { alignItems: 'center', justifyContent: 'center', minHeight: 40 },
  icon: { position: 'absolute', width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  pointer: { position: 'absolute', top: -14, width: 18, alignItems: 'center' },
  centre: { position: 'absolute', borderRadius: 999, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  lining: { alignItems: 'center', gap: Spacing.xs },
  liningStage: { width: 84, height: 64, alignItems: 'center', justifyContent: 'flex-end' },
  cavity: { width: 84, height: 56, borderRadius: 14, overflow: 'hidden', justifyContent: 'flex-end' },
  wall: { width: '100%', borderRadius: 10 },
  drops: { position: 'absolute', bottom: -6, flexDirection: 'row', gap: 10 },
  egg: { position: 'absolute', top: 2 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, justifyContent: 'center', marginTop: Spacing.lg },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotsLabel: { marginLeft: Spacing.xs },
  detail: { borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing.lg, gap: Spacing.sm },
  detailHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  detailText: { lineHeight: 25 },
});

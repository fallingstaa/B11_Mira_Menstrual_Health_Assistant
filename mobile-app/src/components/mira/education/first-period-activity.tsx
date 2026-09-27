import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { HeartBurst, useMira } from '@/components/mira/education/mira-companion';
import { IconCircle } from '@/components/mira/icon-circle';
import { LEAK_CARD, PUBERTY_MILESTONES, PUBERTY_TIMELINE as T } from '@/constants/education-activities';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

const FIRST_AGE = T.ages[0];
const LAST_AGE = T.ages[T.ages.length - 1];
const STEPS = LAST_AGE - FIRST_AGE;
const MARKER = 34;

/** Which of the source's three stated ranges the chosen age falls in. */
function rangeFor(age: number) {
  if (age >= T.typical.from && age <= T.typical.to) return { label: 'Most common', color: Colors.primary, tint: Colors.tint100 };
  if (age >= T.normal.from && age <= T.normal.to) return { label: 'Clinically normal', color: Colors.lavender, tint: Colors.lavenderTint };
  return { label: 'Broader normal range', color: Colors.teal, tint: Colors.tealTint };
}

/** Topic 1: draggable age timeline (8–17), tap-to-pop milestone cards, and the leak-at-school card. */
export function FirstPeriodActivity() {
  return (
    <View style={styles.stack}>
      <PubertyTimeline />
      <MilestoneCards />
      <LeakCard />
    </View>
  );
}

function PubertyTimeline() {
  const say = useMira();
  const [age, setAge] = useState(12);
  const [width, setWidth] = useState(0);
  const trackWidth = Math.max(width - MARKER, 1);

  // PanResponder callbacks are created once, so they read the latest track width / age from refs.
  const widthRef = useRef(trackWidth);
  const ageRef = useRef(age);
  const startAge = useRef(age);
  useEffect(() => {
    widthRef.current = trackWidth;
  }, [trackWidth]);
  useEffect(() => {
    ageRef.current = age;
  }, [age]);

  // The handlers below only run on touch events, never during render — the refs they read are safe here.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startAge.current = ageRef.current;
      },
      onPanResponderMove: (_, g) => {
        const moved = (g.dx / widthRef.current) * STEPS;
        const next = Math.min(LAST_AGE, Math.max(FIRST_AGE, Math.round(startAge.current + moved)));
        setAge(next);
      },
    }),
  );

  const position = useSharedValue(((age - FIRST_AGE) / STEPS) * trackWidth);
  useEffect(() => {
    position.value = withSpring(((age - FIRST_AGE) / STEPS) * trackWidth, { damping: 16, stiffness: 180 });
  }, [age, trackWidth, position]);
  const markerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: position.value }] }));

  const range = rangeFor(age);
  const band = (from: number, to: number) => ({
    left: MARKER / 2 + ((from - FIRST_AGE) / STEPS) * trackWidth,
    width: ((to - from) / STEPS) * trackWidth,
  });

  // Mira reacts when the marker settles into a new range, not on every tick.
  const lastRange = useRef(range.label);
  useEffect(() => {
    if (lastRange.current !== range.label) {
      lastRange.current = range.label;
      say(`Age ${age}: ${range.label.toLowerCase()}. Everybody's timeline is a little different.`);
    }
  }, [range.label, age, say]);

  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <AppText variant="h3">Puberty timeline</AppText>
        <View style={[styles.pill, { backgroundColor: range.tint }]}>
          <AppText variant="caption" color={range.color}>
            {range.label.toUpperCase()}
          </AppText>
        </View>
      </View>
      <AppText variant="small" style={styles.hint}>
        Drag the drop, or tap an age.
      </AppText>

      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.trackArea}>
        {/* the three ranges stated in the source, widest to narrowest */}
        <View style={[styles.band, band(T.broad.from, T.broad.to), { backgroundColor: Colors.tealTint, top: 6 }]} />
        <View style={[styles.band, band(T.normal.from, T.normal.to), { backgroundColor: Colors.lavenderTint, top: 6 }]} />
        <View style={[styles.band, band(T.typical.from, T.typical.to), { backgroundColor: Colors.tint200, top: 6 }]} />

        {width > 0 ? (
          <Animated.View style={[styles.marker, markerStyle]} {...pan.panHandlers}>
            <Ionicons name="water" size={20} color="#FFFFFF" />
          </Animated.View>
        ) : null}

        <View style={styles.ticks}>
          {T.ages.map((a) => (
            <Pressable key={a} onPress={() => setAge(a)} hitSlop={6} style={styles.tick} accessibilityLabel={`Age ${a}`}>
              <AppText variant="caption" color={a === age ? Colors.primary : Colors.textMuted}>
                {a}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.result, { backgroundColor: range.tint }]}>
        <AppText variant="bodyMedium" color={range.color}>
          At age {age}
        </AppText>
        <AppText variant="body" style={styles.text}>
          {T.menarche} {T.range}
        </AppText>
      </View>

      <View style={styles.legend}>
        <Legend color={Colors.tint200} label="12–13" />
        <Legend color={Colors.lavenderTint} label="10–15" />
        <Legend color={Colors.tealTint} label="8–17" />
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

function MilestoneCards() {
  const say = useMira();
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggle = (id: string, title: string) => {
    const opening = !open.has(id);
    setOpen((prev) => {
      const next = new Set(prev);
      if (opening) next.add(id);
      else next.delete(id);
      return next;
    });
    if (opening) say(`${title}. You're learning your own body's story.`);
  };

  return (
    <View>
      <AppText variant="h3" style={styles.sectionTitle}>
        Your body&apos;s milestones
      </AppText>
      {PUBERTY_MILESTONES.map((m, i) => {
        const isOpen = open.has(m.id);
        return (
          <Animated.View key={m.id} entering={FadeInUp.delay(i * 90).springify().damping(16)} style={[styles.milestone, { backgroundColor: m.tint }]}>
            <Pressable onPress={() => toggle(m.id, m.title)} accessibilityRole="button" accessibilityState={{ expanded: isOpen }} style={styles.milestoneHead}>
              <IconCircle color={Colors.surface} size={40}>
                <Ionicons name={m.icon} size={20} color={m.color} />
              </IconCircle>
              <AppText variant="h3" style={styles.flex}>
                {m.title}
              </AppText>
              <Ionicons name={isOpen ? 'remove-circle' : 'add-circle'} size={24} color={m.color} />
            </Pressable>
            {isOpen ? (
              <View style={styles.milestoneBody}>
                {m.chips ? (
                  <View style={styles.chips}>
                    {m.chips.map((c) => (
                      <View key={c.label} style={styles.miniChip}>
                        <Ionicons name={c.icon} size={14} color={m.color} />
                        <AppText variant="small" color={Colors.text}>
                          {c.label}
                        </AppText>
                      </View>
                    ))}
                  </View>
                ) : null}
                {m.text.map((t, j) => (
                  <AppText key={j} variant="body" style={styles.text}>
                    {t}
                  </AppText>
                ))}
              </View>
            ) : null}
          </Animated.View>
        );
      })}
    </View>
  );
}

function LeakCard() {
  const say = useMira();
  const [revealed, setRevealed] = useState(false);
  const [burst, setBurst] = useState(0);

  const tap = () => {
    if (!revealed) {
      setRevealed(true);
      setBurst((n) => n + 1);
      say(`You've got this. It happens to almost everyone.`, 'cheer');
    } else {
      setRevealed(false);
    }
  };

  return (
    <View style={[styles.leak, revealed ? styles.leakOpen : null]}>
      <Pressable onPress={tap} accessibilityRole="button" accessibilityState={{ expanded: revealed }} style={styles.leakHead}>
        <IconCircle color={Colors.tint100} size={44}>
          <Ionicons name="school" size={22} color={Colors.primary} />
        </IconCircle>
        <View style={styles.flex}>
          <AppText variant="h3">{LEAK_CARD.title}</AppText>
          <AppText variant="small">{revealed ? 'Tap to close' : 'Tap to reveal'}</AppText>
        </View>
        <Ionicons name={revealed ? 'heart' : 'heart-outline'} size={26} color={Colors.primary} />
      </Pressable>

      {revealed ? (
        <View style={styles.leakBody}>
          <AppText variant="bodyLarge" style={styles.text}>
            {LEAK_CARD.intro}
          </AppText>
          {LEAK_CARD.steps.map((s, i) => (
            <View key={i} style={styles.leakStep}>
              <View style={styles.stepBadge}>
                <AppText variant="caption" color="#FFFFFF">
                  {i + 1}
                </AppText>
              </View>
              <AppText variant="body" style={[styles.text, styles.flex]}>
                {s}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      <HeartBurst trigger={burst} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.xl },
  flex: { flex: 1 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, ...Shadow.card },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 1, borderRadius: Radius.pill },
  hint: { marginTop: 2, marginBottom: Spacing.lg },
  trackArea: { height: 88, justifyContent: 'flex-start' },
  band: { position: 'absolute', height: 20, borderRadius: 10 },
  marker: {
    position: 'absolute',
    top: -2,
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.raised,
  },
  ticks: { position: 'absolute', left: 0, right: 0, top: 44, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: MARKER / 2 - 8 },
  tick: { width: 16, alignItems: 'center', paddingVertical: Spacing.xs },
  result: { borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.xs },
  text: { lineHeight: 23 },
  legend: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.md, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  sectionTitle: { marginBottom: Spacing.md },
  milestone: { borderRadius: Radius.lg, marginBottom: Spacing.md, overflow: 'hidden' },
  milestoneHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  milestoneBody: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, gap: Spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  miniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  leak: { backgroundColor: Colors.tint50, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.tint200 },
  leakOpen: { backgroundColor: Colors.tint100 },
  leakHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  leakBody: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, gap: Spacing.md },
  leakStep: { flexDirection: 'row', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md },
  stepBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
});

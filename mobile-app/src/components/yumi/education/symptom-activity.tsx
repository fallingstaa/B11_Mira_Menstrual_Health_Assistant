import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/yumi/app-text';
import { FlipCard } from '@/components/yumi/education/flip-card';
import { useYumi } from '@/components/yumi/education/yumi-companion';
import { IconCircle } from '@/components/yumi/icon-circle';
import { getActivities } from '@/constants/education-activities';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

/** Topic 4: pick a symptom, flip its card to see why it happens, then try the relief toolkit. */
export function SymptomActivity() {
  return (
    <View style={styles.stack}>
      <SymptomFlip />
      <ReliefToolkit />
    </View>
  );
}

function SymptomFlip() {
  const say = useYumi();
  const { t } = useTranslation();
  const { SYMPTOM_CARDS } = getActivities();
  const [selected, setSelected] = useState(SYMPTOM_CARDS[0].id);
  const [flipped, setFlipped] = useState(false);
  const card = SYMPTOM_CARDS.find((c) => c.id === selected) ?? SYMPTOM_CARDS[0];

  const choose = (id: string) => {
    if (id === selected) return;
    setSelected(id);
    setFlipped(false);
  };

  return (
    <View>
      <AppText variant="h3">{t('education.symptoms.title')}</AppText>
      <AppText variant="small" style={styles.hint}>
        {t('education.symptoms.hint')}
      </AppText>

      <View style={styles.tiles}>
        {SYMPTOM_CARDS.map((c) => {
          const on = c.id === selected;
          return (
            <Pressable
              key={c.id}
              onPress={() => choose(c.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[styles.tile, { backgroundColor: on ? c.color : c.tint }]}>
              <Ionicons name={c.icon} size={20} color={on ? '#FFFFFF' : c.color} />
              <AppText variant="caption" color={on ? '#FFFFFF' : Colors.text}>
                {c.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <FlipCard
        height={360}
        flipped={flipped}
        onFlip={() => {
          if (!flipped) say(t('education.symptoms.sayCommon', { symptom: card.label }));
          setFlipped((f) => !f);
        }}
        frontColor={card.tint}
        backColor={Colors.surface}
        accent={card.color}
        backLabel={t('education.tapToFlipBack')}
        front={
          <>
            <IconCircle color={Colors.surface} size={72}>
              <Ionicons name={card.icon} size={34} color={card.color} />
            </IconCircle>
            <AppText variant="h2" color={card.color} center>
              {card.label}
            </AppText>
            <AppText variant="small" center>
              {t('education.symptoms.findOut')}
            </AppText>
          </>
        }
        back={
          <>
            <View style={styles.backHead}>
              <Ionicons name={card.icon} size={20} color={card.color} />
              <AppText variant="h3" color={card.color}>
                {t('education.symptoms.why', { symptom: card.label.toLowerCase() })}
              </AppText>
            </View>
            {card.why.map((w, i) => (
              <AppText key={i} variant="body" style={styles.text}>
                {w}
              </AppText>
            ))}
          </>
        }
      />
    </View>
  );
}

function ReliefToolkit() {
  const say = useYumi();
  const { t } = useTranslation();
  const { RELIEF } = getActivities();
  const [warm, setWarm] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  const warmth = useSharedValue(0);
  useEffect(() => {
    warmth.value = withTiming(warm ? 1 : 0, { duration: 500 });
  }, [warm, warmth]);
  const warmStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(warmth.value, [0, 1], [Colors.surfaceAlt, Colors.peachTint]),
    borderColor: interpolateColor(warmth.value, [0, 1], [Colors.border, Colors.peach]),
  }));

  return (
    <View style={styles.card}>
      <AppText variant="h3">{t('education.symptoms.reliefTitle')}</AppText>
      <AppText variant="small" style={styles.hint}>
        {t('education.symptoms.reliefHint')}
      </AppText>

      {/* Warm water bottle toggle */}
      <Pressable
        onPress={() => {
          if (!warm) say(t('education.symptoms.sayWarm'), 'cheer');
          setWarm((w) => !w);
        }}
        accessibilityRole="switch"
        accessibilityState={{ checked: warm }}
        accessibilityLabel={RELIEF.warmth.label}>
        <Animated.View style={[styles.tool, warmStyle]}>
          <View style={styles.toolHead}>
            <IconCircle color={Colors.surface} size={40}>
              <Ionicons name={warm ? 'flame' : 'flame-outline'} size={20} color={Colors.peach} />
            </IconCircle>
            <AppText variant="h3" style={styles.flex}>
              {RELIEF.warmth.label}
            </AppText>
            <View style={[styles.switchTrack, warm && styles.switchOn]}>
              <View style={[styles.switchKnob, warm && styles.switchKnobOn]} />
            </View>
          </View>
          {warm ? (
            <View>
              <AppText variant="body" style={styles.text}>
                {RELIEF.warmth.text}
              </AppText>
              <AppText variant="body" style={[styles.text, styles.gap]}>
                {RELIEF.movement.text}
              </AppText>
            </View>
          ) : null}
        </Animated.View>
      </Pressable>

      <BreathingPacer />

      {/* Magnesium-rich snack ideas */}
      <View style={[styles.tool, { backgroundColor: Colors.tealTint, borderColor: Colors.border }]}>
        <View style={styles.toolHead}>
          <IconCircle color={Colors.surface} size={40}>
            <Ionicons name="nutrition" size={20} color={Colors.teal} />
          </IconCircle>
          <AppText variant="h3" style={styles.flex}>
            {RELIEF.snacks.label}
          </AppText>
        </View>
        <View style={styles.chips}>
          {RELIEF.snacks.chips.map((c) => {
            const on = snack === c;
            return (
              <Pressable
                key={c}
                onPress={() => {
                  setSnack(on ? null : c);
                  if (!on) say(t('education.symptoms.saySnack', { snack: c }), 'cheer');
                }}
                style={[styles.chip, on && { backgroundColor: Colors.teal }]}>
                <AppText variant="bodyMedium" color={on ? '#FFFFFF' : Colors.text}>
                  {c}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        {snack ? (
          <AppText variant="body" style={styles.text}>
            {RELIEF.snacks.text}
          </AppText>
        ) : null}
      </View>

      <View style={styles.tip}>
        <Ionicons name="walk" size={18} color={Colors.primary} />
        <AppText variant="small" style={styles.flex}>
          {RELIEF.exercise.text}
        </AppText>
      </View>
    </View>
  );
}

const ROUNDS = 5;
const BREATH_MS = 4000;

/** A calm 4-second in / 4-second out pacer. A moment to relax with Yumi, not a medical treatment. */
function BreathingPacer() {
  const say = useYumi();
  const { t } = useTranslation();
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [round, setRound] = useState(0);

  const scale = useSharedValue(0.7);

  useEffect(() => {
    if (!running) {
      scale.value = withSpring(0.7);
      return;
    }
    scale.value = withTiming(phase === 'in' ? 1.15 : 0.7, { duration: BREATH_MS });
    const timer = setTimeout(() => {
      if (phase === 'in') {
        setPhase('out');
      } else if (round + 1 >= ROUNDS) {
        setRunning(false);
        setRound(0);
        setPhase('in');
        say(t('education.symptoms.sayBreaths'), 'cheer');
      } else {
        setRound((r) => r + 1);
        setPhase('in');
      }
    }, BREATH_MS);
    return () => clearTimeout(timer);
  }, [running, phase, round, scale, say, t]);

  const circle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={[styles.tool, { backgroundColor: Colors.lavenderTint, borderColor: Colors.border }]}>
      <View style={styles.toolHead}>
        <IconCircle color={Colors.surface} size={40}>
          <Ionicons name="leaf" size={20} color={Colors.lavender} />
        </IconCircle>
        <View style={styles.flex}>
          <AppText variant="h3">{t('education.symptoms.breathTitle')}</AppText>
          <AppText variant="small">{t('education.symptoms.breathSubtitle')}</AppText>
        </View>
      </View>

      <View style={styles.pacerArea}>
        <Animated.View style={[styles.pacer, circle]}>
          <AppText variant="bodyMedium" color="#FFFFFF" center>
            {running ? (phase === 'in' ? t('education.symptoms.breatheIn') : t('education.symptoms.breatheOut')) : t('education.symptoms.ready')}
          </AppText>
        </Animated.View>
      </View>

      <Pressable
        onPress={() => {
          setRound(0);
          setPhase('in');
          setRunning((r) => !r);
        }}
        accessibilityRole="button"
        style={styles.pacerButton}>
        <AppText variant="button">{running ? t('education.symptoms.stop', { n: round + 1, total: ROUNDS }) : t('education.symptoms.start', { total: ROUNDS })}</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.xl },
  flex: { flex: 1 },
  hint: { marginTop: 2, marginBottom: Spacing.lg },
  text: { lineHeight: 23 },
  gap: { marginTop: Spacing.sm },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  tile: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, borderRadius: Radius.pill },
  backHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, ...Shadow.card },
  tool: { borderRadius: Radius.lg, borderWidth: 1.5, padding: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.md },
  toolHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  switchTrack: { width: 44, height: 26, borderRadius: 13, backgroundColor: Colors.border, padding: 3, justifyContent: 'center' },
  switchOn: { backgroundColor: Colors.peach },
  switchKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
  switchKnobOn: { alignSelf: 'flex-end' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.pill, backgroundColor: Colors.surface },
  tip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.tint50, borderRadius: Radius.md, padding: Spacing.md },
  pacerArea: { height: 130, alignItems: 'center', justifyContent: 'center' },
  pacer: { width: 110, height: 110, borderRadius: 55, backgroundColor: Colors.lavender, alignItems: 'center', justifyContent: 'center' },
  pacerButton: { alignItems: 'center', paddingVertical: Spacing.md, borderRadius: Radius.pill, backgroundColor: Colors.lavender },
});

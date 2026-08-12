import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Card } from '@/components/mira/card';
import { IconCircle } from '@/components/mira/icon-circle';
import { ScreenContainer } from '@/components/mira/screen-container';
import { ScreenHeader } from '@/components/mira/screen-header';
import { cycleStats, pastPeriods, today } from '@/constants/mock-data';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { daysBetween, formatRange, formatShort } from '@/utils/date';

type PhaseKey = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

const PHASES: {
  key: PhaseKey;
  label: string;
  sublabel: string;
  start: number;
  end: number;
  color: string;
  tint: string;
  icon: keyof typeof Ionicons.glyphMap;
  momentum: string;
  description: string;
}[] = [
  {
    key: 'menstrual',
    label: 'Menstrual',
    sublabel: 'Period',
    start: 1,
    end: cycleStats.averagePeriodLength,
    color: Colors.primary,
    tint: Colors.tint50,
    icon: 'water',
    momentum: 'Take it easy',
    description: 'Your body is shedding the uterine lining. Cramps and fatigue are common — rest and stay hydrated.',
  },
  {
    key: 'follicular',
    label: 'Follicular',
    sublabel: 'Pre-ovulation',
    start: cycleStats.averagePeriodLength + 1,
    end: 13,
    color: Colors.warning,
    tint: Colors.warningTint,
    icon: 'star',
    momentum: 'Energy is increasing',
    description:
      'Your estrogen is rising, and you may feel more energetic and social. A great time for exercise and creativity!',
  },
  {
    key: 'ovulation',
    label: 'Ovulation',
    sublabel: 'Peak fertility',
    start: 14,
    end: 16,
    color: Colors.success,
    tint: Colors.successTint,
    icon: 'sunny',
    momentum: 'Energy peaking',
    description: "You're at your most fertile. Some people notice a boost in confidence, energy, and libido around this time.",
  },
  {
    key: 'luteal',
    label: 'Luteal',
    sublabel: 'Post-ovulation',
    start: 17,
    end: cycleStats.averageCycleLength,
    color: Colors.lavender,
    tint: Colors.lavenderTint,
    icon: 'moon',
    momentum: 'Energy winding down',
    description: 'Progesterone rises then falls. Cravings, mood swings, or fatigue are common as your next period approaches.',
  },
];

function currentPhase(day: number) {
  return PHASES.find((p) => day <= p.end) ?? PHASES[PHASES.length - 1];
}

export default function PredictionScreen() {
  const daysUntilNext = daysBetween(today, cycleStats.nextPeriodStart);
  const phase = currentPhase(cycleStats.currentDay);

  const history = pastPeriods
    .map((p, i, arr) => ({ ...p, cycleLength: i > 0 ? daysBetween(arr[i - 1].start, p.start) : null }))
    .slice()
    .reverse();

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScreenHeader title="Cycle Prediction" subtitle="Based on your history" />

      <Card padded={false} style={styles.heroCard} noShadow>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}>
          <AppText variant="caption" color="rgba(255,255,255,0.75)">
            NEXT PERIOD ESTIMATED
          </AppText>
          <AppText variant="display" color={Colors.textOnPrimary} style={styles.heroRange}>
            {formatRange(cycleStats.nextPeriodStart, cycleStats.nextPeriodEnd)}
          </AppText>
          <AppText variant="body" color="rgba(255,255,255,0.85)">
            {daysUntilNext} days from today
          </AppText>

          <View style={styles.heroStatsRow}>
            <HeroChip value={`${cycleStats.averageCycleLength} days`} label="Cycle Length" />
            <HeroChip value={`${cycleStats.averagePeriodLength} days`} label="Period Length" />
            <HeroChip value={formatShort(cycleStats.lastPeriodStart)} label="Last Period" />
          </View>
        </LinearGradient>
      </Card>

      <Card style={styles.card} delay={60}>
        <AppText variant="h3" style={styles.cardTitle}>
          You are currently in
        </AppText>
        <View style={[styles.phaseBox, { backgroundColor: phase.tint }]}>
          <IconCircle color={Colors.surface} size={40}>
            <Ionicons name={phase.icon} size={18} color={phase.color} />
          </IconCircle>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyMedium">{phase.label} Phase</AppText>
            <AppText variant="small" color={Colors.textSecondary} style={{ marginTop: 2 }}>
              Day {cycleStats.currentDay} of {cycleStats.averageCycleLength} · {phase.momentum}
            </AppText>
          </View>
        </View>
        <AppText variant="small" color={Colors.textSecondary} style={styles.phaseDescription}>
          {phase.description}
        </AppText>
      </Card>

      <Card style={styles.card} delay={100}>
        <AppText variant="h3" style={styles.cardTitle}>
          Cycle Phases
        </AppText>
        <View style={styles.phaseBar}>
          {PHASES.map((p) => (
            <View key={p.key} style={{ flex: p.end - p.start + 1, backgroundColor: p.color }} />
          ))}
        </View>
        <View style={styles.phaseLegend}>
          {PHASES.map((p, i) => (
            <View key={p.key} style={[styles.phaseRow, i !== 0 && styles.phaseRowBorder]}>
              <View style={[styles.phaseDot, { backgroundColor: p.color }]} />
              <View style={styles.phaseLabelRow}>
                <AppText variant="bodyMedium">{p.label}</AppText>
                <AppText variant="small" color={Colors.textMuted}>
                  {p.sublabel}
                </AppText>
              </View>
              <AppText variant="small" color={Colors.textMuted}>
                Day {p.start}-{p.end}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.card} delay={140}>
        <AppText variant="h3" style={styles.cardTitle}>
          Cycle History
        </AppText>
        {history.map((p, i) => (
          <View key={i} style={[styles.historyRow, i !== 0 && styles.historyRowBorder]}>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyMedium">
                {formatRange(p.start, p.end)}, {p.start.getFullYear()}
              </AppText>
              <AppText variant="small" color={Colors.textMuted} style={{ marginTop: 2 }}>
                {p.cycleLength ? `${p.cycleLength}-day cycle` : 'First recorded cycle'}
              </AppText>
            </View>
            <View style={styles.historyPill}>
              <AppText variant="small" color={Colors.primary}>
                {daysBetween(p.start, p.end) + 1} days
              </AppText>
            </View>
          </View>
        ))}
      </Card>

      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
        <AppText variant="small" style={styles.disclaimerText}>
          Estimated based on your previous records. Actual dates may vary — this is not medical advice.
        </AppText>
      </View>
    </ScreenContainer>
  );
}

function HeroChip({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.heroChip}>
      <AppText variant="bodyMedium" color={Colors.textOnPrimary}>
        {value}
      </AppText>
      <AppText variant="caption" color="rgba(255,255,255,0.75)">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: { overflow: 'hidden', marginBottom: Spacing.lg },
  heroGradient: { padding: Spacing.xl },
  heroRange: { marginTop: Spacing.xs, marginBottom: Spacing.xs },
  heroStatsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  heroChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    gap: 2,
  },
  card: { marginBottom: Spacing.lg },
  cardTitle: { marginBottom: Spacing.md },
  phaseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  phaseDescription: { marginTop: Spacing.md, lineHeight: 19 },
  phaseBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  phaseLegend: { marginTop: Spacing.lg },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm + 2 },
  phaseRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  phaseDot: { width: 10, height: 10, borderRadius: 5 },
  phaseLabelRow: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  historyRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  historyPill: {
    backgroundColor: Colors.tint50,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.xxxl,
  },
  disclaimerText: { flex: 1, lineHeight: 17 },
});

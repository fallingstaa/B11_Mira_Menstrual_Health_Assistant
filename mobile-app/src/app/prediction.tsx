import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/yumi/app-text';
import { Card } from '@/components/yumi/card';
import { CycleRecapModal, RecapCycle } from '@/components/yumi/cycle-recap-modal';
import { IconCircle } from '@/components/yumi/icon-circle';
import { ScreenContainer } from '@/components/yumi/screen-container';
import { ScreenHeader } from '@/components/yumi/screen-header';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getPeriodStreaks, useAppState } from '@/context/app-state';
import i18n, { formatDays } from '@/i18n';
import { apiRequest } from '@/utils/api';
import { daysBetween, formatRange, formatShort, parseIsoDate } from '@/utils/date';

/** Shape of `GET /api/menstrual/prediction` this screen reads — see menstrualController.js.
 *  Every field but the two lengths is null until a first period's ever been logged. */
type PredictionResponse = {
  currentDay: number | null;
  averageCycleLength: number;
  averagePeriodLength: number;
  phase: string | null;
  nextPeriodStart: string | null;
  nextPeriodEnd: string | null;
};

type PhaseKey = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

type PhaseInfo = {
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
};

/**
 * Computes the 4 phases' day-ranges from *this* user's own averageCycleLength/
 * averagePeriodLength, instead of the fixed 28-day-cycle boundaries (Menstrual
 * end-of-period, Follicular through 13, Ovulation 14-16, Luteal 17+) this screen used
 * to hardcode for everyone. Mirrors backend/src/services/predictionService.js's
 * cyclePhase() and home.tsx's cyclePhase() — keep all three in sync if this changes.
 *
 * - Menstrual: Day 1 through averagePeriodLength.
 * - Ovulation: a 3-day window centered on the estimated ovulation day
 *   (averageCycleLength - 14 — the same "~14 days before the next period" assumption
 *   the prediction math uses for the fertile window).
 * - Follicular: everything between Menstrual's end and Ovulation's start.
 * - Luteal: everything after Ovulation, through the end of the cycle.
 *
 * Every boundary is clamped to stay >= the one before it, so an unusual combination
 * (e.g. a very short cycle with a long period) collapses a phase to zero days instead
 * of rendering an inverted/negative-width range — buildPhases filters those out below.
 */
function buildPhases(averageCycleLength: number, averagePeriodLength: number): PhaseInfo[] {
  const periodLength = Math.max(1, averagePeriodLength);
  const cycleLength = Math.max(20, averageCycleLength);
  const estimatedOvulationDay = cycleLength - 14;

  const menstrualEnd = periodLength;
  const follicularStart = menstrualEnd + 1;
  const ovulationStart = Math.max(follicularStart, estimatedOvulationDay - 1);
  const follicularEnd = ovulationStart - 1;
  const ovulationEnd = Math.max(ovulationStart, estimatedOvulationDay + 1);
  const lutealStart = ovulationEnd + 1;
  const lutealEnd = Math.max(lutealStart, cycleLength);

  const phases: PhaseInfo[] = [
    {
      key: 'menstrual',
      label: i18n.t('prediction.phases.menstrual.label'),
      sublabel: i18n.t('prediction.phases.menstrual.sublabel'),
      start: 1,
      end: menstrualEnd,
      color: Colors.primary,
      tint: Colors.tint50,
      icon: 'water',
      momentum: i18n.t('prediction.phases.menstrual.momentum'),
      description: i18n.t('prediction.phases.menstrual.description'),
    },
    {
      key: 'follicular',
      label: i18n.t('prediction.phases.follicular.label'),
      sublabel: i18n.t('prediction.phases.follicular.sublabel'),
      start: follicularStart,
      end: follicularEnd,
      color: Colors.warning,
      tint: Colors.warningTint,
      icon: 'star',
      momentum: i18n.t('prediction.phases.follicular.momentum'),
      description: i18n.t('prediction.phases.follicular.description'),
    },
    {
      key: 'ovulation',
      label: i18n.t('prediction.phases.ovulation.label'),
      sublabel: i18n.t('prediction.phases.ovulation.sublabel'),
      start: ovulationStart,
      end: ovulationEnd,
      color: Colors.success,
      tint: Colors.successTint,
      icon: 'sunny',
      momentum: i18n.t('prediction.phases.ovulation.momentum'),
      description: i18n.t('prediction.phases.ovulation.description'),
    },
    {
      key: 'luteal',
      label: i18n.t('prediction.phases.luteal.label'),
      sublabel: i18n.t('prediction.phases.luteal.sublabel'),
      start: lutealStart,
      end: lutealEnd,
      color: Colors.lavender,
      tint: Colors.lavenderTint,
      icon: 'moon',
      momentum: i18n.t('prediction.phases.luteal.momentum'),
      description: i18n.t('prediction.phases.luteal.description'),
    },
  ];

  // Drop any phase a tight/unusual combination of lengths squeezed down to 0 days —
  // keeps the phase bar's flex widths and the legend from showing an inverted range.
  return phases.filter((p) => p.end >= p.start);
}

/**
 * Which of the local decorative PhaseInfo entries (icon/color/momentum/description — none of
 * which the backend knows about) matches "now". Prefers matching by `phaseLabel` — the backend's
 * own `GET /api/menstrual/prediction`'s `phase` field (e.g. "Menstrual phase") — over re-deriving
 * it from `day` client-side, so this screen's day/phase math and the backend's never disagree.
 * `day`-based lookup is only the fallback for whenever `phaseLabel` is null (no period logged
 * yet); `phases[0]` after that covers the (should-be-impossible) case where neither is usable.
 */
function currentPhase(phases: PhaseInfo[], phaseLabel: string | null, day: number | null): PhaseInfo {
  if (phaseLabel) {
    // Backend sends "Menstrual phase" (always English); matched on the phase's stable key so
    // this keeps working whatever language the local labels are shown in.
    const match = phases.find((p) => phaseLabel.toLowerCase().startsWith(p.key));
    if (match) return match;
  }
  if (day != null) return phases.find((p) => day <= p.end) ?? phases[phases.length - 1];
  return phases[0];
}

export default function PredictionScreen() {
  const { periodEntries } = useAppState();
  const { t } = useTranslation();
  const [recapCycle, setRecapCycle] = useState<RecapCycle | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  // GET /menstrual/prediction doesn't include lastPeriodStart (it's not part of "predicting
  // what's next") — GET /profile/me's own cycle cache does, so that's fetched alongside it just
  // for this one "Last Period" chip below.
  const [lastPeriodStart, setLastPeriodStart] = useState<Date | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Refetches every time this screen regains focus (from Home's "Details" or Calendar's "View
  // Prediction Details"), same reasoning as Home's own useFocusEffect — a period logged right
  // before navigating here should show up immediately, not whatever was cached from last visit.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([
        apiRequest<PredictionResponse>('/menstrual/prediction'),
        apiRequest<{ cycle: { lastPeriodStart: string | null } }>('/profile/me'),
      ])
        .then(([predictionData, profileData]) => {
          if (cancelled) return;
          setPrediction(predictionData);
          setLastPeriodStart(profileData.cycle.lastPeriodStart ? parseIsoDate(profileData.cycle.lastPeriodStart) : null);
        })
        .catch((err) => {
          console.error('[prediction] failed to load /menstrual/prediction or /profile/me:', err);
        })
        .finally(() => {
          if (!cancelled) setDataLoaded(true);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const averageCycleLength = prediction?.averageCycleLength ?? 28;
  const averagePeriodLength = prediction?.averagePeriodLength ?? 5;
  const nextPeriodStart = prediction?.nextPeriodStart ? parseIsoDate(prediction.nextPeriodStart) : null;
  const nextPeriodEnd = prediction?.nextPeriodEnd ? parseIsoDate(prediction.nextPeriodEnd) : null;
  const daysUntilNext = nextPeriodStart ? daysBetween(new Date(), nextPeriodStart) : null;

  const phases = buildPhases(averageCycleLength, averagePeriodLength);
  const phase = currentPhase(phases, prediction?.phase ?? null, prediction?.currentDay ?? null);

  // Once the user has entered anything real, their data replaces the canned demo history here
  // too, same rule Calendar's grid already follows — otherwise "Cycle History" would keep
  // showing fake cycles a real recap could never actually explain. No mock/demo fallback for an
  // empty account anymore either — see the empty state below instead of pastPeriods.
  const history = useMemo(() => {
    const streaks = getPeriodStreaks(periodEntries);
    return streaks
      .map((p, i, arr) => ({ ...p, cycleLength: i > 0 ? daysBetween(arr[i - 1].start, p.start) : null }))
      .slice()
      .reverse();
  }, [periodEntries]);

  if (!dataLoaded) {
    return (
      <ScreenContainer edges={['top', 'left', 'right']}>
        <ScreenHeader title={t('prediction.title')} subtitle={t('prediction.subtitle')} />
        <View style={styles.loadingWrap}>
          <AppText variant="small" color={Colors.textMuted}>
            {t('prediction.loading')}
          </AppText>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScreenHeader title={t('prediction.title')} subtitle={t('prediction.subtitle')} />

      <Card padded={false} style={styles.heroCard} noShadow>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}>
          <AppText variant="caption" color="rgba(255,255,255,0.75)">
            {t('prediction.nextEstimated')}
          </AppText>
          <AppText variant="display" color={Colors.textOnPrimary} style={styles.heroRange}>
            {nextPeriodStart && nextPeriodEnd ? formatRange(nextPeriodStart, nextPeriodEnd) : t('prediction.notEnoughData')}
          </AppText>
          <AppText variant="body" color="rgba(255,255,255,0.85)">
            {daysUntilNext != null ? t('prediction.daysFromToday', { n: daysUntilNext }) : t('prediction.recordToPredict')}
          </AppText>

          <View style={styles.heroStatsRow}>
            <HeroChip value={formatDays(averageCycleLength)} label={t('prediction.cycleLength')} />
            <HeroChip value={formatDays(averagePeriodLength)} label={t('prediction.periodLength')} />
            <HeroChip value={lastPeriodStart ? formatShort(lastPeriodStart) : '—'} label={t('prediction.lastPeriod')} />
          </View>
        </LinearGradient>
      </Card>

      <Card style={styles.card} delay={60}>
        <AppText variant="h3" style={styles.cardTitle}>
          {t('prediction.currentlyIn')}
        </AppText>
        <View style={[styles.phaseBox, { backgroundColor: phase.tint }]}>
          <IconCircle color={Colors.surface} size={40}>
            <Ionicons name={phase.icon} size={18} color={phase.color} />
          </IconCircle>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyMedium">{t('prediction.phaseTitle', { phase: phase.label })}</AppText>
            <AppText variant="small" color={Colors.textSecondary} style={{ marginTop: 2 }}>
              {t('prediction.dayOf', { day: prediction?.currentDay ?? '—', total: averageCycleLength })} · {phase.momentum}
            </AppText>
          </View>
        </View>
        <AppText variant="small" color={Colors.textSecondary} style={styles.phaseDescription}>
          {phase.description}
        </AppText>
      </Card>

      <Card style={styles.card} delay={100}>
        <AppText variant="h3" style={styles.cardTitle}>
          {t('prediction.cyclePhases')}
        </AppText>
        <View style={styles.phaseBar}>
          {phases.map((p) => (
            <View key={p.key} style={{ flex: p.end - p.start + 1, backgroundColor: p.color }} />
          ))}
        </View>
        <View style={styles.phaseLegend}>
          {phases.map((p, i) => (
            <View key={p.key} style={[styles.phaseRow, i !== 0 && styles.phaseRowBorder]}>
              <View style={[styles.phaseDot, { backgroundColor: p.color }]} />
              <View style={styles.phaseLabelRow}>
                <AppText variant="bodyMedium">{p.label}</AppText>
                <AppText variant="small" color={Colors.textMuted}>
                  {p.sublabel}
                </AppText>
              </View>
              <AppText variant="small" color={Colors.textMuted}>
                {t('prediction.dayRange', { start: p.start, end: p.end })}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.card} delay={140}>
        <AppText variant="h3" style={styles.cardTitle}>
          {t('prediction.cycleHistory')}
        </AppText>
        {history.length === 0 ? (
          <View style={styles.historyEmpty}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
            <AppText variant="small" color={Colors.textMuted} style={styles.historyEmptyText}>
              {t('prediction.historyEmpty')}
            </AppText>
          </View>
        ) : (
          <AppText variant="small" color={Colors.textMuted} style={styles.historyHint}>
            {t('prediction.historyHint')}
          </AppText>
        )}
        {history.map((p, i) => (
          <Pressable
            key={i}
            onPress={() => setRecapCycle(p)}
            style={[styles.historyRow, i !== 0 && styles.historyRowBorder]}>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyMedium">
                {formatRange(p.start, p.end)}, {p.start.getFullYear()}
              </AppText>
              <AppText variant="small" color={Colors.textMuted} style={{ marginTop: 2 }}>
                {p.cycleLength ? t('prediction.cycleOfDays', { n: p.cycleLength }) : t('prediction.firstCycle')}
              </AppText>
            </View>
            <View style={styles.historyPill}>
              <AppText variant="small" color={Colors.primary}>
                {formatDays(daysBetween(p.start, p.end) + 1)}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </Pressable>
        ))}
      </Card>

      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
        <AppText variant="small" style={styles.disclaimerText}>
          {t('prediction.disclaimer')}
        </AppText>
      </View>

      <CycleRecapModal
        visible={!!recapCycle}
        cycle={recapCycle}
        entries={periodEntries}
        onClose={() => setRecapCycle(null)}
      />
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
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: '40%' },
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
  historyHint: { marginBottom: Spacing.sm },
  historyEmpty: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: Spacing.sm },
  historyEmptyText: { flex: 1, lineHeight: 18 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
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

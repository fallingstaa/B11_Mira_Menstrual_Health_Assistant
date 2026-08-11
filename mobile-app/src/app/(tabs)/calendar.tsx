import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { Card } from '@/components/mira/card';
import { Dot } from '@/components/mira/chip';
import { PeriodDayEditor } from '@/components/mira/period-day-editor';
import { PeriodEntriesSummary } from '@/components/mira/period-entries-summary';
import { ScreenContainer } from '@/components/mira/screen-container';
import { cycleStats, pastPeriods } from '@/constants/mock-data';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { dateKey, getMonthGrid, isSameDay, isWithinRange, monthLabel, WEEKDAY_LABELS } from '@/utils/date';

type DayStatus = 'period' | 'period-end' | 'predicted' | 'fertile' | 'none';

export default function CalendarScreen() {
  const { periodEntries, togglePeriodDay, setPeriodEndDay, updatePeriodDayEntry } = useAppState();
  // The real device date, not the app's fixed demo date — so "Today" always lands on the actual day.
  const [today] = useState(() => new Date());
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);

  const hasRealEntries = Object.keys(periodEntries).length > 0;

  const getStatus = (date: Date): DayStatus => {
    const entry = periodEntries[dateKey(date)];
    if (entry) return entry.isEnd ? 'period-end' : 'period';
    // Once the user has entered anything real, their data replaces the canned demo history —
    // only the forward-looking prediction/fertile window (which we can't compute without a
    // backend) still comes from the mock. A completely fresh session still shows demo history.
    if (!hasRealEntries && pastPeriods.some((p) => isWithinRange(date, p.start, p.end))) return 'period';
    if (isWithinRange(date, cycleStats.nextPeriodStart, cycleStats.nextPeriodEnd)) return 'predicted';
    if (isWithinRange(date, cycleStats.fertileWindowStart, cycleStats.fertileWindowEnd)) return 'fertile';
    return 'none';
  };

  const grid = useMemo(() => getMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const status = getStatus(selected);
  const selectedEntry = periodEntries[dateKey(selected)];

  const changeMonth = (delta: number) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  };

  const toggleSelectedSymptom = (key: string) => {
    const symptoms = selectedEntry?.symptoms ?? [];
    updatePeriodDayEntry(selected, {
      symptoms: symptoms.includes(key) ? symptoms.filter((s) => s !== key) : [...symptoms, key],
    });
  };

  /** Jump to an already-recorded day, even if it's in a different month than currently shown. */
  const jumpToDay = (date: Date) => {
    setSelected(date);
    setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  return (
    <ScreenContainer>
      <AppText variant="h1" style={styles.pageTitle}>
        Calendar
      </AppText>

      <Card style={styles.calendarCard}>
        <View style={styles.monthRow}>
          <Pressable onPress={() => changeMonth(-1)} style={styles.navButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={18} color={Colors.text} />
          </Pressable>
          <AppText variant="h3">{monthLabel(cursor)}</AppText>
          <Pressable onPress={() => changeMonth(1)} style={styles.navButton} hitSlop={8}>
            <Ionicons name="chevron-forward" size={18} color={Colors.text} />
          </Pressable>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((w, i) => (
            <AppText key={i} variant="caption" style={styles.weekdayLabel}>
              {w}
            </AppText>
          ))}
        </View>

        <Animated.View entering={FadeIn.duration(220)} key={monthLabel(cursor)} style={styles.grid}>
          {grid.map(({ date, inMonth }, i) => {
            const dayStatus = getStatus(date);
            const isSelected = isSameDay(date, selected);
            const isTodayCell = isSameDay(date, today);
            const isPeriod = dayStatus === 'period' || dayStatus === 'period-end';

            return (
              <Pressable key={i} style={styles.cell} onPress={() => setSelected(date)}>
                <View
                  style={[
                    styles.cellInner,
                    isPeriod && { backgroundColor: Colors.primary },
                    dayStatus === 'predicted' && { backgroundColor: Colors.tint200 },
                    dayStatus === 'fertile' && { backgroundColor: Colors.tealTint },
                    isTodayCell && !isSelected && styles.todayRing,
                    isSelected && styles.selectedCell,
                  ]}>
                  <AppText
                    variant="small"
                    color={isPeriod || isSelected ? Colors.textOnPrimary : inMonth ? Colors.text : Colors.textMuted}>
                    {date.getDate()}
                  </AppText>
                  {dayStatus === 'period-end' && (
                    <View style={styles.endBadge}>
                      <Ionicons name="flag" size={7} color={Colors.textOnPrimary} />
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </Animated.View>

        <View style={styles.legendRow}>
          <LegendItem color={Colors.primary} label="Period" />
          <LegendItem color={Colors.tint200} label="Estimated" />
          <LegendItem color={Colors.teal} label="Fertile window" />
        </View>
      </Card>

      <Button
        label="View Prediction Details"
        variant="secondary"
        icon={<Ionicons name="stats-chart" size={16} color={Colors.primary} />}
        onPress={() => router.push('/prediction')}
        style={styles.predictionButton}
      />

      {!selectedEntry && (status === 'predicted' || status === 'fertile') && (
        <AppText variant="small" color={Colors.textSecondary} style={styles.hint}>
          {status === 'predicted'
            ? 'Estimated period day, based on your cycle history.'
            : 'Estimated fertile window.'}
        </AppText>
      )}

      <PeriodEntriesSummary
        entries={periodEntries}
        activeDate={selected}
        onSelect={jumpToDay}
        onRemove={togglePeriodDay}
        delay={70}
      />

      <PeriodDayEditor
        date={selected}
        entry={selectedEntry}
        onToggleMark={() => togglePeriodDay(selected)}
        onSetEndDay={() => setPeriodEndDay(selected)}
        onClearEndDay={() => updatePeriodDayEntry(selected, { isEnd: false })}
        onSetFlow={(flow) => updatePeriodDayEntry(selected, { flow })}
        onToggleSymptom={toggleSelectedSymptom}
        onSetMood={(mood) => updatePeriodDayEntry(selected, { mood })}
        delay={80}
      />
    </ScreenContainer>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <Dot color={color} active />
      <AppText variant="small">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pageTitle: { marginTop: Spacing.md, marginBottom: Spacing.lg },
  calendarCard: { marginBottom: Spacing.lg },
  predictionButton: { marginBottom: Spacing.lg },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    backgroundColor: Colors.tint50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  weekdayLabel: { flex: 1, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  cellInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  todayRing: { borderWidth: 1.5, borderColor: Colors.primary },
  selectedCell: { backgroundColor: Colors.primaryDark },
  endBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: Colors.primaryDark,
    borderWidth: 1.5,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  hint: { marginBottom: Spacing.md },
});

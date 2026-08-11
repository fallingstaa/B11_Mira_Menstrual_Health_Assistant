import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { Card } from '@/components/mira/card';
import { Dot } from '@/components/mira/chip';
import { ScreenContainer } from '@/components/mira/screen-container';
import { cycleStats, pastPeriods, today } from '@/constants/mock-data';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { formatLong, getMonthGrid, isSameDay, isWithinRange, monthLabel, WEEKDAY_LABELS } from '@/utils/date';

type DayStatus = 'period' | 'predicted' | 'fertile' | 'none';

function getStatus(date: Date): DayStatus {
  if (pastPeriods.some((p) => isWithinRange(date, p.start, p.end))) return 'period';
  if (isWithinRange(date, cycleStats.nextPeriodStart, cycleStats.nextPeriodEnd)) return 'predicted';
  if (isWithinRange(date, cycleStats.fertileWindowStart, cycleStats.fertileWindowEnd)) return 'fertile';
  return 'none';
}

export default function CalendarScreen() {
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);

  const grid = useMemo(() => getMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const status = getStatus(selected);
  const isToday = isSameDay(selected, today);

  const changeMonth = (delta: number) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
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

            return (
              <Pressable key={i} style={styles.cell} onPress={() => setSelected(date)}>
                <View
                  style={[
                    styles.cellInner,
                    dayStatus === 'period' && { backgroundColor: Colors.primary },
                    dayStatus === 'predicted' && { backgroundColor: Colors.tint200 },
                    dayStatus === 'fertile' && { backgroundColor: Colors.tealTint },
                    isTodayCell && !isSelected && styles.todayRing,
                    isSelected && styles.selectedCell,
                  ]}>
                  <AppText
                    variant="small"
                    color={
                      dayStatus === 'period' || isSelected
                        ? Colors.textOnPrimary
                        : inMonth
                          ? Colors.text
                          : Colors.textMuted
                    }>
                    {date.getDate()}
                  </AppText>
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

      <Card style={styles.detailsCard} delay={80}>
        <View style={styles.detailsHeader}>
          <View>
            <AppText variant="h3">{formatLong(selected)}</AppText>
            {isToday && (
              <AppText variant="small" color={Colors.primary} style={{ marginTop: 2 }}>
                Today
              </AppText>
            )}
          </View>
          <Dot color={status === 'none' ? Colors.border : statusColor(status)} active />
        </View>

        <AppText variant="body" color={Colors.textSecondary} style={styles.detailsBody}>
          {statusDescription(status)}
        </AppText>

        {status === 'none' && (
          <Button
            label="Record period for this day"
            variant="secondary"
            onPress={() => router.push('/record')}
            style={{ marginTop: Spacing.lg }}
          />
        )}
      </Card>
    </ScreenContainer>
  );
}

function statusColor(status: DayStatus) {
  if (status === 'period') return Colors.primary;
  if (status === 'predicted') return Colors.tint300;
  return Colors.teal;
}

function statusDescription(status: DayStatus) {
  switch (status) {
    case 'period':
      return 'You logged this as a period day.';
    case 'predicted':
      return 'Estimated period day, based on your previous records.';
    case 'fertile':
      return 'Estimated fertile window.';
    default:
      return 'No record for this day yet.';
  }
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
  cellInner: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  todayRing: { borderWidth: 1.5, borderColor: Colors.primary },
  selectedCell: { backgroundColor: Colors.primaryDark },
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
  detailsCard: { marginBottom: Spacing.xxl },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  detailsBody: { marginTop: Spacing.sm, lineHeight: 20 },
});

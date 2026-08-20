import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Card } from '@/components/mira/card';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { PeriodDayEntry } from '@/context/app-state';
import { dateKey, formatLong, isSameDay, isSameMonth, monthKey, monthLabel } from '@/utils/date';

type Props = {
  entries: Record<string, PeriodDayEntry>;
  activeDate: Date;
  today: Date;
  onSelect: (date: Date) => void;
  onRemove: (date: Date) => void;
  /**
   * Calendar's history-lock rule (only the current month stays editable/deletable) applies by
   * default. record-first-period.tsx sets this false — its guided setup calendar lets a first
   * period be marked/edited freely regardless of which month it lands in, since there's no
   * existing history yet for a lock to protect.
   */
  lockPastMonths?: boolean;
  delay?: number;
};

type MonthGroup = {
  monthDate: Date;
  entries: PeriodDayEntry[];
};

/** Buckets entries by calendar month, each bucket sorted oldest-to-newest day, buckets
 *  themselves sorted newest-month-first so the current month always leads the list. */
function groupByMonth(entries: PeriodDayEntry[]): MonthGroup[] {
  const buckets = new Map<string, MonthGroup>();
  entries.forEach((entry) => {
    const key = monthKey(entry.date);
    if (!buckets.has(key)) {
      buckets.set(key, { monthDate: new Date(entry.date.getFullYear(), entry.date.getMonth(), 1), entries: [] });
    }
    buckets.get(key)!.entries.push(entry);
  });
  return Array.from(buckets.values())
    .map((group) => ({ ...group, entries: group.entries.sort((a, b) => a.date.getTime() - b.date.getTime()) }))
    .sort((a, b) => b.monthDate.getTime() - a.monthDate.getTime());
}

/**
 * Plain-language list of every day recorded so far, split into one section per calendar month —
 * the calendar grid only shows one month at a time, so this is what makes a record entered weeks
 * apart easy to find again. Tapping a row jumps the editor to that day, pre-filled with whatever
 * was already saved for it — same Record button either way, no separate "edit mode".
 *
 * Only the current month's section stays open for editing/deleting. Every earlier month is
 * locked — tapping a row (or its X) there explains why instead of doing anything, since that
 * history already feeds the cycle-length/prediction math and needs to stay exactly as first
 * logged. (A previous month is still *loggable* the first time — see PeriodDayEditor's
 * `willLockOnRecord` — but the instant it has an entry, it shows up here locked like any other
 * past month.)
 */
export function PeriodEntriesSummary({ entries, activeDate, today, onSelect, onRemove, lockPastMonths = true, delay = 0 }: Props) {
  const groups = useMemo(() => groupByMonth(Object.values(entries)), [entries]);

  if (groups.length === 0) return null;

  const confirmRemove = (date: Date) => {
    Alert.alert(`Delete ${formatLong(date)}?`, "This removes it from your recorded days. This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onRemove(date) },
    ]);
  };

  const explainLocked = () => {
    Alert.alert(
      'Record locked',
      "This day is from a previous month, so it's locked and can't be edited or deleted anymore — that history already feeds your cycle predictions. Only the current month stays open for changes.",
    );
  };

  return (
    <Card style={styles.card} delay={delay}>
      <AppText variant="h3" style={styles.title}>
        Recorded Days
      </AppText>
      {groups.map((group) => {
        // Two different questions: is this section actually the calendar's current month
        // (drives the "THIS MONTH" label, always accurate) vs. is it open for editing/deleting
        // (drives locking — off entirely on lockPastMonths=false screens like guided setup).
        const isActualCurrentMonth = isSameMonth(group.monthDate, today);
        const isEditable = !lockPastMonths || isActualCurrentMonth;
        return (
          <View key={monthKey(group.monthDate)} style={styles.monthGroup}>
            <View style={styles.monthHeaderRow}>
              <AppText variant="caption" numberOfLines={1} style={styles.monthHeaderLabel}>
                {isActualCurrentMonth ? `THIS MONTH · ${monthLabel(group.monthDate).toUpperCase()}` : monthLabel(group.monthDate).toUpperCase()}
              </AppText>
              {!isEditable && (
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed" size={10} color={Colors.textMuted} />
                  <AppText variant="caption" numberOfLines={1} color={Colors.textMuted}>
                    Locked
                  </AppText>
                </View>
              )}
            </View>

            {group.entries.map((entry, i) => {
              const isActive = isSameDay(entry.date, activeDate);
              return (
                <Pressable
                  key={dateKey(entry.date)}
                  onPress={() => (isEditable ? onSelect(entry.date) : explainLocked())}
                  style={[styles.row, i !== 0 && styles.rowBorder, isActive && styles.rowActive]}>
                  <View style={[styles.dot, entry.isEnd && styles.dotEnd, !isEditable && styles.dotLocked]} />
                  <AppText variant="bodyMedium" numberOfLines={1} style={styles.rowLabel} color={isEditable ? Colors.text : Colors.textMuted}>
                    {formatLong(entry.date)}
                  </AppText>
                  {entry.isEnd && (
                    <View style={styles.endTag}>
                      <Ionicons name="flag" size={10} color={Colors.primaryDark} />
                      <AppText variant="caption" color={Colors.primaryDark}>
                        End
                      </AppText>
                    </View>
                  )}
                  {isEditable ? (
                    <Pressable onPress={() => confirmRemove(entry.date)} hitSlop={8} style={styles.removeButton}>
                      <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                    </Pressable>
                  ) : (
                    <Ionicons name="lock-closed" size={16} color={Colors.textMuted} style={styles.removeButton} />
                  )}
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.lg },
  title: { marginBottom: Spacing.sm },
  monthGroup: { marginTop: Spacing.sm },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  monthHeaderLabel: { flexShrink: 1, color: Colors.textMuted },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    backgroundColor: Colors.tint50,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  rowActive: { backgroundColor: Colors.tint50 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  dotEnd: { backgroundColor: Colors.primaryDark },
  dotLocked: { backgroundColor: Colors.textMuted },
  rowLabel: { flex: 1 },
  endTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.tint50,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  removeButton: { padding: 2 },
});

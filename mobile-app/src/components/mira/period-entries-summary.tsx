import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Card } from '@/components/mira/card';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { PeriodDayEntry } from '@/context/app-state';
import { dateKey, formatLong, isSameDay } from '@/utils/date';

type Props = {
  entries: Record<string, PeriodDayEntry>;
  activeDate: Date;
  onSelect: (date: Date) => void;
  onRemove: (date: Date) => void;
  delay?: number;
};

/**
 * Plain-language list of every day recorded so far — the calendar grid only shows one month at
 * a time, so this is what makes a record entered weeks apart, or the current end date, easy to
 * find and edit again. Tapping a row jumps the editor to that day; the X removes it directly.
 */
export function PeriodEntriesSummary({ entries, activeDate, onSelect, onRemove, delay = 0 }: Props) {
  const sorted = useMemo(() => Object.values(entries).sort((a, b) => a.date.getTime() - b.date.getTime()), [entries]);

  if (sorted.length === 0) return null;

  return (
    <Card style={styles.card} delay={delay}>
      <AppText variant="h3" style={styles.title}>
        Recorded Days
      </AppText>
      {sorted.map((entry, i) => {
        const isActive = isSameDay(entry.date, activeDate);
        return (
          <Pressable
            key={dateKey(entry.date)}
            onPress={() => onSelect(entry.date)}
            style={[styles.row, i !== 0 && styles.rowBorder, isActive && styles.rowActive]}>
            <View style={[styles.dot, entry.isEnd && styles.dotEnd]} />
            <AppText variant="bodyMedium" style={styles.rowLabel}>
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
            <Pressable onPress={() => onRemove(entry.date)} hitSlop={8} style={styles.removeButton}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          </Pressable>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.lg },
  title: { marginBottom: Spacing.sm },
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

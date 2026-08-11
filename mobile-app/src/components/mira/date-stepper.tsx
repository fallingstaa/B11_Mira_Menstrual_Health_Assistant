import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { formatLong } from '@/utils/date';

type Props = {
  label: string;
  date: Date;
  onChange: (date: Date) => void;
};

/** Labeled date field with day-by-day steppers — a lightweight stand-in for a native date picker. */
export function DateStepper({ label, date, onChange }: Props) {
  const step = (delta: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    onChange(next);
  };

  return (
    <View style={styles.wrap}>
      <AppText variant="bodyMedium" style={styles.label}>
        {label}
      </AppText>
      <View style={styles.row}>
        <Pressable style={styles.stepButton} onPress={() => step(-1)} hitSlop={8}>
          <Ionicons name="chevron-back" size={18} color={Colors.primary} />
        </Pressable>
        <View style={styles.dateBox}>
          <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
          <AppText variant="bodyMedium">{formatLong(date)}</AppText>
        </View>
        <Pressable style={styles.stepButton} onPress={() => step(1)} hitSlop={8}>
          <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.lg },
  label: { marginBottom: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepButton: {
    width: 40,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.tint50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.lg,
  },
});

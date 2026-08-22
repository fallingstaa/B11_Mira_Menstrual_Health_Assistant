import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Chip } from '@/components/mira/chip';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type PeriodLengthAnswer = 'yes' | 'no' | null;

// Mirrors MIN_MANUAL_PERIOD_LENGTH/MAX_MANUAL_PERIOD_LENGTH in backend/src/utils/constants.js —
// keep both in sync.
export const MIN_PERIOD_LENGTH = 1;
export const MAX_PERIOD_LENGTH = 14;
export const DEFAULT_PERIOD_LENGTH = 5;

type Props = {
  answer: PeriodLengthAnswer;
  onAnswerChange: (answer: PeriodLengthAnswer) => void;
  periodLength: number;
  onPeriodLengthChange: (days: number) => void;
};

/**
 * "Do you know how many days you usually bleed for?" — the period-length counterpart to
 * CycleLengthQuestion. Cycle length and period length are two different, independent numbers
 * (see the doc comment on averagePeriodDuration in context/app-state.tsx) — until now only cycle
 * length had a manual-input question anywhere in onboarding, so a user who already knows their
 * period tends to run 7 days, say, had no way to tell Mira that; it would keep showing the 5-day
 * default until a full period had been logged with an explicit End day. Same Yes/"I don't know"
 * shape as CycleLengthQuestion, on purpose, so the two questions feel like one consistent pair.
 */
export function PeriodLengthQuestion({ answer, onAnswerChange, periodLength, onPeriodLengthChange }: Props) {
  const step = (delta: number) => {
    onPeriodLengthChange(Math.min(MAX_PERIOD_LENGTH, Math.max(MIN_PERIOD_LENGTH, periodLength + delta)));
  };

  return (
    <View>
      <AppText variant="bodyMedium" style={styles.label}>
        Do you know how many days you usually bleed for?
      </AppText>
      <AppText variant="small" color={Colors.textSecondary} style={styles.helper}>
        From your period&apos;s first day to its last — not the gap until your next one.
      </AppText>
      <View style={styles.chipRow}>
        <Chip label="Yes" selected={answer === 'yes'} onPress={() => onAnswerChange('yes')} />
        <Chip label="I don't know" selected={answer === 'no'} onPress={() => onAnswerChange('no')} />
      </View>

      {answer === 'yes' && (
        <View style={styles.stepperRow}>
          <Pressable style={styles.stepButton} onPress={() => step(-1)} hitSlop={8}>
            <Ionicons name="remove" size={18} color={Colors.primary} />
          </Pressable>
          <View style={styles.stepperValueBox}>
            <AppText variant="h3">{periodLength}</AppText>
            <AppText variant="small" color={Colors.textSecondary}>
              days
            </AppText>
          </View>
          <Pressable style={styles.stepButton} onPress={() => step(1)} hitSlop={8}>
            <Ionicons name="add" size={18} color={Colors.primary} />
          </Pressable>
        </View>
      )}

      {answer === 'no' && (
        <View style={styles.note}>
          <Ionicons name="information-circle" size={18} color={Colors.info} />
          <AppText variant="small" color={Colors.textSecondary} style={styles.noteBody}>
            No worries! We&apos;ll start with the average 5 days and update automatically once you log a full period.
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: Spacing.xs },
  helper: { marginBottom: Spacing.md, lineHeight: 17 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.lg },
  stepButton: {
    width: 40,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.tint50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueBox: {
    flex: 1,
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  note: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.infoTint,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  noteBody: { flex: 1, lineHeight: 18 },
});

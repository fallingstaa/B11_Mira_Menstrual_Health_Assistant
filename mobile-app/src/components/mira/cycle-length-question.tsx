import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Chip } from '@/components/mira/chip';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type CycleLengthAnswer = 'yes' | 'no' | null;

export const MIN_CYCLE_LENGTH = 21;
export const MAX_CYCLE_LENGTH = 45;
export const DEFAULT_CYCLE_LENGTH = 28;

type Props = {
  answer: CycleLengthAnswer;
  onAnswerChange: (answer: CycleLengthAnswer) => void;
  cycleLength: number;
  onCycleLengthChange: (days: number) => void;
};

/**
 * "Do you know your usual cycle length?" — Yes reveals a bounded day stepper, "I don't know"
 * shows a friendly note that Mira defaults to 28 and auto-learns from there. Shared by every
 * setup path that asks for `userCycleLength` (Path A in record-first-period.tsx, Path B in
 * last-period-one-date.tsx) so the question behaves identically wherever it's asked.
 */
export function CycleLengthQuestion({ answer, onAnswerChange, cycleLength, onCycleLengthChange }: Props) {
  const step = (delta: number) => {
    onCycleLengthChange(Math.min(MAX_CYCLE_LENGTH, Math.max(MIN_CYCLE_LENGTH, cycleLength + delta)));
  };

  return (
    <View>
      <AppText variant="bodyMedium" style={styles.label}>
        Do you know your usual cycle length?
      </AppText>
      <AppText variant="small" color={Colors.textSecondary} style={styles.helper}>
        The days from the start of one period to the start of the next — not how many days you bleed for.
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
            <AppText variant="h3">{cycleLength}</AppText>
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
            No worries! We&apos;ll start with the average 28 days and update automatically as you log future
            periods.
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

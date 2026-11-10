import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/yumi/app-text';
import { Chip } from '@/components/yumi/chip';
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
 * shows a friendly note that Yumi defaults to 28 and auto-learns from there. Shared by every
 * setup path that asks for `userCycleLength` (Path A in record-first-period.tsx, Path B in
 * last-period-one-date.tsx) so the question behaves identically wherever it's asked.
 */
export function CycleLengthQuestion({ answer, onAnswerChange, cycleLength, onCycleLengthChange }: Props) {
  const { t } = useTranslation();
  const step = (delta: number) => {
    onCycleLengthChange(Math.min(MAX_CYCLE_LENGTH, Math.max(MIN_CYCLE_LENGTH, cycleLength + delta)));
  };

  return (
    <View>
      <AppText variant="bodyMedium" style={styles.label}>
        {t('lengthQuestion.cycleQuestion')}
      </AppText>
      <AppText variant="small" color={Colors.textSecondary} style={styles.helper}>
        {t('lengthQuestion.cycleHelper')}
      </AppText>
      <View style={styles.chipRow}>
        <Chip label={t('lengthQuestion.yes')} selected={answer === 'yes'} onPress={() => onAnswerChange('yes')} />
        <Chip label={t('lengthQuestion.dontKnow')} selected={answer === 'no'} onPress={() => onAnswerChange('no')} />
      </View>

      {answer === 'yes' && (
        <View style={styles.stepperRow}>
          <Pressable style={styles.stepButton} onPress={() => step(-1)} hitSlop={8}>
            <Ionicons name="remove" size={18} color={Colors.primary} />
          </Pressable>
          <View style={styles.stepperValueBox}>
            <AppText variant="h3">{cycleLength}</AppText>
            <AppText variant="small" color={Colors.textSecondary}>
              {t('lengthQuestion.days')}
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
            {t('lengthQuestion.cycleUnknown')}
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

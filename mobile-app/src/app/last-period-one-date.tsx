import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/yumi/button';
import { Card } from '@/components/yumi/card';
import { CycleLengthAnswer, CycleLengthQuestion, DEFAULT_CYCLE_LENGTH } from '@/components/yumi/cycle-length-question';
import { DatePickerField } from '@/components/yumi/date-picker-field';
import { DEFAULT_PERIOD_LENGTH, PeriodLengthAnswer, PeriodLengthQuestion } from '@/components/yumi/period-length-question';
import { ScreenContainer } from '@/components/yumi/screen-container';
import { ScreenHeader } from '@/components/yumi/screen-header';
import { SuccessOverlay } from '@/components/yumi/success-overlay';
import { Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';

/**
 * Path B of the setup flow: "I remember my last period start date". Captures the Start Date
 * only — an End Date is never asked for here, because Cycle Length (start-to-start) doesn't
 * need one — then dynamic follow-ups about usual Cycle Length and Period Length so Yumi has
 * something real to predict from right away instead of defaulting to 28/5 until a full period's
 * been logged.
 */
export default function LastPeriodOneDateScreen() {
  const { markPeriodDay, setAverageCycleLength, setAveragePeriodDuration, commitDays } = useAppState();
  const { t } = useTranslation();
  const [date, setDate] = useState<Date | null>(null);
  const [knowsCycleLength, setKnowsCycleLength] = useState<CycleLengthAnswer>(null);
  const [cycleLength, setCycleLength] = useState(DEFAULT_CYCLE_LENGTH);
  const [knowsPeriodLength, setKnowsPeriodLength] = useState<PeriodLengthAnswer>(null);
  const [periodLength, setPeriodLength] = useState(DEFAULT_PERIOD_LENGTH);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => router.dismissTo('/(tabs)/home'), 1100);
    return () => clearTimeout(timer);
  }, [saved]);

  const canSave = !!date && knowsCycleLength !== null && knowsPeriodLength !== null;

  // Waits for the server to actually accept the save before showing "Saved!" or touching local
  // state — see record.tsx's comment on the same fix for why this used to be able to show a false
  // success ahead of a real, late-arriving rejection.
  const handleSave = async () => {
    if (!date || saving) return;

    setSaving(true);
    try {
      await commitDays([{ date, symptoms: [], mood: [] }], 'last_period_one_date');
    } catch (err) {
      Alert.alert(t('common.couldntSave'), err instanceof Error ? err.message : t('common.tryAgain'));
      return;
    } finally {
      setSaving(false);
    }

    // Only the Start Date is written — Cycle Length prediction never depends on an End Date.
    markPeriodDay(date);
    // A real second start date (logged later) will silently take over from this estimate —
    // see the Automatic Learning Logic on averageCycleLength in context/app-state.tsx. This also
    // instantly updates nextPeriodStartDate on Home and the on-device reminder schedule.
    setAverageCycleLength(knowsCycleLength === 'yes' ? cycleLength : DEFAULT_CYCLE_LENGTH);
    // Same idea for Period Length — a fully-logged period (Start Date through an explicit End
    // Date) will silently take over from this estimate once one exists.
    setAveragePeriodDuration(knowsPeriodLength === 'yes' ? periodLength : DEFAULT_PERIOD_LENGTH);
    setSaved(true);
  };

  return (
    <ScreenContainer
      edges={['top', 'left', 'right', 'bottom']}
      footer={<Button label={t('lastPeriod.saveContinue')} onPress={handleSave} disabled={!canSave} loading={saving} />}>
      <ScreenHeader title={t('lastPeriod.title')} subtitle={t('lastPeriod.subtitle')} />

      <Card style={styles.card}>
        <DatePickerField label={t('lastPeriod.startDate')} date={date} onChange={setDate} maximumDate={new Date()} />
      </Card>

      {date && (
        <>
          <Card style={styles.card}>
            <CycleLengthQuestion
              answer={knowsCycleLength}
              onAnswerChange={setKnowsCycleLength}
              cycleLength={cycleLength}
              onCycleLengthChange={setCycleLength}
            />
          </Card>

          <Card style={styles.card}>
            <PeriodLengthQuestion
              answer={knowsPeriodLength}
              onAnswerChange={setKnowsPeriodLength}
              periodLength={periodLength}
              onPeriodLengthChange={setPeriodLength}
            />
          </Card>
        </>
      )}

      {saved && <SuccessOverlay message={t('lastPeriod.saved')} />}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.lg },
});

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/mira/button';
import { Card } from '@/components/mira/card';
import { CycleLengthAnswer, CycleLengthQuestion, DEFAULT_CYCLE_LENGTH } from '@/components/mira/cycle-length-question';
import { DatePickerField } from '@/components/mira/date-picker-field';
import { ScreenContainer } from '@/components/mira/screen-container';
import { ScreenHeader } from '@/components/mira/screen-header';
import { SuccessOverlay } from '@/components/mira/success-overlay';
import { Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';

/**
 * Path B of the setup flow: "I remember my last period start date". Captures the Start Date
 * only — an End Date is never asked for here, because Cycle Length (start-to-start) doesn't
 * need one — then a dynamic follow-up about usual Cycle Length so Mira has something to predict
 * from right away instead of waiting for a second logged period.
 */
export default function LastPeriodOneDateScreen() {
  const { markPeriodDay, setAverageCycleLength } = useAppState();
  const [date, setDate] = useState<Date | null>(null);
  const [knowsCycleLength, setKnowsCycleLength] = useState<CycleLengthAnswer>(null);
  const [cycleLength, setCycleLength] = useState(DEFAULT_CYCLE_LENGTH);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => router.dismissTo('/(tabs)/home'), 1100);
    return () => clearTimeout(t);
  }, [saved]);

  const canSave = !!date && knowsCycleLength !== null;

  const handleSave = () => {
    if (!date) return;
    // Only the Start Date is written — Cycle Length prediction never depends on an End Date.
    markPeriodDay(date);
    // A real second start date (logged later) will silently take over from this estimate —
    // see the Automatic Learning Logic on averageCycleLength in context/app-state.tsx. This also
    // instantly updates nextPeriodStartDate on Home and the on-device reminder schedule.
    setAverageCycleLength(knowsCycleLength === 'yes' ? cycleLength : DEFAULT_CYCLE_LENGTH);
    setSaved(true);
  };

  return (
    <ScreenContainer
      edges={['top', 'left', 'right', 'bottom']}
      footer={<Button label="Save & Continue" onPress={handleSave} disabled={!canSave} />}>
      <ScreenHeader title="Your Last Period" subtitle="Just the start date — no end date needed" />

      <Card style={styles.card}>
        <DatePickerField label="Period Start Date" date={date} onChange={setDate} maximumDate={new Date()} />
      </Card>

      {date && (
        <Card style={styles.card}>
          <CycleLengthQuestion
            answer={knowsCycleLength}
            onAnswerChange={setKnowsCycleLength}
            cycleLength={cycleLength}
            onCycleLengthChange={setCycleLength}
          />
        </Card>
      )}

      {saved && <SuccessOverlay message="Saved!" />}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.lg },
});

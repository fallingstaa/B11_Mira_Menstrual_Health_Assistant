import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { Card } from '@/components/mira/card';
import { DatePickerField } from '@/components/mira/date-picker-field';
import { ScreenContainer } from '@/components/mira/screen-container';
import { ScreenHeader } from '@/components/mira/screen-header';
import { SuccessOverlay } from '@/components/mira/success-overlay';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { formatRange } from '@/utils/date';

/** "Yes — I remember both dates": two date fields, each opening the OS/browser's own date picker. */
export default function LastPeriodDatesScreen() {
  const { markPeriodDay, setPeriodEndDay } = useAppState();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => router.dismissTo('/(tabs)/home'), 1100);
    return () => clearTimeout(t);
  }, [saved]);

  // Tolerate the two dates being picked out of order — the earlier one is always the start.
  const rangeStart = startDate && endDate && endDate < startDate ? endDate : startDate;
  const rangeEnd = startDate && endDate && endDate < startDate ? startDate : endDate;
  const dayCount = rangeStart && rangeEnd ? Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86400000) + 1 : 0;

  const handleSave = () => {
    if (!rangeStart) return;
    const end = rangeEnd ?? rangeStart;
    for (let d = new Date(rangeStart); d <= end; d.setDate(d.getDate() + 1)) {
      markPeriodDay(new Date(d));
    }
    setPeriodEndDay(end);
    setSaved(true);
  };

  return (
    <ScreenContainer
      edges={['top', 'left', 'right', 'bottom']}
      footer={<Button label="Save & Continue" onPress={handleSave} disabled={!startDate} />}>
      <ScreenHeader title="Enter Last Period" subtitle="Saved as your previous cycle record" />

      <Card style={styles.card}>
        <DatePickerField label="Start Date" date={startDate} onChange={setStartDate} maximumDate={new Date()} />
        <DatePickerField label="End Date" date={endDate} onChange={setEndDate} maximumDate={new Date()} />

        {rangeStart && rangeEnd && (
          <View style={styles.preview}>
            <Ionicons name="water" size={14} color={Colors.primary} />
            <AppText variant="bodyMedium" color={Colors.primary}>
              {dayCount} day{dayCount === 1 ? '' : 's'}
            </AppText>
            <AppText variant="small" color={Colors.textSecondary}>
              {formatRange(rangeStart, rangeEnd)}
            </AppText>
          </View>
        )}
      </Card>

      {saved && <SuccessOverlay message="Saved!" />}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.lg },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.tint50,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    alignSelf: 'flex-start',
  },
});

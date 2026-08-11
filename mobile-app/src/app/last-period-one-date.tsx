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

/** "I only remember one date": saves that single day so it's not lost — the rest can be filled in later from the Calendar. */
export default function LastPeriodOneDateScreen() {
  const { markPeriodDay } = useAppState();
  const [date, setDate] = useState<Date | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => router.dismissTo('/(tabs)/home'), 1100);
    return () => clearTimeout(t);
  }, [saved]);

  const handleSave = () => {
    if (!date) return;
    markPeriodDay(date);
    setSaved(true);
  };

  return (
    <ScreenContainer
      edges={['top', 'left', 'right', 'bottom']}
      footer={<Button label="Save & Continue" onPress={handleSave} disabled={!date} />}>
      <ScreenHeader title="Enter What You Remember" subtitle="You can complete it later" />

      <Card style={styles.card}>
        <DatePickerField label="Date you remember" date={date} onChange={setDate} maximumDate={new Date()} />
      </Card>

      <View style={styles.warning}>
        <Ionicons name="information-circle" size={18} color={Colors.warning} />
        <View style={{ flex: 1 }}>
          <AppText variant="bodyMedium" color={Colors.warning}>
            Incomplete record
          </AppText>
          <AppText variant="small" color={Colors.textSecondary} style={styles.warningBody}>
            Mira needs both a start and end date to calculate your cycle length and make predictions. You can go
            back to the Calendar anytime to add the missing date.
          </AppText>
        </View>
      </View>

      {saved && <SuccessOverlay message="Saved!" />}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.lg },
  warning: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.warningTint,
    borderRadius: Radius.md,
    padding: Spacing.lg,
  },
  warningBody: { marginTop: 2, lineHeight: 18 },
});

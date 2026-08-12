import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { formatLong } from '@/utils/date';

type Props = {
  label: string;
  date: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  maximumDate?: Date;
};

/**
 * Tap to open the OS's own date picker — a native popover on iOS, the system dialog on Android.
 * No custom calendar UI to maintain, and it's what every user already knows how to use.
 */
export function DatePickerField({ label, date, onChange, placeholder = 'Select a date', maximumDate }: Props) {
  const [show, setShow] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'set' && selected) {
      onChange(selected);
      if (Platform.OS === 'ios') setShow(false);
    } else if (event.type === 'dismissed') {
      setShow(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <AppText variant="bodyMedium" style={styles.label}>
        {label}
      </AppText>
      <Pressable onPress={() => setShow(true)} style={styles.box}>
        <Ionicons name="calendar-outline" size={16} color={date ? Colors.textSecondary : Colors.textMuted} />
        <AppText variant="bodyMedium" color={date ? Colors.text : Colors.textMuted}>
          {date ? formatLong(date) : placeholder}
        </AppText>
      </Pressable>

      {show && (
        <DateTimePicker
          value={date ?? maximumDate ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.lg },
  label: { marginBottom: Spacing.sm },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.lg,
  },
});

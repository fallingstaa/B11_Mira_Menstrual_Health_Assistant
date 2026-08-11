import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

type Props = {
  label: string;
  date: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  maximumDate?: Date;
};

function toInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Web build of DatePickerField (Metro picks this over date-picker-field.tsx when bundling for
 * web). @react-native-community/datetimepicker has no web implementation, so this uses the
 * browser's own <input type="date"> — its calendar popover is native to the browser, needs no
 * custom UI or animation from us, and every user already knows how to use it.
 */
export function DatePickerField({ label, date, onChange, placeholder = 'Select a date', maximumDate }: Props) {
  return (
    <View style={styles.wrap}>
      <AppText variant="bodyMedium" style={styles.label}>
        {label}
      </AppText>
      <View style={styles.box}>
        <input
          type="date"
          value={date ? toInputValue(date) : ''}
          max={maximumDate ? toInputValue(maximumDate) : undefined}
          placeholder={placeholder}
          onChange={(e) => {
            if (!e.target.value) return;
            const [y, m, d] = e.target.value.split('-').map(Number);
            onChange(new Date(y, m - 1, d));
          }}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: Fonts.medium,
            fontSize: 14,
            color: date ? Colors.text : Colors.textMuted,
            width: '100%',
            height: '100%',
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.lg },
  label: { marginBottom: Spacing.sm },
  box: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
});

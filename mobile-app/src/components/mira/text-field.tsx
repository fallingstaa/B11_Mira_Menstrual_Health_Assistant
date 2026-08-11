import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

type Props = TextInputProps & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  error?: string;
};

/** Labeled rounded text input, with an optional show/hide toggle for passwords. */
export function TextField({ label, icon, isPassword, error, ...rest }: Props) {
  const [secure, setSecure] = useState(!!isPassword);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <AppText variant="bodyMedium" style={styles.label}>
        {label}
      </AppText>
      <View style={[styles.field, focused && styles.fieldFocused, error && styles.fieldError]}>
        {icon ? <Ionicons name={icon} size={18} color={Colors.textMuted} style={styles.icon} /> : null}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={secure}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {isPassword ? (
          <Pressable hitSlop={8} onPress={() => setSecure((s) => !s)}>
            <Ionicons name={secure ? 'eye-off-outline' : 'eye-outline'} size={19} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="small" color={Colors.primary} style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.lg },
  label: { marginBottom: Spacing.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  fieldFocused: { borderColor: Colors.primary, backgroundColor: Colors.surface },
  fieldError: { borderColor: Colors.primary },
  icon: { marginRight: 2 },
  input: { flex: 1, fontFamily: Fonts.regular, fontSize: 14.5, color: Colors.text, height: '100%' },
  error: { marginTop: Spacing.xs },
});

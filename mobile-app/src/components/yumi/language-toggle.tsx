import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/yumi/app-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { AppLanguage, setAppLanguage } from '@/i18n';

const OPTIONS: { value: AppLanguage; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'km', label: 'ខ្មែរ' },
];

/**
 * Compact EN | ខ្មែរ switch for the pre-login screens (onboarding, login, register), where
 * there's no Profile screen yet to change the language from. Only changes the device's
 * choice — auth-context.tsx copies it to the account once the user signs in.
 */
export function LanguageToggle() {
  const { i18n } = useTranslation();

  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      {OPTIONS.map((opt) => {
        const active = i18n.language === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => setAppLanguage(opt.value)}
            style={[styles.option, active && styles.optionActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            hitSlop={4}>
            <AppText variant="caption" color={active ? Colors.textOnPrimary : Colors.textSecondary}>
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.pill,
    padding: 3,
    gap: 2,
  },
  option: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.pill },
  optionActive: { backgroundColor: Colors.primary },
});

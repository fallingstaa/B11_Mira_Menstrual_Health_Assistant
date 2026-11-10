import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/yumi/app-text';
import { Mascot } from '@/components/yumi/mascot';
import { ScreenContainer } from '@/components/yumi/screen-container';
import { Colors, Radius, Spacing } from '@/constants/theme';

type PeriodSetupKey = `periodSetup.${'now' | 'remember' | 'unknown'}.${'title' | 'subtitle'}`;

const options: {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: PeriodSetupKey;
  subtitle: PeriodSetupKey;
  href: '/record-first-period' | '/last-period-one-date' | '/last-period-unknown';
  emphasized: boolean;
}[] = [
  {
    key: 'active',
    icon: 'water',
    title: 'periodSetup.now.title',
    subtitle: 'periodSetup.now.subtitle',
    href: '/record-first-period',
    emphasized: true,
  },
  {
    key: 'last-start',
    icon: 'calendar-outline',
    title: 'periodSetup.remember.title',
    subtitle: 'periodSetup.remember.subtitle',
    href: '/last-period-one-date',
    emphasized: false,
  },
  {
    key: 'unknown',
    icon: 'sparkles-outline',
    title: 'periodSetup.unknown.title',
    subtitle: 'periodSetup.unknown.subtitle',
    href: '/last-period-unknown',
    emphasized: false,
  },
];

/**
 * Shown the first time a user goes to record a period — a four-path question so every kind of
 * user (mid-period, knows their last start date, first-timer, or unsure) lands somewhere useful.
 * "Skip for now" leaves period data empty and just returns to Home.
 */
export default function PeriodSetupScreen() {
  const { t } = useTranslation();
  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.mascotWrap}>
        <Mascot size={120} />
      </View>

      <AppText variant="h1" center style={styles.title}>
        {t('periodSetup.title')}
      </AppText>
      <AppText variant="bodyLarge" center color={Colors.textSecondary} style={styles.subtitle}>
        {t('periodSetup.subtitle')}
      </AppText>

      <View style={styles.options}>
        {options.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => router.push(option.href)}
            style={[styles.option, option.emphasized && styles.optionEmphasized]}>
            <Ionicons
              name={option.icon}
              size={20}
              color={option.emphasized ? Colors.primary : Colors.textSecondary}
              style={styles.optionIcon}
            />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyMedium">{t(option.title)}</AppText>
              <AppText variant="small" style={styles.optionSubtitle}>
                {t(option.subtitle)}
              </AppText>
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => router.dismissTo('/(tabs)/home')} hitSlop={8} style={styles.skip}>
        <AppText variant="bodyMedium" color={Colors.textMuted}>
          {t('periodSetup.skip')}
        </AppText>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mascotWrap: { alignItems: 'center', marginTop: Spacing.md, marginBottom: Spacing.lg },
  title: { marginBottom: Spacing.sm },
  subtitle: { paddingHorizontal: Spacing.md, marginBottom: Spacing.xxl },
  options: { gap: Spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
  },
  optionEmphasized: { backgroundColor: Colors.tint50, borderColor: Colors.primary },
  optionIcon: { marginTop: 2 },
  optionSubtitle: { marginTop: 2 },
  skip: { marginTop: Spacing.xxl, alignSelf: 'center', padding: Spacing.sm },
});

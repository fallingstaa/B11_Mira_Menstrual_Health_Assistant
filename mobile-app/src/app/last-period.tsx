import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { IconCircle } from '@/components/mira/icon-circle';
import { ScreenContainer } from '@/components/mira/screen-container';
import { ScreenHeader } from '@/components/mira/screen-header';
import { Colors, Radius, Spacing } from '@/constants/theme';

const options: {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  href: '/last-period-dates' | '/last-period-one-date' | '/last-period-unknown';
  emphasized: boolean;
}[] = [
  {
    key: 'both',
    icon: 'checkmark-circle',
    title: 'Yes — I remember both dates',
    subtitle: 'Enter start and end for best accuracy',
    href: '/last-period-dates',
    emphasized: true,
  },
  {
    key: 'one',
    icon: 'calendar-outline',
    title: 'I only remember one date',
    subtitle: 'Enter what you remember, complete it later',
    href: '/last-period-one-date',
    emphasized: false,
  },
  {
    key: 'none',
    icon: 'sparkles-outline',
    title: "I don't remember",
    subtitle: "That's okay — start fresh from your next period",
    href: '/last-period-unknown',
    emphasized: false,
  },
];

/** "Not yet this month" leads here — Mira asks about the user's last period instead, so it still has something to estimate from. */
export default function LastPeriodScreen() {
  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title="Your Last Period" />

      <View style={styles.intro}>
        <IconCircle color={Colors.tint50} size={56}>
          <Ionicons name="calendar-outline" size={24} color={Colors.primary} />
        </IconCircle>
        <AppText variant="h3" center style={styles.title}>
          Do you remember your last period?
        </AppText>
        <AppText variant="small" center color={Colors.textSecondary} style={styles.subtitle}>
          This helps Mira estimate your next cycle. Completely optional.
        </AppText>
      </View>

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
              <AppText variant="bodyMedium">{option.title}</AppText>
              <AppText variant="small" style={styles.optionSubtitle}>
                {option.subtitle}
              </AppText>
            </View>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: { alignItems: 'center', paddingHorizontal: Spacing.md, marginBottom: Spacing.xxl },
  title: { marginTop: Spacing.md, marginBottom: Spacing.sm },
  subtitle: { lineHeight: 18 },
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
});

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Mascot } from '@/components/mira/mascot';
import { ScreenContainer } from '@/components/mira/screen-container';
import { Colors, Radius, Spacing } from '@/constants/theme';

const options: {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  href: '/record-first-period' | '/last-period-one-date' | '/last-period-unknown';
  emphasized: boolean;
}[] = [
  {
    key: 'active',
    icon: 'water',
    title: "I'm on my period right now",
    subtitle: 'Tap the days on a guided calendar as they happen',
    href: '/record-first-period',
    emphasized: true,
  },
  {
    key: 'last-start',
    icon: 'calendar-outline',
    title: 'I remember my last period start date',
    subtitle: 'Just the start date — plus your cycle length, if you know it',
    href: '/last-period-one-date',
    emphasized: false,
  },
  {
    key: 'unknown',
    icon: 'sparkles-outline',
    title: " I don't remember any dates",
    subtitle: "That's okay — Mira will start you off with sensible defaults",
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
  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.mascotWrap}>
        <Mascot size={120} />
      </View>

      <AppText variant="h1" center style={styles.title}>
        Tell us about your cycle
      </AppText>
      <AppText variant="bodyLarge" center color={Colors.textSecondary} style={styles.subtitle}>
        A couple of quick questions so Mira can personalise your experience.
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
              <AppText variant="bodyMedium">{option.title}</AppText>
              <AppText variant="small" style={styles.optionSubtitle}>
                {option.subtitle}
              </AppText>
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => router.dismissTo('/(tabs)/home')} hitSlop={8} style={styles.skip}>
        <AppText variant="bodyMedium" color={Colors.textMuted}>
          Skip for now
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

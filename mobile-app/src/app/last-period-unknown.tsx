import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/yumi/app-text';
import { Button } from '@/components/yumi/button';
import { Mascot } from '@/components/yumi/mascot';
import { ScreenContainer } from '@/components/yumi/screen-container';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';

// Same icons as Home's Quick Actions, for consistency.
const links: { key: string; icon: keyof typeof Ionicons.glyphMap; label: 'lastPeriodUnknown.browse' | 'lastPeriodUnknown.ask' | 'lastPeriodUnknown.reminders'; href: '/(tabs)/education' | '/(tabs)/assistant' | '/notifications' }[] = [
  { key: 'education', icon: 'book', label: 'lastPeriodUnknown.browse', href: '/(tabs)/education' },
  { key: 'assistant', icon: 'chatbubble-ellipses', label: 'lastPeriodUnknown.ask', href: '/(tabs)/assistant' },
  { key: 'reminders', icon: 'alarm', label: 'lastPeriodUnknown.reminders', href: '/notifications' },
];

/**
 * Path C of the setup flow: "first period ever" / "I don't know any dates". No dates to save,
 * so instead this flags the user as a beginner and locks in the 28-day default cycle length —
 * enough for prediction logic to run on later — then reassures them and points somewhere useful
 * while they wait, without ever treating the missing dates as an error.
 */
export default function LastPeriodUnknownScreen() {
  const { setIsBeginner, setAverageCycleLength } = useAppState();
  const { t } = useTranslation();

  useEffect(() => {
    setIsBeginner(true);
    setAverageCycleLength(28);
    // Run once on mount — this screen only ever means one thing: no known dates yet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']} contentStyle={styles.content}>
      <View style={styles.mascotWrap}>
        <Mascot size={130} />
      </View>

      <AppText variant="h1" center style={styles.title}>
        {t('lastPeriodUnknown.title')}
      </AppText>
      <AppText variant="bodyLarge" center style={styles.headline}>
        {t('lastPeriodUnknown.headline')}
      </AppText>
      <AppText variant="small" center color={Colors.textSecondary} style={styles.body}>
        {t('lastPeriodUnknown.body')}
      </AppText>

      <View style={styles.links}>
        {links.map((link) => (
          <Pressable key={link.key} onPress={() => router.push(link.href)} style={styles.linkRow}>
            <Ionicons name={link.icon} size={18} color={Colors.primary} />
            <AppText variant="bodyMedium" color={Colors.primary}>
              {t(link.label)}
            </AppText>
          </Pressable>
        ))}
      </View>

      <Button label={t('lastPeriodUnknown.goHome')} onPress={() => router.dismissTo('/(tabs)/home')} style={styles.homeButton} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center' },
  mascotWrap: { alignItems: 'center', marginBottom: Spacing.lg },
  title: { marginBottom: Spacing.sm },
  headline: { marginBottom: Spacing.sm },
  body: { paddingHorizontal: Spacing.md, marginBottom: Spacing.xxl, lineHeight: 18 },
  links: { gap: Spacing.md, marginBottom: Spacing.xxl },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.tint50,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  homeButton: {},
});

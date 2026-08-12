import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { Mascot } from '@/components/mira/mascot';
import { ScreenContainer } from '@/components/mira/screen-container';
import { Colors, Radius, Spacing } from '@/constants/theme';

// Same icons as Home's Quick Actions, for consistency.
const links: { key: string; icon: keyof typeof Ionicons.glyphMap; label: string; href: '/(tabs)/education' | '/(tabs)/assistant' | '/notifications' }[] = [
  { key: 'education', icon: 'book', label: 'Browse Education', href: '/(tabs)/education' },
  { key: 'assistant', icon: 'chatbubble-ellipses', label: 'Ask Mira AI', href: '/(tabs)/assistant' },
  { key: 'reminders', icon: 'alarm', label: 'Set Up Reminders', href: '/notifications' },
];

/** "I don't remember": no data to save — just reassure the user and point them somewhere useful while they wait. */
export default function LastPeriodUnknownScreen() {
  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']} contentStyle={styles.content}>
      <View style={styles.mascotWrap}>
        <Mascot size={130} />
      </View>

      <AppText variant="h1" center style={styles.title}>
        That&apos;s okay!
      </AppText>
      <AppText variant="bodyLarge" center style={styles.headline}>
        Start tracking from your next period.
      </AppText>
      <AppText variant="small" center color={Colors.textSecondary} style={styles.body}>
        While you wait, you can browse Education, ask Mira anything, set up reminders, or just explore the app.
      </AppText>

      <View style={styles.links}>
        {links.map((link) => (
          <Pressable key={link.key} onPress={() => router.push(link.href)} style={styles.linkRow}>
            <Ionicons name={link.icon} size={18} color={Colors.primary} />
            <AppText variant="bodyMedium" color={Colors.primary}>
              {link.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      <Button label="Go to Home" onPress={() => router.dismissTo('/(tabs)/home')} style={styles.homeButton} />
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

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { Card } from '@/components/mira/card';
import { Mascot } from '@/components/mira/mascot';
import { ScreenContainer } from '@/components/mira/screen-container';
import { Colors, Spacing } from '@/constants/theme';

/**
 * Shown the first time a user goes to record a period — a couple of quick questions before
 * handing off to the guided calendar flow. "Not yet this month" leads into a short "tell us
 * about your last period" flow instead; "Skip for now" just returns to Home.
 */
export default function PeriodSetupScreen() {
  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']} contentStyle={styles.content}>
      <View style={styles.mascotWrap}>
        <Mascot size={140} />
      </View>

      <AppText variant="h1" center style={styles.title}>
        Let&apos;s get you set up
      </AppText>
      <AppText variant="bodyLarge" center color={Colors.textSecondary} style={styles.subtitle}>
        A couple of quick questions so Mira can personalise your experience.
      </AppText>

      <Card style={styles.card} delay={100}>
        <AppText variant="h3" center style={styles.question}>
          Have you had your period this month?
        </AppText>
        <Button
          label="Yes, I have"
          icon={<Ionicons name="water" size={16} color={Colors.textOnPrimary} />}
          onPress={() => router.push('/record-first-period')}
          style={styles.optionButton}
        />
        <Button
          label="Not yet this month"
          variant="secondary"
          onPress={() => router.push('/last-period')}
          style={styles.notYetButton}
        />
      </Card>

      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.skip}>
        <AppText variant="bodyMedium" color={Colors.textMuted}>
          Skip for now
        </AppText>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  mascotWrap: { marginBottom: Spacing.lg },
  title: { marginBottom: Spacing.sm },
  subtitle: { paddingHorizontal: Spacing.md, marginBottom: Spacing.xxl },
  card: { width: '100%' },
  question: { marginBottom: Spacing.lg },
  optionButton: { marginTop: Spacing.md },
  notYetButton: { marginTop: Spacing.md, borderWidth: 1.5, borderColor: Colors.tint200 },
  skip: { marginTop: Spacing.xxl, padding: Spacing.sm },
});

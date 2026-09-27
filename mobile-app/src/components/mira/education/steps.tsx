import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Radius, Spacing } from '@/constants/theme';

type Props = { intro: string; steps: string[]; color: string; tint: string };

/** Intro sentence, then each step as its own numbered card that pops in one after another. */
export function EducationSteps({ intro, steps, color, tint }: Props) {
  return (
    <View style={styles.wrap}>
      <AppText variant="body" style={styles.text}>
        {intro}
      </AppText>
      {steps.map((step, i) => (
        <View key={i} style={[styles.step, { backgroundColor: tint }]}>
          <View style={[styles.badge, { backgroundColor: color }]}>
            <AppText variant="bodyMedium" color="#FFFFFF">
              {i + 1}
            </AppText>
          </View>
          <AppText variant="body" style={[styles.text, styles.stepText]}>
            {step}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  text: { lineHeight: 23 },
  step: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'flex-start' },
  badge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepText: { flex: 1 },
});

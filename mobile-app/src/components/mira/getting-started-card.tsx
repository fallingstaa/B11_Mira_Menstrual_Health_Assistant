import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Card } from '@/components/mira/card';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type GettingStartedStep = {
  key: string;
  label: string;
  sublabel: string;
  done: boolean;
  onPress?: () => void;
};

type Props = {
  steps: GettingStartedStep[];
  delay?: number;
};

/** "Getting Started" checklist card on the first-time Home screen — progress bar + steps. */
export function GettingStartedCard({ steps, delay = 0 }: Props) {
  const doneCount = steps.filter((s) => s.done).length;
  const progress = steps.length ? doneCount / steps.length : 0;

  return (
    <Card delay={delay} style={styles.card}>
      <View style={styles.header}>
        <AppText variant="h3">Getting Started</AppText>
        <View style={styles.badge}>
          <AppText variant="caption" color={Colors.primary}>
            {doneCount} of {steps.length}
          </AppText>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>

      <View>
        {steps.map((step, i) => (
          <Pressable
            key={step.key}
            disabled={step.done || !step.onPress}
            onPress={step.onPress}
            style={[styles.row, i !== 0 && styles.rowBorder]}>
            {step.done ? (
              <View style={styles.doneCircle}>
                <Ionicons name="checkmark" size={14} color={Colors.textOnPrimary} />
              </View>
            ) : (
              <View style={styles.numberCircle}>
                <AppText variant="caption" color={Colors.primary}>
                  {i + 1}
                </AppText>
              </View>
            )}
            <View style={styles.textWrap}>
              <AppText
                variant="bodyMedium"
                color={step.done ? Colors.textMuted : Colors.text}
                style={step.done && styles.doneLabel}>
                {step.label}
              </AppText>
              <AppText variant="small" style={styles.sublabel}>
                {step.sublabel}
              </AppText>
            </View>
            {!step.done && step.onPress && <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  badge: { backgroundColor: Colors.tint50, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.pill },
  track: { height: 6, borderRadius: 3, backgroundColor: Colors.tint50, overflow: 'hidden', marginBottom: Spacing.sm },
  fill: { height: '100%', borderRadius: 3, backgroundColor: Colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  doneCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.tint50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  sublabel: { marginTop: 1 },
  doneLabel: { textDecorationLine: 'line-through' },
});

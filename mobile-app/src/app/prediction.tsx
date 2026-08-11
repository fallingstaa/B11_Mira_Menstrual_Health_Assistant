import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Card } from '@/components/mira/card';
import { IconCircle } from '@/components/mira/icon-circle';
import { ScreenContainer } from '@/components/mira/screen-container';
import { ScreenHeader } from '@/components/mira/screen-header';
import { cycleStats, pastPeriods, today } from '@/constants/mock-data';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { daysBetween, formatRange } from '@/utils/date';

export default function PredictionScreen() {
  const daysUntilNext = daysBetween(today, cycleStats.nextPeriodStart);

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScreenHeader title="Prediction" subtitle="Your personalized cycle forecast" />

      <Card style={styles.heroCard}>
        <AppText variant="small" color={Colors.textSecondary}>
          Next period estimated to start in
        </AppText>
        <AppText variant="display" color={Colors.primary} style={styles.bigNumber}>
          {daysUntilNext} days
        </AppText>
        <AppText variant="bodyMedium">{formatRange(cycleStats.nextPeriodStart, cycleStats.nextPeriodEnd)}</AppText>
      </Card>

      <View style={styles.statsRow}>
        <StatCard icon="repeat" color={Colors.lavender} tint={Colors.lavenderTint} label="Cycle length" value={`${cycleStats.averageCycleLength} days`} />
        <StatCard icon="water" color={Colors.primary} tint={Colors.tint50} label="Period length" value={`${cycleStats.averagePeriodLength} days`} />
      </View>

      <Card style={styles.card} delay={80}>
        <View style={styles.rowBetween}>
          <AppText variant="h3">Last period</AppText>
          <IconCircle color={Colors.tint50} size={36}>
            <Ionicons name="water" size={16} color={Colors.primary} />
          </IconCircle>
        </View>
        <AppText variant="bodyLarge" style={{ marginTop: Spacing.sm }}>
          {formatRange(cycleStats.lastPeriodStart, cycleStats.lastPeriodEnd)}
        </AppText>
        <AppText variant="small" style={{ marginTop: 2 }}>
          {daysBetween(cycleStats.lastPeriodStart, cycleStats.lastPeriodEnd) + 1} days long
        </AppText>
      </Card>

      <Card style={styles.card} delay={120}>
        <AppText variant="h3" style={{ marginBottom: Spacing.md }}>
          Recent cycle history
        </AppText>
        {pastPeriods
          .slice()
          .reverse()
          .map((p, i) => (
            <View key={i} style={[styles.historyRow, i !== 0 && styles.historyRowBorder]}>
              <IconCircle color={Colors.tint50} size={32}>
                <Ionicons name="water-outline" size={14} color={Colors.primary} />
              </IconCircle>
              <AppText variant="bodyMedium" style={{ flex: 1, marginLeft: Spacing.md }}>
                {formatRange(p.start, p.end)}
              </AppText>
              <AppText variant="small">{daysBetween(p.start, p.end) + 1} days</AppText>
            </View>
          ))}
      </Card>

      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
        <AppText variant="small" style={styles.disclaimerText}>
          Estimated based on your previous records. Actual dates may vary — this is not medical advice.
        </AppText>
      </View>
    </ScreenContainer>
  );
}

function StatCard({
  icon,
  color,
  tint,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  tint: string;
  label: string;
  value: string;
}) {
  return (
    <Card style={styles.statCard} delay={40}>
      <IconCircle color={tint} size={40}>
        <Ionicons name={icon} size={18} color={color} />
      </IconCircle>
      <AppText variant="small" style={{ marginTop: Spacing.sm }}>
        {label}
      </AppText>
      <AppText variant="h3" style={{ marginTop: 2 }}>
        {value}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  heroCard: { alignItems: 'center', marginBottom: Spacing.lg, backgroundColor: Colors.tint50 },
  bigNumber: { marginVertical: Spacing.xs },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  statCard: { flex: 1 },
  card: { marginBottom: Spacing.lg },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  historyRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  disclaimer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.xxxl,
  },
  disclaimerText: { flex: 1, lineHeight: 17 },
});

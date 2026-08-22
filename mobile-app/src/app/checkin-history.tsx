import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { IconCircle } from '@/components/mira/icon-circle';
import { ScreenContainer } from '@/components/mira/screen-container';
import { ScreenHeader } from '@/components/mira/screen-header';
import { moodOptions, symptomOptions } from '@/constants/mock-data';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { apiRequest } from '@/utils/api';
import { formatLong, parseIsoDate } from '@/utils/date';

const moodLabel = (key: string) => moodOptions.find((m) => m.key === key)?.label ?? key;
const symptomLabel = (key: string) => symptomOptions.find((s) => s.key === key)?.label ?? key;

/** The subset of a MenstrualRecord this screen needs — same shape `GET /menstrual/records` returns. */
type CheckinRecord = { date: string; isPeriodDay: boolean; symptoms: string[]; mood: string[]; notes: string };

/**
 * Full recap of every daily Check-in ever logged — reached from Home's "Check-ins" quick action,
 * not shown inline on Home itself (that read as a second, competing "period" card sitting right
 * under the actual period-recording flow). Deliberately every wellness-only entry, not just a
 * recent handful: `isPeriodDay: false` records only (see checkin.tsx) — a day that's *also* a
 * period day shows its symptoms/mood in Calendar's day editor and Cycle History instead, exactly
 * once, not duplicated here.
 */
export default function CheckinHistoryScreen() {
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      apiRequest<CheckinRecord[]>('/menstrual/records')
        .then((records) => {
          if (cancelled) return;
          const wellnessOnly = records
            .filter((r) => !r.isPeriodDay && (r.symptoms.length > 0 || r.mood.length > 0 || r.notes))
            .sort((a, b) => b.date.localeCompare(a.date));
          setCheckins(wellnessOnly);
        })
        .catch((err) => {
          console.error('[checkin-history] failed to load /menstrual/records:', err);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScreenHeader title="Check-in History" subtitle="Everything you've logged, day by day" />

      {!loading && checkins.length === 0 && (
        <View style={styles.emptyWrap}>
          <IconCircle color={Colors.peachTint} size={56}>
            <Ionicons name="heart-outline" size={24} color={Colors.peach} />
          </IconCircle>
          <AppText variant="bodyMedium" color={Colors.textSecondary} style={{ marginTop: Spacing.md }}>
            No check-ins yet
          </AppText>
          <AppText variant="small" color={Colors.textMuted} center style={{ marginTop: 4 }}>
            Tap &quot;Check in now&quot; on Home any day to log how you&apos;re feeling — it&apos;ll show up here.
          </AppText>
        </View>
      )}

      <View style={styles.list}>
        {checkins.map((entry, i) => (
          <Animated.View key={entry.date} entering={FadeInUp.duration(320).delay(i * 40)}>
            <View style={[styles.row, i !== 0 && styles.rowBorder]}>
              <IconCircle color={Colors.peachTint} size={40}>
                <Ionicons name="heart" size={17} color={Colors.peach} />
              </IconCircle>
              <View style={styles.rowText}>
                <AppText variant="bodyMedium" numberOfLines={1}>
                  {formatLong(parseIsoDate(entry.date))}
                </AppText>
                {entry.symptoms.length > 0 && (
                  <AppText variant="small" color={Colors.textMuted} numberOfLines={2} style={styles.rowDetail}>
                    Symptoms: {entry.symptoms.map(symptomLabel).join(', ')}
                  </AppText>
                )}
                {entry.mood.length > 0 && (
                  <AppText variant="small" color={Colors.textMuted} numberOfLines={2} style={styles.rowDetail}>
                    Mood: {entry.mood.map(moodLabel).join(', ')}
                  </AppText>
                )}
                {entry.notes ? (
                  <AppText variant="small" color={Colors.textMuted} numberOfLines={2} style={styles.rowDetail}>
                    {entry.notes}
                  </AppText>
                ) : null}
              </View>
            </View>
          </Animated.View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  emptyWrap: { alignItems: 'center', paddingTop: Spacing.xxxl, paddingHorizontal: Spacing.xl },
  list: { gap: Spacing.sm, paddingBottom: Spacing.xxxl },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
  },
  rowBorder: { marginTop: Spacing.sm },
  rowText: { flex: 1, gap: 2 },
  rowDetail: { marginTop: 2 },
});

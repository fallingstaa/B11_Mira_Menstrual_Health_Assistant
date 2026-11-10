import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/yumi/button';
import { Card } from '@/components/yumi/card';
import { CollapsibleChipField } from '@/components/yumi/collapsible-chip-field';
import { ModalHeader } from '@/components/yumi/modal-header';
import { ScreenContainer } from '@/components/yumi/screen-container';
import { SuccessOverlay } from '@/components/yumi/success-overlay';
import { moodOptions, symptomOptions } from '@/constants/mock-data';
import { Colors, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { dateKey, formatShort } from '@/utils/date';

/**
 * Home's "Check in now" — a quick, always-available "how are you feeling today?" log.
 * Deliberately symptoms/mood only: it used to also offer the same Period day/Spotting/End day
 * choice as Calendar's day editor, which meant two different screens could both claim to be
 * "where you record your period," and it was easy to end up here meaning to log a headache and
 * accidentally mark (or un-mark) today as a period day instead. Calendar is the only place that
 * changes period-day/end-day/flow status now — this never touches any of that, whichever way
 * today's already set.
 *
 * If today's already a period day (marked via Calendar), saving here updates that same day's
 * symptoms/mood — it shows up in Calendar's day editor immediately, no separate copy. If today
 * isn't a period day, this still saves a real record for today (so symptoms/mood between periods
 * aren't lost), just with isPeriodDay left false — Calendar remains the only way that ever becomes true.
 */
export default function CheckinScreen() {
  const { periodEntries, updatePeriodDayEntry, commitDays } = useAppState();
  const { t } = useTranslation();
  const [today] = useState(() => new Date());
  const existingEntry = periodEntries[dateKey(today)];

  const [symptoms, setSymptoms] = useState<string[]>(existingEntry?.symptoms ?? []);
  const [mood, setMood] = useState<string[]>(existingEntry?.mood ?? []);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleSymptom = (key: string) => {
    setSymptoms((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  };

  const toggleMood = (key: string) => {
    setMood((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));
  };

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => router.back(), 1100);
    return () => clearTimeout(timer);
  }, [saved]);

  // Waits for the server to actually accept the save before showing "Check-in saved!" — see
  // record.tsx's comment on the same fix for why this used to be able to show a false success
  // ahead of a real, late-arriving rejection.
  const handleSave = async () => {
    if (saving) return;

    setSaving(true);
    try {
      await commitDays(
        [{ date: today, isPeriodDay: !!existingEntry, isEnd: existingEntry?.isEnd, flow: existingEntry?.flow, symptoms, mood }],
        'checkin',
      );
    } catch (err) {
      Alert.alert(t('common.couldntSave'), err instanceof Error ? err.message : t('common.tryAgain'));
      return;
    } finally {
      setSaving(false);
    }

    // Only touches symptoms/mood on the existing entry (if today's already a period day) —
    // never its isEnd/flow status, and never creates a new period-day entry if today wasn't one.
    if (existingEntry) {
      updatePeriodDayEntry(today, { symptoms, mood });
    }
    setSaved(true);
  };

  return (
    <ScreenContainer
      edges={['top', 'left', 'right', 'bottom']}
      footer={
        <Button
          label={t('checkin.save')}
          icon={<Ionicons name="checkmark-circle-outline" size={16} color={Colors.textOnPrimary} />}
          onPress={handleSave}
          loading={saving}
        />
      }>
      <ModalHeader title={t('checkin.title')} subtitle={t('checkin.subtitle', { date: formatShort(today) })} />

      <Card style={styles.card}>
        <CollapsibleChipField label={t('record.symptoms')} options={symptomOptions} selectedKeys={symptoms} onToggle={toggleSymptom} />
      </Card>

      <Card style={styles.card}>
        <CollapsibleChipField label={t('record.mood')} options={moodOptions} selectedKeys={mood} onToggle={toggleMood} />
      </Card>

      {saved && <SuccessOverlay message={t('checkin.saved')} />}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.lg },
});

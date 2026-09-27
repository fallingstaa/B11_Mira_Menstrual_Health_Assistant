import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { CollapsibleChipField } from '@/components/mira/collapsible-chip-field';
import { FlowLevelPicker } from '@/components/mira/flow-level-picker';
import { moodOptions, symptomOptions } from '@/constants/mock-data';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { formatShort } from '@/utils/date';

type Props = {
  visible: boolean;
  /** The selected days, already sorted ascending — none of them have an existing entry yet. */
  dates: Date[];
  onCancel: () => void;
  /** Returns a promise so this modal can wait for the real save result before closing itself —
   *  the caller should reject (and show its own error) on failure. */
  onConfirm: (details: { flow?: string; symptoms: string[]; mood: string[] }) => Promise<void> | void;
};

/**
 * Bulk "log several past days at once" popup — opened from Calendar's multi-select mode, which
 * only turns on while browsing a month before the current one. One shared Flow/Symptoms/Mood
 * applies to every selected day; there's no per-day detail here, this is a fast way to backfill
 * a period you're only entering well after the fact, not a replacement for the day-by-day editor
 * the current month still uses.
 *
 * Same one-way door as a single previous-month day: every date recorded through here locks for
 * editing the instant it saves (see PeriodEntriesSummary's month locking), so Record asks for one
 * extra confirmation first instead of saving silently.
 */
export function BatchRecordModal({ visible, dates, onCancel, onConfirm }: Props) {
  const [flow, setFlow] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Fresh fields every time this opens on a new selection — otherwise leftover choices from a
  // previous batch would silently carry over into the next one. Deferred to a microtask (not
  // called synchronously in the effect body) so this can't trigger a cascading render.
  useEffect(() => {
    if (visible) {
      Promise.resolve().then(() => {
        setFlow('');
        setSymptoms([]);
        setMood([]);
      });
    }
  }, [visible]);

  const toggleSymptom = (key: string) => {
    setSymptoms((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  };
  const toggleMood = (key: string) => {
    setMood((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));
  };

  const handleRecord = () => {
    Alert.alert(
      `Lock ${dates.length} day${dates.length === 1 ? '' : 's'}?`,
      "These are from a previous month, so they lock for editing the moment you save — they feed your future predictions, so accuracy matters. Double-check everything above before confirming.",
      [
        { text: 'Go back', style: 'cancel' },
        {
          text: 'Confirm & Save',
          // Waits for the real save result before this modal closes — it used to close (via the
          // caller clearing its own visible state) the instant this was tapped, regardless of
          // whether the server actually accepted it, so a rejection (e.g. these days conflicting
          // with an already-logged period) still showed nothing wrong here and only surfaced as a
          // late, separate Alert after the sheet had already slid away. The caller shows that
          // Alert; this just keeps the sheet open (with a spinner) until it knows which one to do.
          onPress: async () => {
            setSaving(true);
            try {
              await onConfirm({ flow: flow || undefined, symptoms, mood });
            } catch {
              // The caller already alerted with the real error — just stop spinning and let the
              // user try again or cancel.
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  const dateSummary =
    dates.length === 0
      ? ''
      : dates.length <= 4
        ? dates.map((d) => formatShort(d)).join(', ')
        : `${formatShort(dates[0])} – ${formatShort(dates[dates.length - 1])} · ${dates.length} days`;

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, Shadow.raised]}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <AppText variant="h2">
                Record {dates.length} Day{dates.length === 1 ? '' : 's'}
              </AppText>
              <AppText variant="small" numberOfLines={2} color={Colors.textMuted} style={styles.dateSummary}>
                {dateSummary}
              </AppText>
            </View>
            <Pressable onPress={onCancel} hitSlop={8}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.lockWarning}>
              <Ionicons name="lock-closed" size={13} color={Colors.primaryDark} />
              <AppText variant="small" numberOfLines={2} color={Colors.primaryDark} style={styles.lockWarningText}>
                From a previous month — locks for good once you tap Record below.
              </AppText>
            </View>

            <AppText variant="bodyMedium" style={styles.label}>
              Flow · optional
            </AppText>
            <FlowLevelPicker value={flow} onChange={setFlow} />

            <CollapsibleChipField label="Symptoms" options={symptomOptions} selectedKeys={symptoms} onToggle={toggleSymptom} style={styles.field} />
            <CollapsibleChipField label="Mood" options={moodOptions} selectedKeys={mood} onToggle={toggleMood} style={styles.field} />

            <Button
              label={`Record ${dates.length} Day${dates.length === 1 ? '' : 's'}`}
              icon={<Ionicons name="save-outline" size={16} color={Colors.textOnPrimary} />}
              onPress={handleRecord}
              loading={saving}
              style={styles.recordButton}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  sheet: {
    maxHeight: '85%',
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.lg },
  headerText: { flex: 1 },
  dateSummary: { marginTop: 2 },
  scroll: { paddingBottom: Spacing.xxxl },
  lockWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: Colors.tint50,
  },
  lockWarningText: { flex: 1 },
  label: { marginBottom: Spacing.md },
  field: { marginTop: Spacing.lg, marginBottom: Spacing.lg },
  recordButton: { marginTop: Spacing.xl },
});

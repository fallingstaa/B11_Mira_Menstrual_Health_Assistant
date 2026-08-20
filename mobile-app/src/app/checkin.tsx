import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { Card } from '@/components/mira/card';
import { Chip } from '@/components/mira/chip';
import { CollapsibleChipField } from '@/components/mira/collapsible-chip-field';
import { ConfirmChipGroup } from '@/components/mira/confirm-chip-group';
import { FlowLevelPicker } from '@/components/mira/flow-level-picker';
import { ModalHeader } from '@/components/mira/modal-header';
import { ScreenContainer } from '@/components/mira/screen-container';
import { SuccessOverlay } from '@/components/mira/success-overlay';
import { moodOptions, symptomOptions } from '@/constants/mock-data';
import { Colors, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { dateKey, formatShort } from '@/utils/date';

/**
 * Home's "Check in now" — logs today straight into the same shared state Calendar reads from
 * (`useAppState`), pre-filled if today was already touched elsewhere. Saving here always calls
 * the same `markPeriodDay`/`updatePeriodDayEntry`/`setPeriodEndDay` Calendar's own day editor
 * uses, so today shows up in Calendar's "Recorded Days" immediately — there's no separate,
 * Home-only copy of this data to fall out of sync.
 *
 * "Period status" is now the exact same 3-way choice as PeriodDayEditor's "Day type" (Period
 * day / Spotting / End day) instead of its own separate on/spotting/off wording — same
 * derive-from-Flow trick too: picking "Spotting" here sets Flow to Spotting, and picking
 * Spotting down in Flow reflects back up here, so they can't disagree with each other.
 */
export default function CheckinScreen() {
  const { periodEntries, markPeriodDay, setPeriodEndDay, updatePeriodDayEntry } = useAppState();
  const [today] = useState(() => new Date());
  const existingEntry = periodEntries[dateKey(today)];

  // Nothing pre-selects an answer for the user — same principle as PeriodDayEditor's "Day
  // type": nothing should read as already-chosen before it's actually tapped. Already-expanded
  // ("confirmed") if today already has a real entry, since reopening existing data isn't a
  // fresh, unmade choice.
  const [dayTypeTouched, setDayTypeTouched] = useState(!!existingEntry);
  const [isEnd, setIsEnd] = useState(existingEntry?.isEnd ?? false);
  const [flow, setFlow] = useState(existingEntry?.flow ?? '');
  const [symptoms, setSymptoms] = useState<string[]>(existingEntry?.symptoms ?? []);
  const [mood, setMood] = useState<string[]>(existingEntry?.mood ?? []);
  const [saved, setSaved] = useState(false);

  const dayType: 'period' | 'spotting' | 'end' = isEnd ? 'end' : flow === 'spotting' ? 'spotting' : 'period';

  const selectPeriodDay = () => {
    setIsEnd(false);
    if (flow === 'spotting') setFlow('');
    setDayTypeTouched(true);
  };
  const selectSpotting = () => {
    setIsEnd(false);
    setFlow('spotting');
    setDayTypeTouched(true);
  };
  const selectEndDay = () => {
    setIsEnd(true);
    setDayTypeTouched(true);
  };

  const toggleSymptom = (key: string) => {
    setSymptoms((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  };

  const toggleMood = (key: string) => {
    setMood((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));
  };

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => router.back(), 1100);
    return () => clearTimeout(t);
  }, [saved]);

  const handleSave = () => {
    markPeriodDay(today);
    updatePeriodDayEntry(today, {
      flow: flow || undefined,
      symptoms,
      mood,
    });
    if (isEnd) {
      // Enforces "at most one end day" across every recorded day, same as everywhere else this
      // is set — a plain patch here wouldn't un-flag whichever day was previously the end.
      setPeriodEndDay(today);
    } else if (existingEntry?.isEnd) {
      // Was previously today's flagged end day, user moved off it this session — clear it.
      updatePeriodDayEntry(today, { isEnd: false });
    }
    setSaved(true);
  };

  return (
    <ScreenContainer
      edges={['top', 'left', 'right', 'bottom']}
      footer={
        <Button
          label="Save Check-in"
          icon={<Ionicons name="checkmark-circle-outline" size={16} color={Colors.textOnPrimary} />}
          onPress={handleSave}
        />
      }>
      <ModalHeader title="Daily Check-in" subtitle={`Today, ${formatShort(today)} · takes a few seconds`} />

      <Card style={styles.card}>
        <ConfirmChipGroup label="PERIOD STATUS" confirmed={dayTypeTouched}>
          {/* Fixed 3-way row — each chip is flex: 1, so they always divide one line evenly
              instead of wrapping or needing a scroll. Same 3 options, same wording, as
              PeriodDayEditor's "Day type" in Calendar. */}
          <View style={styles.fitRow}>
            <Chip label="Period day" style={styles.fitChip} selected={dayTypeTouched && dayType === 'period'} onPress={selectPeriodDay} />
            <Chip label="Spotting" style={styles.fitChip} selected={dayTypeTouched && dayType === 'spotting'} onPress={selectSpotting} />
            <Chip label="End day" style={styles.fitChip} color={Colors.primaryDark} selected={dayTypeTouched && dayType === 'end'} onPress={selectEndDay} />
          </View>
        </ConfirmChipGroup>
      </Card>

      <Card style={styles.card}>
        <AppText variant="bodyMedium" style={styles.label}>
          Flow · optional
        </AppText>
        <FlowLevelPicker value={flow} onChange={setFlow} />
      </Card>

      <Card style={styles.card}>
        <CollapsibleChipField label="Symptoms" options={symptomOptions} selectedKeys={symptoms} onToggle={toggleSymptom} />
      </Card>

      <Card style={styles.card}>
        <CollapsibleChipField label="Mood" options={moodOptions} selectedKeys={mood} onToggle={toggleMood} />
      </Card>

      {saved && <SuccessOverlay message="Check-in saved!" />}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.lg },
  label: { marginBottom: Spacing.md },
  // Period status's fixed 3-option row — see Chip's `style` prop note.
  fitRow: { flexDirection: 'row', gap: Spacing.xs },
  fitChip: { flex: 1, paddingHorizontal: Spacing.sm },
});

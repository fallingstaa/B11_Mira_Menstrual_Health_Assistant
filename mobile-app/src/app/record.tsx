import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { Card } from '@/components/mira/card';
import { CollapsibleChipField } from '@/components/mira/collapsible-chip-field';
import { DateStepper } from '@/components/mira/date-stepper';
import { FlowLevelPicker } from '@/components/mira/flow-level-picker';
import { ModalHeader } from '@/components/mira/modal-header';
import { ScreenContainer } from '@/components/mira/screen-container';
import { SuccessOverlay } from '@/components/mira/success-overlay';
import { moodOptions, symptomOptions } from '@/constants/mock-data';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { daysBetween, eachDayInRange, isSameDay } from '@/utils/date';

/**
 * Home's "Record Period" quick action (once a first period already exists) — logs a new
 * cycle straight into shared state.
 *
 * One button, not two: earlier this had a separate "Mark as Period Days" step before the
 * final "Record" — that read as two overlapping actions for what's really one decision.
 * Now picking the dates + optionally filling in flow/symptoms/mood/notes (all clearly
 * "optional", never required) all lead to a single "Record" tap, which marks the days AND
 * saves whatever details were given, together. It's never disabled — there's nothing else
 * it's waiting on.
 */
export default function RecordScreen() {
  const { markPeriodDay, setPeriodEndDay, updatePeriodDayEntry, commitDays } = useAppState();
  const [today] = useState(() => new Date());
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [flow, setFlow] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

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

  const [saving, setSaving] = useState(false);

  // PERIOD-004: an end date before the start date is invalid input, not something to silently
  // reinterpret — reject it outright and save nothing, rather than quietly swapping the two
  // dates into whatever range happens to be chronological (that used to be the behavior here,
  // and it meant "05 Sep → 01 Sep" was silently saved as "01 Sep → 05 Sep" instead of failing).
  //
  // Waits for the server to actually accept the save before showing "Record saved!" or touching
  // local state at all — this used to mark the days, show the success overlay, and schedule the
  // screen to close *before* commitDays had even resolved, so a backend rejection (e.g. this same
  // PERIOD-004 rule, or the "day right after an already-closed end" one) still showed a false
  // "saved" success first, with the real error arriving late, after the screen had already started
  // closing. The user had to reopen the day to discover it silently hadn't actually saved.
  const handleRecord = async () => {
    if (daysBetween(startDate, endDate) < 0) {
      Alert.alert('End date is before start date', "The end date can't be earlier than the start date.");
      return;
    }
    if (saving) return;

    const days = eachDayInRange(startDate, endDate);
    const entries = days.map((day) => ({
      date: day,
      isEnd: isSameDay(day, endDate),
      flow: flow || undefined,
      symptoms,
      mood,
      notes: notes.trim() || undefined,
    }));

    setSaving(true);
    try {
      await commitDays(entries, 'record');
    } catch (err) {
      Alert.alert("Couldn't save", err instanceof Error ? err.message : 'Please try again.');
      return;
    } finally {
      setSaving(false);
    }

    days.forEach((day) => {
      markPeriodDay(day);
      updatePeriodDayEntry(day, {
        flow: flow || undefined,
        symptoms,
        mood,
        notes: notes.trim() || undefined,
      });
    });
    setPeriodEndDay(endDate);
    setSaved(true);
  };

  return (
    <ScreenContainer
      edges={['top', 'left', 'right', 'bottom']}
      footer={
        <Button
          label="Record"
          icon={<Ionicons name="save-outline" size={16} color={Colors.textOnPrimary} />}
          onPress={handleRecord}
          loading={saving}
        />
      }>
      <ModalHeader title="Record Period" subtitle="Pick the dates, add details if you'd like, then Record." />

      <Card style={styles.card}>
        <DateStepper label="Start date" date={startDate} onChange={setStartDate} />
        <DateStepper label="End date" date={endDate} onChange={setEndDate} />
      </Card>

      <Card style={styles.card}>
        <AppText variant="bodyMedium" style={styles.label}>
          Flow level · optional
        </AppText>
        <FlowLevelPicker value={flow} onChange={setFlow} />
      </Card>

      <Card style={styles.card}>
        <CollapsibleChipField label="Symptoms" options={symptomOptions} selectedKeys={symptoms} onToggle={toggleSymptom} />
      </Card>

      <Card style={styles.card}>
        <CollapsibleChipField label="Mood" options={moodOptions} selectedKeys={mood} onToggle={toggleMood} />
      </Card>

      <Card style={[styles.card, styles.notesCard]}>
        <AppText variant="bodyMedium" style={styles.label}>
          Notes · optional
        </AppText>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything else you'd like to remember about this cycle?"
          placeholderTextColor={Colors.textMuted}
          multiline
          style={styles.notesInput}
        />
      </Card>

      {saved && <SuccessOverlay message="Record saved!" />}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.lg },
  label: { marginBottom: Spacing.md },
  notesCard: { paddingBottom: Spacing.lg },
  notesInput: {
    minHeight: 90,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.text,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing.lg,
    textAlignVertical: 'top',
  },
});

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { Card } from '@/components/mira/card';
import { Chip } from '@/components/mira/chip';
import { ModalHeader } from '@/components/mira/modal-header';
import { ScreenContainer } from '@/components/mira/screen-container';
import { SuccessOverlay } from '@/components/mira/success-overlay';
import { flowLevels, moodOptions, symptomOptions } from '@/constants/mock-data';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { dateKey, formatShort } from '@/utils/date';

const statuses = [
  { key: 'on', label: 'On my period' },
  { key: 'spotting', label: 'Spotting' },
  { key: 'off', label: 'Not on my period' },
];

/** Home's "Check in now" — logs today straight into shared state, pre-filled if today was already touched elsewhere. */
export default function CheckinScreen() {
  const { periodEntries, markPeriodDay, togglePeriodDay, updatePeriodDayEntry } = useAppState();
  const [today] = useState(() => new Date());
  const existingEntry = periodEntries[dateKey(today)];

  const [status, setStatus] = useState('on');
  const [flow, setFlow] = useState(existingEntry?.flow ?? 'medium');
  const [symptoms, setSymptoms] = useState<string[]>(existingEntry?.symptoms ?? []);
  const [mood, setMood] = useState(existingEntry?.mood ?? '');
  const [notes, setNotes] = useState(existingEntry?.notes ?? '');
  const [saved, setSaved] = useState(false);

  const toggleSymptom = (key: string) => {
    setSymptoms((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  };

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => router.back(), 1100);
    return () => clearTimeout(t);
  }, [saved]);

  const handleSave = () => {
    if (status === 'off') {
      // Not on a period today — clear today's entry if one existed, but don't invent one.
      if (existingEntry) togglePeriodDay(today);
    } else {
      markPeriodDay(today);
      updatePeriodDayEntry(today, {
        flow,
        symptoms,
        mood: mood || undefined,
        notes: notes.trim() || undefined,
      });
    }
    setSaved(true);
  };

  return (
    <ScreenContainer
      edges={['top', 'left', 'right', 'bottom']}
      footer={<Button label="Save Check-in" onPress={handleSave} />}>
      <ModalHeader title="Daily Check-in" subtitle={`Today, ${formatShort(today)} · takes a few seconds`} />

      <Card style={styles.card}>
        <AppText variant="bodyMedium" style={styles.label}>
          Period status
        </AppText>
        <View style={styles.chipRow}>
          {statuses.map((s) => (
            <Chip key={s.key} label={s.label} selected={status === s.key} onPress={() => setStatus(s.key)} />
          ))}
        </View>
      </Card>

      {status !== 'off' && (
        <Card style={styles.card}>
          <AppText variant="bodyMedium" style={styles.label}>
            Flow
          </AppText>
          <View style={styles.chipRow}>
            {flowLevels.map((f) => (
              <Chip key={f.key} label={f.label} selected={flow === f.key} color={f.color} onPress={() => setFlow(f.key)} />
            ))}
          </View>
        </Card>
      )}

      <Card style={styles.card}>
        <AppText variant="bodyMedium" style={styles.label}>
          Any symptoms today?
        </AppText>
        <View style={styles.chipRow}>
          {symptomOptions.map((s) => (
            <Chip
              key={s.key}
              label={s.label}
              icon={s.icon}
              selected={symptoms.includes(s.key)}
              onPress={() => toggleSymptom(s.key)}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <AppText variant="bodyMedium" style={styles.label}>
          Mood today?
        </AppText>
        <View style={styles.chipRow}>
          {moodOptions.map((m) => (
            <Chip key={m.key} label={m.label} icon={m.icon} selected={mood === m.key} onPress={() => setMood(m.key)} />
          ))}
        </View>
      </Card>

      <Card style={[styles.card, styles.notesCard]}>
        <AppText variant="bodyMedium" style={styles.label}>
          Notes
        </AppText>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="How are you feeling overall today?"
          placeholderTextColor={Colors.textMuted}
          multiline
          style={styles.notesInput}
        />
      </Card>

      {saved && <SuccessOverlay message="Check-in saved!" />}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.lg },
  label: { marginBottom: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
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

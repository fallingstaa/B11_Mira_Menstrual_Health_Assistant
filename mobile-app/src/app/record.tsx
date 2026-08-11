import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { Card } from '@/components/mira/card';
import { Chip } from '@/components/mira/chip';
import { DateStepper } from '@/components/mira/date-stepper';
import { ModalHeader } from '@/components/mira/modal-header';
import { ScreenContainer } from '@/components/mira/screen-container';
import { SuccessOverlay } from '@/components/mira/success-overlay';
import { cycleStats, flowLevels, moodOptions, symptomOptions } from '@/constants/mock-data';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

export default function RecordScreen() {
  const [startDate, setStartDate] = useState(cycleStats.lastPeriodStart);
  const [endDate, setEndDate] = useState(cycleStats.lastPeriodEnd);
  const [flow, setFlow] = useState<string>('medium');
  const [symptoms, setSymptoms] = useState<string[]>(['cramps']);
  const [mood, setMood] = useState<string>('calm');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const toggleSymptom = (key: string) => {
    setSymptoms((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  };

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => router.back(), 1100);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <ScreenContainer
      edges={['top', 'left', 'right', 'bottom']}
      footer={<Button label="Save Record" onPress={() => setSaved(true)} />}>
      <ModalHeader title="Record Period" subtitle="Log the details for this cycle." />

      <Card style={styles.card}>
        <DateStepper label="Start date" date={startDate} onChange={setStartDate} />
        <DateStepper label="End date" date={endDate} onChange={setEndDate} />
      </Card>

      <Card style={styles.card}>
        <AppText variant="bodyMedium" style={styles.label}>
          Flow level
        </AppText>
        <View style={styles.chipRow}>
          {flowLevels.map((f) => (
            <Chip key={f.key} label={f.label} selected={flow === f.key} color={f.color} onPress={() => setFlow(f.key)} />
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <AppText variant="bodyMedium" style={styles.label}>
          Symptoms
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
          Mood
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

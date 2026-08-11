import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { Card } from '@/components/mira/card';
import { Chip } from '@/components/mira/chip';
import { flowLevels, moodOptions, symptomOptions } from '@/constants/mock-data';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { PeriodDayEntry } from '@/context/app-state';
import { dateKey, formatLong } from '@/utils/date';

type Props = {
  date: Date;
  entry?: PeriodDayEntry;
  onToggleMark: () => void;
  onSetEndDay: () => void;
  onClearEndDay: () => void;
  onSetFlow: (flow: string) => void;
  onToggleSymptom: (key: string) => void;
  onSetMood: (mood: string) => void;
  /** Called when "Record" is pressed — everything is already saved live, this is just the user's confirm step. */
  onRecord?: () => void;
  delay?: number;
};

/**
 * "Edit this day" card — mark/unmark, pick Period day vs End day, optional flow/symptoms/mood.
 * Shared by the guided first-time flow and the Calendar tab so marking a day (or moving the end
 * date) behaves identically and stays in sync wherever it's edited.
 */
export function PeriodDayEditor({
  date,
  entry,
  onToggleMark,
  onSetEndDay,
  onClearEndDay,
  onSetFlow,
  onToggleSymptom,
  onSetMood,
  onRecord,
  delay = 0,
}: Props) {
  const isMarked = !!entry;
  const symptoms = entry?.symptoms ?? [];
  const key = dateKey(date);
  const [justRecorded, setJustRecorded] = useState(false);
  // Which marked days have already been "Recorded" and collapsed back down, keyed by day — so
  // confirming one day doesn't affect another, and re-marking a day always re-opens it fresh.
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});
  const isExpanded = isMarked && !collapsedDays[key];

  useEffect(() => {
    if (!justRecorded) return;
    const t = setTimeout(() => setJustRecorded(false), 1400);
    return () => clearTimeout(t);
  }, [justRecorded]);

  const handleToggleMark = () => {
    onToggleMark();
    setCollapsedDays((prev) => (prev[key] ? { ...prev, [key]: false } : prev));
  };

  const handleRecord = () => {
    onRecord?.();
    setJustRecorded(true);
    // Collapse back to the plain calendar-style view — the details stay saved, just tucked away.
    setCollapsedDays((prev) => ({ ...prev, [key]: true }));
  };

  const toggleExpanded = () => setCollapsedDays((prev) => ({ ...prev, [key]: !prev[key] }));

  const summaryParts: string[] = [];
  if (entry?.flow) summaryParts.push(flowLevels.find((f) => f.key === entry.flow)?.label ?? '');
  if (entry?.symptoms.length) summaryParts.push(`${entry.symptoms.length} symptom${entry.symptoms.length === 1 ? '' : 's'}`);
  if (entry?.mood) summaryParts.push(moodOptions.find((m) => m.key === entry.mood)?.icon ?? '');

  return (
    <Card style={styles.card} delay={delay}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <AppText variant="h3">{formatLong(date)}</AppText>
          <View style={styles.statusRow}>
            {isMarked && (
              <Ionicons name={entry?.isEnd ? 'flag' : 'checkmark-circle'} size={14} color={Colors.primary} />
            )}
            <AppText variant="small" color={isMarked ? Colors.primary : Colors.textMuted}>
              {entry?.isEnd ? 'End day' : isMarked ? 'Period day' : 'Not marked yet'}
            </AppText>
          </View>
          {!isExpanded && summaryParts.length > 0 && (
            <AppText variant="small" color={Colors.textMuted} style={styles.summaryLine}>
              {summaryParts.join(' · ')}
            </AppText>
          )}
        </View>
        <Pressable
          onPress={handleToggleMark}
          style={[styles.toggleButton, isMarked ? styles.toggleButtonOutline : styles.toggleButtonFilled]}>
          <AppText variant="bodyMedium" color={isMarked ? Colors.primary : Colors.textOnPrimary}>
            {isMarked ? 'Unmark' : 'Mark as Period Day'}
          </AppText>
        </Pressable>
        {isMarked && (
          <Pressable onPress={toggleExpanded} hitSlop={8} style={styles.chevronButton}>
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {isExpanded && (
        <>
          <View style={styles.divider} />

          <FieldGroup label="Day type">
            <View style={styles.chipRow}>
              <Chip label="Period day" selected={!entry?.isEnd} onPress={onClearEndDay} />
              <Chip label="End day" selected={!!entry?.isEnd} color={Colors.primaryDark} onPress={onSetEndDay} />
            </View>
          </FieldGroup>

          <FieldGroup label="Flow · optional">
            <View style={styles.chipRow}>
              {flowLevels.map((f) => (
                <Chip
                  key={f.key}
                  label={f.label}
                  selected={entry?.flow === f.key}
                  color={f.color}
                  onPress={() => onSetFlow(f.key)}
                />
              ))}
            </View>
          </FieldGroup>

          <FieldGroup label="Symptoms · optional">
            <View style={styles.chipRow}>
              {symptomOptions.map((s) => (
                <Chip
                  key={s.key}
                  label={s.label}
                  icon={s.icon}
                  selected={symptoms.includes(s.key)}
                  onPress={() => onToggleSymptom(s.key)}
                />
              ))}
            </View>
          </FieldGroup>

          <FieldGroup label="Mood · optional">
            <View style={styles.moodRow}>
              {moodOptions.map((m) => (
                <Pressable
                  key={m.key}
                  onPress={() => onSetMood(m.key)}
                  style={[styles.moodButton, entry?.mood === m.key && styles.moodButtonSelected]}>
                  <AppText style={styles.moodEmoji}>{m.icon}</AppText>
                </Pressable>
              ))}
            </View>
          </FieldGroup>

          <Button
            label={justRecorded ? 'Recorded!' : 'Record'}
            icon={<Ionicons name={justRecorded ? 'checkmark-circle' : 'save-outline'} size={16} color={Colors.textOnPrimary} />}
            onPress={handleRecord}
            style={justRecorded ? styles.recordButtonSuccess : styles.recordButton}
          />
        </>
      )}
    </Card>
  );
}

function FieldGroup({ label, last, children }: { label: string; last?: boolean; children: ReactNode }) {
  return (
    <View style={!last && styles.fieldGroup}>
      <AppText variant="caption" style={styles.fieldLabel}>
        {label.toUpperCase()}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  summaryLine: { marginTop: 2 },
  toggleButton: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, borderRadius: Radius.pill },
  toggleButtonFilled: { backgroundColor: Colors.primary },
  toggleButtonOutline: { backgroundColor: Colors.tint50, borderWidth: 1.5, borderColor: Colors.primary },
  chevronButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Colors.tint50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: Colors.border, marginTop: Spacing.lg },
  fieldGroup: { marginBottom: Spacing.lg },
  fieldLabel: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  moodButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.tint50,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodButtonSelected: { backgroundColor: Colors.tint100, borderColor: Colors.primary },
  moodEmoji: { fontSize: 20 },
  recordButton: { marginTop: Spacing.xl },
  recordButtonSuccess: { marginTop: Spacing.xl, backgroundColor: Colors.success },
});

import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { Card } from '@/components/mira/card';
import { Chip } from '@/components/mira/chip';
import { CollapsibleChipField } from '@/components/mira/collapsible-chip-field';
import { ConfirmChipGroup } from '@/components/mira/confirm-chip-group';
import { FlowLevelPicker } from '@/components/mira/flow-level-picker';
import { flowLevels, moodOptions, symptomOptions } from '@/constants/mock-data';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { PeriodDayEntry } from '@/context/app-state';
import { dateKey, formatLong } from '@/utils/date';

type Props = {
  date: Date;
  entry?: PeriodDayEntry;
  /**
   * Marks/unmarks this day as a period day. No longer exposed as its own button — see the
   * component doc comment below — but still called internally, both automatically (the moment
   * any field is edited on an unmarked day) and as a fallback inside "Record" if a day somehow
   * reaches Record still unmarked.
   */
  onToggleMark: () => void;
  onSetEndDay: () => void;
  onClearEndDay: () => void;
  onSetFlow: (flow: string) => void;
  onToggleSymptom: (key: string) => void;
  /** Multi-select, same shape as onToggleSymptom — a day can have more than one mood at once. */
  onToggleMood: (key: string) => void;
  /**
   * Called when "Record" is pressed, to actually sync this day to the backend. Returns a promise
   * so this component can wait for the real result before showing "Recorded!" — the caller should
   * reject (and show its own error) on failure; this component never assumes success on its own.
   */
  onRecord?: () => Promise<void> | void;
  delay?: number;
};

/**
 * "Edit this day" card — Period day vs End day, optional flow/symptoms/mood, one "Record" button
 * to confirm. Shared by the guided first-time flow and the Calendar tab so editing a day behaves
 * identically and stays in sync wherever it's edited.
 *
 * ONE button, not two: this used to have a separate "Mark as Period Day" toggle above the optional
 * fields, plus "Record" below — two actions that looked like they both finalized something, which
 * read as confusing. Now there's just "Record". Marking still happens the moment it's needed — the
 * instant any field below is touched on a day that isn't marked yet (see `ensureMarked`), or as a
 * fallback inside `handleRecord` if Record is pressed with nothing else touched first — so a day
 * always ends up marked without a dedicated button for it. Un-marking a day still goes through the
 * ✕ in the "Recorded Days" list (PeriodEntriesSummary) on both screens that use this component,
 * unchanged.
 *
 * On the Calendar tab this only ever opens for the *current* month — a past month's days go
 * through Calendar's own multi-select + BatchRecordModal instead, since those lock for editing
 * the instant they're saved. See Calendar's `openDayEditor`/`selectDay`.
 */
export function PeriodDayEditor({
  date,
  entry,
  onToggleMark,
  onSetEndDay,
  onClearEndDay,
  onSetFlow,
  onToggleSymptom,
  onToggleMood,
  onRecord,
  delay = 0,
}: Props) {
  const isMarked = !!entry;
  const symptoms = entry?.symptoms ?? [];
  const moods = entry?.mood ?? [];
  const key = dateKey(date);
  const [justRecorded, setJustRecorded] = useState(false);
  // Which days have already been "Recorded" and collapsed back down, keyed by day — so
  // confirming one day doesn't affect another, and a freshly-selected day always opens expanded.
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});
  const isExpanded = !collapsedDays[key];

  // Whether "Day type" has actually been tapped for this day, keyed by day. `entry.isEnd` alone
  // can't answer this — it's only ever `true` once explicitly set, but `false`/absent is
  // genuinely ambiguous between "confirmed as a regular period day" and "never touched". Without
  // this, "Period day" used to show pre-selected by default the moment a day was marked, before
  // the user had ever actually chosen anything — this makes that an explicit action instead.
  const [dayTypeTouched, setDayTypeTouched] = useState<Record<string, boolean>>({});
  const isDayTypeConfirmed = !!dayTypeTouched[key] || entry?.isEnd === true;
  // Three-way, matching checkin.tsx's "Period status" (on my period / spotting / not on my
  // period) — "Spotting" here is derived from Flow rather than stored separately, so picking it
  // in either place (this chip, or the Spotting option down in Flow · optional) stays in sync
  // both ways instead of tracking the same idea twice.
  const dayType: 'period' | 'spotting' | 'end' = entry?.isEnd ? 'end' : entry?.flow === 'spotting' ? 'spotting' : 'period';

  // Whether Record has ever actually gone through for this day — deliberately NOT the same as
  // "isMarked": touching any field marks the day immediately (see ensureMarked below), which
  // would otherwise make the button claim "Update Record" before the very first Record press
  // ever happened. Seeded true on the first render for a day that already had real saved data
  // (reopening something that already exists is always an update, even before this particular
  // visit touches anything), then set on every actual Record press from then on.
  const [recordedKeys, setRecordedKeys] = useState<Record<string, boolean>>({});
  // Deferred to a microtask (not called synchronously in the effect body) so this can't trigger a
  // cascading render.
  useEffect(() => {
    Promise.resolve().then(() => {
      if (entry) setRecordedKeys((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const hasBeenRecorded = !!recordedKeys[key];

  useEffect(() => {
    if (!justRecorded) return;
    const t = setTimeout(() => setJustRecorded(false), 1400);
    return () => clearTimeout(t);
  }, [justRecorded]);

  /** Marks this day if it isn't already — safe to call unconditionally before any field edit. */
  const ensureMarked = () => {
    if (!isMarked) onToggleMark();
  };

  const handleSetEndDay = () => {
    ensureMarked();
    onSetEndDay();
    setDayTypeTouched((prev) => ({ ...prev, [key]: true }));
  };
  const handleSetPeriodDay = () => {
    ensureMarked();
    onClearEndDay();
    // Moving off "Spotting" back to a plain period day should actually change something visible
    // — otherwise tapping this while Flow is still "Spotting" would look like it did nothing.
    if (entry?.flow === 'spotting') onSetFlow('');
    setDayTypeTouched((prev) => ({ ...prev, [key]: true }));
  };
  const handleSetSpotting = () => {
    ensureMarked();
    onClearEndDay();
    onSetFlow('spotting');
    setDayTypeTouched((prev) => ({ ...prev, [key]: true }));
  };
  const handleSetFlow = (flow: string) => {
    ensureMarked();
    onSetFlow(flow);
  };
  const handleToggleSymptom = (symptomKey: string) => {
    ensureMarked();
    onToggleSymptom(symptomKey);
  };
  const handleToggleMood = (moodKey: string) => {
    ensureMarked();
    onToggleMood(moodKey);
  };

  const [saving, setSaving] = useState(false);

  // Waits for onRecord's actual server result before claiming "Recorded!" — this used to set
  // justRecorded/recordedKeys immediately, regardless of whether the sync onRecord kicks off
  // actually succeeded, so a backend rejection (e.g. an invalid end-day range) still showed a
  // false success here, with the caller's error Alert arriving late and separately. The user had
  // to reopen the day to discover it silently hadn't actually saved.
  const handleRecord = async () => {
    ensureMarked(); // covers Record being pressed with no fields touched at all
    setSaving(true);
    try {
      await onRecord?.();
    } catch {
      // The caller already shows its own Alert with the real error message — nothing more to do
      // here except not claim success.
      return;
    } finally {
      setSaving(false);
    }
    setJustRecorded(true);
    setRecordedKeys((prev) => ({ ...prev, [key]: true }));
    // Collapse back to the plain calendar-style view — the details stay saved, just tucked away.
    setCollapsedDays((prev) => ({ ...prev, [key]: true }));
  };

  const toggleExpanded = () => setCollapsedDays((prev) => ({ ...prev, [key]: !prev[key] }));

  const summaryParts: string[] = [];
  if (entry?.flow) summaryParts.push(flowLevels.find((f) => f.key === entry.flow)?.label ?? '');
  if (entry?.symptoms.length) summaryParts.push(`${entry.symptoms.length} symptom${entry.symptoms.length === 1 ? '' : 's'}`);
  if (entry?.mood.length) summaryParts.push(`${entry.mood.length} mood${entry.mood.length === 1 ? '' : 's'}`);

  return (
    <Card style={styles.card} delay={delay}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <AppText variant="h3">{formatLong(date)}</AppText>
          <View style={styles.statusRow}>
            {isMarked && (
              <Ionicons name={entry?.isEnd ? 'flag' : 'checkmark-circle'} size={14} color={Colors.primary} />
            )}
            <AppText
              variant="small"
              numberOfLines={1}
              style={styles.statusText}
              color={isMarked ? Colors.primary : Colors.textMuted}>
              {!isMarked
                ? 'Not marked yet'
                : // Kept short on purpose — the DAY TYPE box right below already spells out "Confirm
                  // below" on its own badge, so this just needs to say *that* it's unconfirmed, not
                  // repeat the instruction in full (that full sentence is what was wrapping/clipping).
                  !isDayTypeConfirmed
                  ? 'Marked — not confirmed'
                  : dayType === 'end'
                    ? 'End day'
                    : dayType === 'spotting'
                      ? 'Spotting'
                      : 'Period day'}
            </AppText>
          </View>
          {!isExpanded && summaryParts.length > 0 && (
            <AppText variant="small" numberOfLines={1} color={Colors.textMuted} style={styles.summaryLine}>
              {summaryParts.join(' · ')}
            </AppText>
          )}
        </View>
        <Pressable onPress={toggleExpanded} hitSlop={8} style={styles.chevronButton}>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
        </Pressable>
      </View>

      {isExpanded && (
        <>
          <View style={styles.divider} />

          <ConfirmChipGroup label="DAY TYPE" confirmed={isDayTypeConfirmed} style={styles.dayTypeBox}>
            {/* Fixed 3-way row, not wrap or scroll — each chip is flex: 1, so the three always
                divide one line evenly no matter the device width, shrinking together instead of
                wrapping or needing a swipe. */}
            <View style={styles.fitRow}>
              <Chip label="Period day" style={styles.fitChip} selected={isDayTypeConfirmed && dayType === 'period'} onPress={handleSetPeriodDay} />
              <Chip label="Spotting" style={styles.fitChip} selected={isDayTypeConfirmed && dayType === 'spotting'} onPress={handleSetSpotting} />
              <Chip label="End day" style={styles.fitChip} selected={isDayTypeConfirmed && dayType === 'end'} color={Colors.primaryDark} onPress={handleSetEndDay} />
            </View>
          </ConfirmChipGroup>

          <FieldGroup label="Flow · optional">
            <FlowLevelPicker value={entry?.flow ?? ''} onChange={handleSetFlow} />
          </FieldGroup>

          {/* key={key} forces a fresh instance per day — otherwise browsing from a day where this
              was expanded to a different, untouched day would carry that expanded state along
              with it, instead of each day starting collapsed (or open, if it already has data)
              on its own. */}
          <CollapsibleChipField
            key={key + '-symptoms'}
            label="Symptoms"
            options={symptomOptions}
            selectedKeys={symptoms}
            onToggle={handleToggleSymptom}
            style={styles.collapsibleField}
          />
          <CollapsibleChipField
            key={key + '-mood'}
            label="Mood"
            options={moodOptions}
            selectedKeys={moods}
            onToggle={handleToggleMood}
            style={styles.collapsibleField}
          />

          <Button
            label={justRecorded ? 'Recorded!' : hasBeenRecorded ? 'Update Record' : 'Record'}
            icon={<Ionicons name={justRecorded ? 'checkmark-circle' : 'save-outline'} size={16} color={Colors.textOnPrimary} />}
            onPress={handleRecord}
            loading={saving}
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
      <AppText variant="caption" numberOfLines={1} style={styles.fieldLabel}>
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
  // flexShrink lets the Text actually respect the row's available width instead of overflowing
  // past it — without it, numberOfLines={1} has nothing to truncate against inside a flex row.
  statusText: { flexShrink: 1 },
  summaryLine: { marginTop: 2 },
  chevronButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Colors.tint50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: Colors.border, marginTop: Spacing.lg },
  // Just the outer spacing — the box's own look now lives in ConfirmChipGroup, shared with
  // checkin.tsx's "Period status".
  dayTypeBox: { marginTop: Spacing.lg, marginBottom: Spacing.lg },
  fieldGroup: { marginBottom: Spacing.lg },
  // Unlike FieldGroup (which bakes its top spacing into the label itself), CollapsibleChipField
  // has no built-in margin — needs both top and bottom set explicitly when stacked like this.
  collapsibleField: { marginTop: Spacing.lg, marginBottom: Spacing.lg },
  fieldLabel: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  // Day Type's fixed 3-option row — see the `fitChip` (flex: 1) note above its usage.
  fitRow: { flexDirection: 'row', gap: Spacing.xs },
  fitChip: { flex: 1, paddingHorizontal: Spacing.sm },
  recordButton: { marginTop: Spacing.xl },
  recordButtonSuccess: { marginTop: Spacing.xl, backgroundColor: Colors.success },
});

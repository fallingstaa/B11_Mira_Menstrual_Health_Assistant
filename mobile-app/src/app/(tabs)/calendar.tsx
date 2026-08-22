import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { BatchRecordModal } from '@/components/mira/batch-record-modal';
import { Button } from '@/components/mira/button';
import { Card } from '@/components/mira/card';
import { Dot } from '@/components/mira/chip';
import { PeriodDayEditor } from '@/components/mira/period-day-editor';
import { PeriodEntriesSummary } from '@/components/mira/period-entries-summary';
import { ScreenContainer } from '@/components/mira/screen-container';
// pastPeriods is still this screen's placeholder "demo history" for a brand-new account with
// nothing logged yet (see hasRealEntries below) — cycleStats is gone, see the prediction state
// below for why.
import { pastPeriods } from '@/constants/mock-data';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { apiRequest } from '@/utils/api';
import { dateKey, getMonthGrid, isPastMonth, isSameDay, isSameMonth, isWithinRange, monthLabel, parseIsoDate, WEEKDAY_LABELS } from '@/utils/date';

type DayStatus = 'period' | 'period-end' | 'predicted' | 'fertile' | 'none';

/** The subset of `GET /api/menstrual/prediction` this screen needs for the "Estimated"/"Fertile
 *  window" day highlighting — both null until a first period's ever been logged. */
type CalendarPrediction = {
  nextPeriodStart: string | null;
  nextPeriodEnd: string | null;
  fertileWindowStart: string | null;
  fertileWindowEnd: string | null;
};

export default function CalendarScreen() {
  const { periodEntries, togglePeriodDay, setPeriodEndDay, updatePeriodDayEntry, commitDays } = useAppState();
  // The real device date, not the app's fixed demo date — so "Today" always lands on the actual day.
  const [today] = useState(() => new Date());
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);
  // The day editor now opens as its own popup instead of expanding inline in this scrolling
  // page — tapping a day (or a "Recorded Days" row) felt like it was editing the calendar itself
  // rather than a separate record, since the editor appeared inline right below the grid.
  const [dayEditorVisible, setDayEditorVisible] = useState(false);
  // Past-month backfill: tapping an unrecorded day in a month before this one selects it instead
  // of opening the single-day editor (that stays a current-month-only flow) — Record then logs
  // every selected day in one go via BatchRecordModal. Cleared on month change so a batch never
  // silently spans two different months' worth of taps.
  const [multiSelectedDays, setMultiSelectedDays] = useState<Date[]>([]);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  // "Estimated period" / "Fertile window" highlighting used to come from mock cycleStats, fixed
  // at Aug 21-25 / Aug 6-10 regardless of what was actually recorded — this fetches the real
  // prediction instead, same GET /menstrual/prediction Home and the Prediction Details screen
  // already use, refetched on every focus so a period just recorded on this same screen updates
  // the highlighting immediately.
  const [prediction, setPrediction] = useState<CalendarPrediction | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      apiRequest<CalendarPrediction>('/menstrual/prediction')
        .then((data) => {
          if (!cancelled) setPrediction(data);
        })
        .catch((err) => {
          console.error('[calendar] failed to load /menstrual/prediction:', err);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const hasRealEntries = Object.keys(periodEntries).length > 0;
  const predictedStart = prediction?.nextPeriodStart ? parseIsoDate(prediction.nextPeriodStart) : null;
  const predictedEnd = prediction?.nextPeriodEnd ? parseIsoDate(prediction.nextPeriodEnd) : null;
  const fertileStart = prediction?.fertileWindowStart ? parseIsoDate(prediction.fertileWindowStart) : null;
  const fertileEnd = prediction?.fertileWindowEnd ? parseIsoDate(prediction.fertileWindowEnd) : null;

  const getStatus = (date: Date): DayStatus => {
    const entry = periodEntries[dateKey(date)];
    if (entry) return entry.isEnd ? 'period-end' : 'period';
    // Once the user has entered anything real, their data replaces the canned demo history.
    if (!hasRealEntries && pastPeriods.some((p) => isWithinRange(date, p.start, p.end))) return 'period';
    if (predictedStart && predictedEnd && isWithinRange(date, predictedStart, predictedEnd)) return 'predicted';
    if (fertileStart && fertileEnd && isWithinRange(date, fertileStart, fertileEnd)) return 'fertile';
    return 'none';
  };

  const grid = useMemo(() => getMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const status = getStatus(selected);
  const selectedEntry = periodEntries[dateKey(selected)];

  const changeMonth = (delta: number) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
    setMultiSelectedDays([]);
  };

  const toggleSelectedSymptom = (key: string) => {
    const symptoms = selectedEntry?.symptoms ?? [];
    updatePeriodDayEntry(selected, {
      symptoms: symptoms.includes(key) ? symptoms.filter((s) => s !== key) : [...symptoms, key],
    });
  };

  const toggleSelectedMood = (key: string) => {
    const mood = selectedEntry?.mood ?? [];
    updatePeriodDayEntry(selected, {
      mood: mood.includes(key) ? mood.filter((m) => m !== key) : [...mood, key],
    });
  };

  /**
   * Opens the single-day popup — reached only for the current month (grid taps there go straight
   * here) or from a "Recorded Days" row (always a real, already-saved entry). Any non-current
   * month arriving here must already be a locked, previously-logged day — a past month's
   * unrecorded days never reach this at all, see `selectDay`.
   */
  const openDayEditor = (date: Date) => {
    if (!isSameMonth(date, today)) {
      Alert.alert(
        'Record locked',
        "This day is from a previous month and was already logged, so it can't be changed anymore. Past records lock once saved to keep your predictions accurate.",
      );
      return;
    }
    setSelected(date);
    setDayEditorVisible(true);
  };

  /** Jump to an already-recorded day, even if it's in a different month than currently shown. */
  const jumpToDay = (date: Date) => {
    setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
    openDayEditor(date);
  };

  const toggleMultiSelect = (date: Date) => {
    setMultiSelectedDays((prev) =>
      prev.some((d) => isSameDay(d, date)) ? prev.filter((d) => !isSameDay(d, date)) : [...prev, date],
    );
  };

  /**
   * The single gate every grid tap goes through. Current month: unchanged, straight into the
   * single-day popup. A past month: an already-logged day is locked (explains why, same as
   * Recorded Days' own past-month rows); an unrecorded one just toggles into the multi-select
   * batch instead of opening anything, so several days can be backfilled together. Future dates
   * can't be logged at all — nothing to record yet.
   */
  const selectDay = (date: Date) => {
    if (isSameMonth(date, today)) {
      openDayEditor(date);
      return;
    }
    if (!isPastMonth(date, today)) {
      Alert.alert("That hasn't happened yet", "You can't log a period day before it happens.");
      return;
    }
    if (periodEntries[dateKey(date)]) {
      Alert.alert(
        'Record locked',
        "This day was already logged and can't be changed anymore. Past records lock once saved to keep your predictions accurate.",
      );
      return;
    }
    toggleMultiSelect(date);
  };

  const sortedSelection = useMemo(
    () => [...multiSelectedDays].sort((a, b) => a.getTime() - b.getTime()),
    [multiSelectedDays],
  );

  const handleBatchRecord = (details: { flow?: string; symptoms: string[]; mood: string[] }) => {
    const dates = multiSelectedDays;
    dates.forEach((date) => {
      togglePeriodDay(date); // each of these is guaranteed unrecorded — see selectDay's guard above
      updatePeriodDayEntry(date, { flow: details.flow, symptoms: details.symptoms, mood: details.mood });
    });
    setMultiSelectedDays([]);
    setBatchModalVisible(false);

    commitDays(
      dates.map((date) => ({ date, flow: details.flow, symptoms: details.symptoms, mood: details.mood })),
      'calendar',
    ).catch((err) => {
      Alert.alert("Couldn't save to the server", err instanceof Error ? err.message : 'Please try again.');
    });
  };

  return (
    <ScreenContainer tabBar>
      <AppText variant="h1" style={styles.pageTitle}>
        Calendar
      </AppText>

      <Card style={styles.calendarCard}>
        <View style={styles.monthRow}>
          <Pressable onPress={() => changeMonth(-1)} style={styles.navButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={18} color={Colors.text} />
          </Pressable>
          <AppText variant="h3">{monthLabel(cursor)}</AppText>
          <Pressable onPress={() => changeMonth(1)} style={styles.navButton} hitSlop={8}>
            <Ionicons name="chevron-forward" size={18} color={Colors.text} />
          </Pressable>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((w, i) => (
            <AppText key={i} variant="caption" style={styles.weekdayLabel}>
              {w}
            </AppText>
          ))}
        </View>

        <Animated.View entering={FadeIn.duration(220)} key={monthLabel(cursor)} style={styles.grid}>
          {grid.map(({ date, inMonth }, i) => {
            const dayStatus = getStatus(date);
            const isSelected = isSameDay(date, selected);
            const isTodayCell = isSameDay(date, today);
            const isPeriod = dayStatus === 'period' || dayStatus === 'period-end';
            const isBatchSelected = multiSelectedDays.some((d) => isSameDay(d, date));

            return (
              <Pressable key={i} style={styles.cell} onPress={() => selectDay(date)}>
                <View
                  style={[
                    styles.cellInner,
                    isPeriod && { backgroundColor: Colors.primary },
                    dayStatus === 'predicted' && { backgroundColor: Colors.tint200 },
                    dayStatus === 'fertile' && { backgroundColor: Colors.tealTint },
                    isTodayCell && !isSelected && styles.todayRing,
                    isSelected && styles.selectedCell,
                    isBatchSelected && styles.batchSelectedCell,
                  ]}>
                  <AppText
                    variant="small"
                    color={isPeriod || isSelected ? Colors.textOnPrimary : inMonth ? Colors.text : Colors.textMuted}>
                    {date.getDate()}
                  </AppText>
                  {dayStatus === 'period-end' && (
                    <View style={styles.endBadge}>
                      <Ionicons name="flag" size={7} color={Colors.textOnPrimary} />
                    </View>
                  )}
                  {isBatchSelected && (
                    <View style={styles.batchCheckBadge}>
                      <Ionicons name="checkmark" size={9} color={Colors.textOnPrimary} />
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </Animated.View>

        <View style={styles.legendRow}>
          <LegendItem color={Colors.primary} label="Period" />
          <LegendItem color={Colors.tint200} label="Estimated" />
          <LegendItem color={Colors.teal} label="Fertile window" />
        </View>
      </Card>

      {!selectedEntry && (status === 'predicted' || status === 'fertile') && (
        <AppText variant="small" color={Colors.textSecondary} style={styles.hint}>
          {status === 'predicted'
            ? 'Estimated period day, based on your cycle history.'
            : 'Estimated fertile window.'}
        </AppText>
      )}

      {isPastMonth(cursor, today) && multiSelectedDays.length === 0 && (
        <AppText variant="small" color={Colors.textSecondary} style={styles.hint}>
          Past month — tap the days you want to log, then Record. They lock for editing once saved.
        </AppText>
      )}

      {multiSelectedDays.length > 0 && (
        <View style={styles.batchBar}>
          <View style={styles.batchBarText}>
            <AppText variant="bodyMedium" numberOfLines={1} color={Colors.primary}>
              {multiSelectedDays.length} day{multiSelectedDays.length === 1 ? '' : 's'} selected
            </AppText>
            <Pressable onPress={() => setMultiSelectedDays([])} hitSlop={8}>
              <AppText variant="small" numberOfLines={1} color={Colors.textMuted}>
                Clear
              </AppText>
            </Pressable>
          </View>
          <Button
            label="Record"
            fullWidth={false}
            onPress={() => setBatchModalVisible(true)}
            style={styles.batchRecordButton}
          />
        </View>
      )}

      <PeriodEntriesSummary
        entries={periodEntries}
        activeDate={selected}
        today={today}
        onSelect={jumpToDay}
        onRemove={togglePeriodDay}
        delay={70}
      />

      <Button
        label="View Prediction Details"
        variant="secondary"
        icon={<Ionicons name="stats-chart" size={16} color={Colors.primary} />}
        onPress={() => router.push('/prediction')}
        style={styles.predictionButton}
      />

      {/* The day editor opens here, as its own popup, instead of expanding inline in the page
          above — keeps "editing one day's record" visually separate from "browsing the
          calendar", so the two don't read as the same surface. */}
      <Modal
        visible={dayEditorVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setDayEditorVisible(false)}>
        <View style={styles.popupOverlay}>
          <View style={[styles.popupSheet, Shadow.raised]}>
            <View style={styles.popupHandle} />
            <View style={styles.popupHeaderRow}>
              <AppText variant="h2">Day Details</AppText>
              <Pressable onPress={() => setDayEditorVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.popupScroll}>
              <PeriodDayEditor
                date={selected}
                entry={selectedEntry}
                onToggleMark={() => togglePeriodDay(selected)}
                onSetEndDay={() => setPeriodEndDay(selected)}
                onClearEndDay={() => updatePeriodDayEntry(selected, { isEnd: false })}
                onSetFlow={(flow) => updatePeriodDayEntry(selected, { flow })}
                onToggleSymptom={toggleSelectedSymptom}
                onToggleMood={toggleSelectedMood}
                onRecord={() => {
                  // Brief pause so the "Recorded!" confirmation is actually visible before the
                  // popup closes — same ~1s pattern the rest of the app uses after a save.
                  setTimeout(() => setDayEditorVisible(false), 1100);
                  commitDays([{ ...selectedEntry, date: selected }], 'calendar').catch((err) => {
                    Alert.alert("Couldn't save to the server", err instanceof Error ? err.message : 'Please try again.');
                  });
                }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <BatchRecordModal
        visible={batchModalVisible}
        dates={sortedSelection}
        onCancel={() => setBatchModalVisible(false)}
        onConfirm={handleBatchRecord}
      />
    </ScreenContainer>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <Dot color={color} active />
      <AppText variant="small">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pageTitle: { marginTop: Spacing.md, marginBottom: Spacing.lg },
  calendarCard: { marginBottom: Spacing.lg },
  predictionButton: { marginTop: Spacing.md, marginBottom: Spacing.xxl },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    backgroundColor: Colors.tint50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  weekdayLabel: { flex: 1, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  cellInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  todayRing: { borderWidth: 1.5, borderColor: Colors.primary },
  selectedCell: { backgroundColor: Colors.primaryDark },
  // Distinct from selectedCell (that's the single-day popup's "currently open" cell) — this is
  // "queued for the batch", teal like the fertile-window legend color so it never reads as a
  // period/predicted day at a glance.
  batchSelectedCell: { borderWidth: 2, borderColor: Colors.teal, backgroundColor: Colors.tealTint },
  batchCheckBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: Colors.teal,
    borderWidth: 1.5,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: Colors.primaryDark,
    borderWidth: 1.5,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  hint: { marginBottom: Spacing.md },
  batchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    backgroundColor: Colors.tealTint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  batchBarText: { flex: 1, gap: 2 },
  batchRecordButton: { paddingHorizontal: Spacing.xl },
  popupOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  popupSheet: {
    maxHeight: '85%',
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
  },
  popupHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  popupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  popupScroll: { paddingBottom: Spacing.xxxl },
});

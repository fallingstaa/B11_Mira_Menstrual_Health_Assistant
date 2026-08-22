import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppText } from '@/components/mira/app-text';
import { Button } from '@/components/mira/button';
import { Card } from '@/components/mira/card';
import { CycleLengthAnswer, CycleLengthQuestion, DEFAULT_CYCLE_LENGTH } from '@/components/mira/cycle-length-question';
import { PeriodDayEditor } from '@/components/mira/period-day-editor';
import { PeriodEntriesSummary } from '@/components/mira/period-entries-summary';
import { DEFAULT_PERIOD_LENGTH, PeriodLengthAnswer, PeriodLengthQuestion } from '@/components/mira/period-length-question';
import { ScreenContainer } from '@/components/mira/screen-container';
import { ScreenHeader } from '@/components/mira/screen-header';
import { SuccessOverlay } from '@/components/mira/success-overlay';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { dateKey, formatShort, getMonthGrid, isSameDay, monthLabel, WEEKDAY_LABELS } from '@/utils/date';

/**
 * Guided, calendar-tap flow for logging a first period — simpler than the detailed /record form.
 * Tapping any day freely marks/unmarks it as a period day (start, end, or anything in between).
 * Entries live in AppState, not local state, so leaving and coming back — or switching over to
 * the Calendar tab — shows exactly what was entered, still fully editable (including which day
 * is the end date).
 */
export default function RecordFirstPeriodScreen() {
  const {
    periodEntries,
    togglePeriodDay,
    setPeriodEndDay,
    updatePeriodDayEntry,
    setAverageCycleLength,
    setAveragePeriodDuration,
    commitDays,
  } = useAppState();
  // The real device date, not the app's fixed demo date — so this screen reflects "today" whenever it's actually opened.
  const [today] = useState(() => new Date());
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [activeDay, setActiveDay] = useState(today);
  const [saved, setSaved] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Period recorded!');
  const [knowsCycleLength, setKnowsCycleLength] = useState<CycleLengthAnswer>(null);
  const [cycleLength, setCycleLength] = useState(DEFAULT_CYCLE_LENGTH);
  const [knowsPeriodLength, setKnowsPeriodLength] = useState<PeriodLengthAnswer>(null);
  const [periodLength, setPeriodLength] = useState(DEFAULT_PERIOD_LENGTH);
  // Shown immediately on entering this screen from "I'm on my period right now" — two quick
  // questions, gone the moment they're answered or skipped. The calendar underneath (tap days to
  // mark them, same as always) is what actually records anything — this popup only ever touches
  // the cycle/period length inputs, never a date.
  const [showCycleLengthPopup, setShowCycleLengthPopup] = useState(true);

  const grid = useMemo(() => getMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const markedCount = Object.keys(periodEntries).length;
  const latestEntry = useMemo(
    () => Object.values(periodEntries).sort((a, b) => b.date.getTime() - a.date.getTime())[0],
    [periodEntries],
  );
  const endEntry = useMemo(() => Object.values(periodEntries).find((e) => e.isEnd), [periodEntries]);
  const activeEntry = periodEntries[dateKey(activeDay)];

  const changeMonth = (delta: number) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  };

  /** Tapping a day (on the grid, or the toggle button below) marks/unmarks it directly — no extra confirm step. */
  const selectDay = (date: Date) => {
    setActiveDay(date);
    togglePeriodDay(date);
  };

  const toggleActiveSymptom = (key: string) => {
    const symptoms = activeEntry?.symptoms ?? [];
    updatePeriodDayEntry(activeDay, {
      symptoms: symptoms.includes(key) ? symptoms.filter((s) => s !== key) : [...symptoms, key],
    });
  };

  const toggleActiveMood = (key: string) => {
    const mood = activeEntry?.mood ?? [];
    updatePeriodDayEntry(activeDay, {
      mood: mood.includes(key) ? mood.filter((m) => m !== key) : [...mood, key],
    });
  };

  useEffect(() => {
    if (!saved) return;
    // Go straight to Home, skipping back over the "Let's get you set up" question screen.
    const t = setTimeout(() => router.dismissTo('/(tabs)/home'), 1100);
    return () => clearTimeout(t);
  }, [saved]);

  /** Jump the editor to an already-recorded day, even if it's in a different month than shown. */
  const jumpToDay = (date: Date) => {
    setActiveDay(date);
    setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const finish = (message: string) => {
    setSuccessMessage(message);
    setSaved(true);

    // Syncs every day marked this session in one batch, each with whatever flow/symptoms/mood/
    // end-day details it individually has (unlike Calendar's batch-backfill or record.tsx's
    // range, which apply one shared set of details to every date) — this screen lets each day
    // be edited independently via the PeriodDayEditor below, so a uniform patch would lose that.
    if (markedCount > 0) {
      commitDays(Object.values(periodEntries), 'record_first_period').catch((err) => {
        Alert.alert("Couldn't save to the server", err instanceof Error ? err.message : 'Please try again.');
      });
    }
  };

  /**
   * Closes the cycle/period-length popup. "Skip" leaves both averages untouched (the 28/5-day
   * defaults, unless real history has already overridden them) without even looking at whatever
   * was selected; "Save" applies each answer that was actually given. Either way this is the
   * whole interaction — closing it hands off straight to the calendar below, tap-to-record as
   * usual. Applying a length instantly updates nextPeriodStartDate on Home and the on-device
   * reminder schedule — see context/app-state.tsx.
   */
  const closeCycleLengthPopup = (apply: boolean) => {
    if (apply && knowsCycleLength) {
      setAverageCycleLength(knowsCycleLength === 'yes' ? cycleLength : DEFAULT_CYCLE_LENGTH);
    }
    if (apply && knowsPeriodLength) {
      setAveragePeriodDuration(knowsPeriodLength === 'yes' ? periodLength : DEFAULT_PERIOD_LENGTH);
    }
    setShowCycleLengthPopup(false);
  };

  /**
   * Footer "Mark as End": uses whichever day is already flagged as the end, otherwise flags
   * the active/latest one. A pure data action, same spirit as tapping a calendar day — it no
   * longer also exits the screen (finish()) the way it used to. Flagging the end day and being
   * "done for the session" are two different things; only "Done" below now means the latter.
   */
  const markAsEnd = () => {
    if (!endEntry) {
      const target = activeEntry ? activeDay : latestEntry?.date;
      if (target) setPeriodEndDay(target);
    }
  };

  const headerSubtitle =
    markedCount === 0
      ? 'Tap the days you have your period'
      : `${markedCount} day${markedCount === 1 ? '' : 's'} marked · ${formatShort(latestEntry.date)}`;

  return (
    <ScreenContainer
      edges={['top', 'left', 'right', 'bottom']}
      footer={
        <View>
          {markedCount > 0 && (
            <View style={styles.statusBar}>
              <View style={styles.statusBarLeft}>
                <View style={styles.statusDot} />
                <AppText variant="small" color={Colors.primary}>
                  {markedCount} day{markedCount === 1 ? '' : 's'} marked · tracking
                </AppText>
              </View>
              <AppText variant="small" color={Colors.primary}>
                {endEntry ? `Ends ${formatShort(endEntry.date)}` : formatShort(latestEntry.date)}
              </AppText>
            </View>
          )}
          <View style={styles.footerRow}>
            <Button
              label="Mark as End"
              variant="outline"
              icon={<Ionicons name="flag" size={16} color={Colors.primary} />}
              disabled={markedCount === 0}
              onPress={markAsEnd}
              style={styles.footerButton}
            />
            <Button
              label="Done"
              icon={<Ionicons name="checkmark" size={16} color={Colors.textOnPrimary} />}
              // Deliberately never disabled — finishing with nothing marked yet is a valid
              // outcome (same as "Skip for now" elsewhere in setup), not something to block.
              // A disabled Save button here — greyed out and unresponsive until a day was
              // tapped first — is what made this feel "hard to click".
              onPress={() => finish(markedCount === 0 ? 'All good — come back any time.' : 'Saved! Keep logging as it continues.')}
              style={styles.footerButton}
            />
          </View>
          <AppText variant="caption" center style={styles.footerCaption}>
            Tap a day to mark it · Know when it ended? Mark as End · Done finishes up
          </AppText>
        </View>
      }>
      <ScreenHeader title="Record Your Period" subtitle={headerSubtitle} />

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
            const entry = periodEntries[dateKey(date)];
            const isMarked = !!entry;
            const isToday = isSameDay(date, today);
            const isActive = isSameDay(date, activeDay);

            return (
              <Pressable key={i} style={styles.cell} onPress={() => selectDay(date)}>
                <View
                  style={[
                    styles.cellInner,
                    isMarked && styles.markedCell,
                    !isMarked && isToday && styles.todayCell,
                    !isMarked && !isToday && isActive && styles.activeCell,
                  ]}>
                  <AppText
                    variant="small"
                    color={isMarked ? Colors.textOnPrimary : inMonth ? Colors.text : Colors.textMuted}>
                    {date.getDate()}
                  </AppText>
                  {entry?.isEnd && (
                    <View style={styles.endBadge}>
                      <Ionicons name="flag" size={7} color={Colors.textOnPrimary} />
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </Animated.View>

        <View style={styles.legendRow}>
          <LegendItem style={styles.legendMarked} label="Period day" />
          <LegendItem style={styles.legendEnd} label="End day" />
          <LegendItem style={styles.legendToday} label="Today" />
          <LegendItem style={styles.legendActive} label="Selected" />
        </View>
      </Card>

      <PeriodEntriesSummary
        entries={periodEntries}
        activeDate={activeDay}
        today={today}
        // Guided first-time setup — nothing here should read as "locked" yet, there's no history
        // to protect. See PeriodEntriesSummary's `lockPastMonths` doc.
        lockPastMonths={false}
        onSelect={jumpToDay}
        onRemove={togglePeriodDay}
        delay={70}
      />

      <PeriodDayEditor
        date={activeDay}
        entry={activeEntry}
        onToggleMark={() => selectDay(activeDay)}
        onSetEndDay={() => setPeriodEndDay(activeDay)}
        onClearEndDay={() => updatePeriodDayEntry(activeDay, { isEnd: false })}
        onSetFlow={(flow) => updatePeriodDayEntry(activeDay, { flow })}
        onToggleSymptom={toggleActiveSymptom}
        onToggleMood={toggleActiveMood}
        delay={80}
      />

      {saved && <SuccessOverlay message={successMessage} />}

      <Modal
        visible={showCycleLengthPopup}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => closeCycleLengthPopup(true)}>
        <View style={styles.popupOverlay}>
          <View style={[styles.popupSheet, Shadow.raised]}>
            <View style={styles.popupHandle} />
            <View style={styles.popupHeaderRow}>
              <AppText variant="h2">Cycle & Period Length</AppText>
              <Pressable onPress={() => closeCycleLengthPopup(false)} hitSlop={8}>
                <AppText variant="bodyMedium" color={Colors.textMuted}>
                  Skip
                </AppText>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.popupScroll}>
              <CycleLengthQuestion
                answer={knowsCycleLength}
                onAnswerChange={setKnowsCycleLength}
                cycleLength={cycleLength}
                onCycleLengthChange={setCycleLength}
              />

              <View style={styles.popupDivider} />

              <PeriodLengthQuestion
                answer={knowsPeriodLength}
                onAnswerChange={setKnowsPeriodLength}
                periodLength={periodLength}
                onPeriodLengthChange={setPeriodLength}
              />

              <Button label="Save & Continue" onPress={() => closeCycleLengthPopup(true)} style={styles.popupButton} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function LegendItem({ style, label }: { style: ViewStyle; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, style]} />
      <AppText variant="small">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarCard: { marginBottom: Spacing.lg },
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
  markedCell: { backgroundColor: Colors.primary },
  todayCell: { borderWidth: 1.5, borderColor: Colors.primary },
  activeCell: { borderWidth: 1.5, borderColor: Colors.tint300 },
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
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendMarked: { backgroundColor: Colors.primary },
  legendEnd: { backgroundColor: Colors.primaryDark },
  legendToday: { borderWidth: 1.5, borderColor: Colors.primary },
  legendActive: { borderWidth: 1.5, borderColor: Colors.tint300 },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.tint50,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.md,
  },
  statusBarLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  footerRow: { flexDirection: 'row', gap: Spacing.md },
  footerButton: { flex: 1 },
  footerCaption: { marginTop: Spacing.sm },
  popupOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  popupSheet: {
    // Two questions now, not one — bounded so a smaller device gets a scrollable sheet
    // (popupScroll below) instead of the second question/button running off-screen.
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
    marginBottom: Spacing.xl,
  },
  popupScroll: { paddingBottom: Spacing.xxxl },
  popupDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xl },
  popupButton: { marginTop: Spacing.md },
});

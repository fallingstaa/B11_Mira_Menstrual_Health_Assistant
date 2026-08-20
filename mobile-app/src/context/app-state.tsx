import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { addDays, dateKey, daysBetween } from '@/utils/date';
import { syncPeriodNotifications } from '@/utils/notifications';

export type PeriodDayEntry = {
  date: Date;
  /** At most one entry across the whole map has this set — the day the period was marked to end. */
  isEnd?: boolean;
  flow?: string;
  symptoms: string[];
  mood?: string;
  notes?: string;
};

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_DURATION = 5;

type Streak = { start: Date; end: Date };

/** Groups marked days into runs of consecutive calendar dates — each run is one logged period. */
function getPeriodStreaks(entries: Record<string, PeriodDayEntry>): Streak[] {
  const days = Object.values(entries)
    .map((e) => e.date)
    .sort((a, b) => a.getTime() - b.getTime());

  const streaks: Streak[] = [];
  for (const day of days) {
    const current = streaks[streaks.length - 1];
    if (current && daysBetween(current.end, day) === 1) {
      current.end = day;
    } else {
      streaks.push({ start: day, end: day });
    }
  }
  return streaks;
}

type AppStateValue = {
  /**
   * Has the user logged at least one period day yet? Drives the Home "first-time" vs "returning"
   * layout. Derived straight from periodEntries (true the moment any day is marked, from *any*
   * screen — the guided flow, Calendar, or "last period" setup) rather than a separate flag, so
   * there's no way for one entry point to forget to flip it and leave Home stuck out of sync.
   */
  firstPeriodRecorded: boolean;
  /** Has the user sent Mira a chat message yet? Powers the last Getting Started checklist item. */
  firstQuestionAsked: boolean;
  markFirstQuestionAsked: () => void;
  /** Captured once at registration — lets later logic (tips, defaults) branch on teen vs adult. */
  userAge: number | null;
  setUserAge: (age: number) => void;
  /** True once the user has told Mira this is their first period ever / they have no dates at all. */
  isBeginner: boolean;
  setIsBeginner: (value: boolean) => void;
  /**
   * Cycle Length, medically defined: the number of days from one period's Start Date to the
   * *next* period's Start Date. Deliberately independent of End Date — a cycle length is
   * measurable the moment a second Start Date is logged, with no need to know how long either
   * period bled for. Defaults to 28, and once 2+ periods have actually been logged this is
   * recomputed automatically from the real, exact gap between their start dates — silently
   * overriding whatever was set manually (onboarding guess, or the previous auto-estimate) the
   * instant real data exists. See getPeriodStreaks below for how "a period's start date" is found.
   */
  averageCycleLength: number;
  /** Manual estimate — used by onboarding's "I know my cycle length" step. Silently ignored once 2+ real start dates exist. */
  setAverageCycleLength: (days: number) => void;
  /**
   * Period Duration, medically defined: the number of days from a period's Start Date to its own
   * End Date (i.e. how many days it bled) — unrelated to Cycle Length. Defaults to 5, and once
   * at least one period is fully logged this is recomputed automatically from its real length.
   */
  averagePeriodDuration: number;
  setAveragePeriodDuration: (days: number) => void;
  /**
   * The Start Date of the most recently logged period — null until at least one day has ever
   * been marked. Whichever screen wrote it (Path A/B setup, Calendar, record.tsx, checkin.tsx)
   * doesn't matter; this always reflects the latest contiguous run of marked days.
   */
  lastPeriodStartDate: Date | null;
  /**
   * Instant on-device prediction: `lastPeriodStartDate + averageCycleLength`, recomputed the
   * moment either input changes — no server round-trip. Null until there's a start date to
   * predict from at all. Also drives the local notification schedule — see notifications.ts.
   */
  nextPeriodStartDate: Date | null;
  /**
   * The user's actual marked period days, keyed by date. Shared between the guided first-time
   * flow and the Calendar tab so whatever's entered in one shows up — and stays editable — in
   * the other, instead of each screen holding its own disconnected copy.
   */
  periodEntries: Record<string, PeriodDayEntry>;
  /** Tapping a day marks/unmarks it directly — no separate confirm step. */
  togglePeriodDay: (date: Date) => void;
  /** Idempotent mark — unlike togglePeriodDay, safe to call on a day that may already be marked (bulk range-add). */
  markPeriodDay: (date: Date) => void;
  /** Flags one specific day as the end of the period — marks it if it isn't already, and un-flags any other day. */
  setPeriodEndDay: (date: Date) => void;
  updatePeriodDayEntry: (date: Date, patch: Partial<Omit<PeriodDayEntry, 'date'>>) => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

/**
 * Session-only "has the user done X yet" flags, the cycle profile derived from them, and the
 * period days actually entered. There's no backend yet, so nothing here persists across app
 * restarts — it just lets Home, the guided recorder, the Calendar tab, and the check-in/record
 * modals all read and edit the same live data instead of each hardcoding its own mock.
 */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [firstQuestionAsked, setFirstQuestionAsked] = useState(false);
  const [periodEntries, setPeriodEntries] = useState<Record<string, PeriodDayEntry>>({});
  const [userAge, setUserAgeState] = useState<number | null>(null);
  const [isBeginner, setIsBeginnerState] = useState(false);
  // Manual estimates — used until there's enough real history to calculate the real thing.
  const [manualCycleLength, setManualCycleLength] = useState(DEFAULT_CYCLE_LENGTH);
  const [manualPeriodDuration, setManualPeriodDuration] = useState(DEFAULT_PERIOD_DURATION);

  const firstPeriodRecorded = Object.keys(periodEntries).length > 0;

  const streaks = useMemo(() => getPeriodStreaks(periodEntries), [periodEntries]);

  /**
   * Automatic Learning Logic: Cycle Length is Start Date → next Start Date, so as soon as a
   * *second* period's start date exists this is measurable exactly — no averaging needed, no
   * End Date needed. From a third period onward, each new start date folds into a rolling
   * average of the real start-to-start gaps so far, so the estimate keeps tracking the user's
   * actual pattern rather than freezing at whatever the first real cycle happened to be.
   */
  const averageCycleLength = useMemo(() => {
    if (streaks.length < 2) return manualCycleLength;
    const gaps = streaks.slice(1).map((streak, i) => daysBetween(streaks[i].start, streak.start));
    return Math.round(gaps.reduce((sum, g) => sum + g, 0) / gaps.length);
  }, [streaks, manualCycleLength]);

  // Once at least one period is logged, trust its real length over the default.
  const averagePeriodDuration = useMemo(() => {
    if (streaks.length === 0) return manualPeriodDuration;
    const lengths = streaks.map((streak) => daysBetween(streak.start, streak.end) + 1);
    return Math.round(lengths.reduce((sum, l) => sum + l, 0) / lengths.length);
  }, [streaks, manualPeriodDuration]);

  const lastPeriodStartDate = streaks.length > 0 ? streaks[streaks.length - 1].start : null;
  const nextPeriodStartDate = useMemo(
    () => (lastPeriodStartDate ? addDays(lastPeriodStartDate, averageCycleLength) : null),
    [lastPeriodStartDate, averageCycleLength],
  );

  // Local reminders are entirely derived from the values above — this is the single place that
  // keeps the on-device notification queue instantly in sync with whatever's actually logged,
  // from any screen.
  useEffect(() => {
    syncPeriodNotifications(lastPeriodStartDate, nextPeriodStartDate, averageCycleLength, periodEntries);
  }, [lastPeriodStartDate, nextPeriodStartDate, averageCycleLength, periodEntries]);

  const togglePeriodDay = (date: Date) => {
    const key = dateKey(date);
    setPeriodEntries((prev) => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: { date, symptoms: [] } };
    });
  };

  const markPeriodDay = (date: Date) => {
    const key = dateKey(date);
    setPeriodEntries((prev) => (prev[key] ? prev : { ...prev, [key]: { date, symptoms: [] } }));
  };

  const setPeriodEndDay = (date: Date) => {
    const key = dateKey(date);
    setPeriodEntries((prev) => {
      const next: Record<string, PeriodDayEntry> = { ...prev, [key]: prev[key] ?? { date, symptoms: [] } };
      Object.keys(next).forEach((k) => {
        next[k] = { ...next[k], isEnd: k === key };
      });
      return next;
    });
  };

  const updatePeriodDayEntry = (date: Date, patch: Partial<Omit<PeriodDayEntry, 'date'>>) => {
    const key = dateKey(date);
    setPeriodEntries((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], ...patch } } : prev));
  };

  const value = useMemo<AppStateValue>(
    () => ({
      firstPeriodRecorded,
      firstQuestionAsked,
      markFirstQuestionAsked: () => setFirstQuestionAsked(true),
      userAge,
      setUserAge: (age: number) => setUserAgeState(age),
      isBeginner,
      setIsBeginner: (value: boolean) => setIsBeginnerState(value),
      averageCycleLength,
      setAverageCycleLength: (days: number) => setManualCycleLength(days),
      averagePeriodDuration,
      setAveragePeriodDuration: (days: number) => setManualPeriodDuration(days),
      lastPeriodStartDate,
      nextPeriodStartDate,
      periodEntries,
      togglePeriodDay,
      markPeriodDay,
      setPeriodEndDay,
      updatePeriodDayEntry,
    }),
    [
      firstPeriodRecorded,
      firstQuestionAsked,
      userAge,
      isBeginner,
      averageCycleLength,
      averagePeriodDuration,
      lastPeriodStartDate,
      nextPeriodStartDate,
      periodEntries,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within an AppStateProvider');
  return ctx;
}

import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import { dateKey } from '@/utils/date';

export type PeriodDayEntry = {
  date: Date;
  /** At most one entry across the whole map has this set — the day the period was marked to end. */
  isEnd?: boolean;
  flow?: string;
  symptoms: string[];
  mood?: string;
};

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
 * Session-only "has the user done X yet" flags, plus the period days they've actually entered.
 * There's no backend yet, so nothing here persists across app restarts — it just lets Home,
 * the guided recorder, and the Calendar tab all read and edit the same live data instead of
 * each hardcoding its own mock, and lets a first-time user freely add or move days (including
 * the end date) across as many visits to the screen as they like within a session.
 */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [firstQuestionAsked, setFirstQuestionAsked] = useState(false);
  const [periodEntries, setPeriodEntries] = useState<Record<string, PeriodDayEntry>>({});
  const firstPeriodRecorded = Object.keys(periodEntries).length > 0;

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
      periodEntries,
      togglePeriodDay,
      markPeriodDay,
      setPeriodEndDay,
      updatePeriodDayEntry,
    }),
    [firstPeriodRecorded, firstQuestionAsked, periodEntries],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within an AppStateProvider');
  return ctx;
}

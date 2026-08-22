import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { ApiError, apiRequest } from '@/utils/api';
import { addDays, dateKey, daysBetween, isoDate, parseIsoDate } from '@/utils/date';
import { syncPeriodNotifications } from '@/utils/notifications';

export type PeriodDayEntry = {
  date: Date;
  /** At most one entry across the whole map has this set — the day the period was marked to end. */
  isEnd?: boolean;
  flow?: string;
  symptoms: string[];
  /** Multi-select, same shape as symptoms — a day can be "Calm" AND "Anxious" AND anything else at once. */
  mood: string[];
  notes?: string;
};

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_DURATION = 5;

/**
 * One value per screen that can write a day's record — mirrors the backend's
 * MENSTRUAL_RECORD_SOURCES (utils/constants.js) exactly; `commitDays` below sends this
 * straight through as the batch write's `source`. Path C of onboarding
 * (last-period-unknown.tsx) never appears here — it never writes a record at all, only
 * `setIsBeginner`/`setAverageCycleLength` (see PUT /api/menstrual/cycle-setup below).
 */
export type RecordSource = 'calendar' | 'checkin' | 'record' | 'record_first_period' | 'last_period_one_date';

/** What a screen has in hand right before it wants a day's edits to actually persist. */
export type CommitDayEntry = {
  date: Date;
  /** Defaults to true — every write screen except Check-in marks the day as an actual period
   *  day. Check-in passes `false` explicitly for a day that isn't already one, since it's a
   *  general how-are-you-feeling log, not a period recorder — see checkin.tsx. */
  isPeriodDay?: boolean;
  isEnd?: boolean;
  flow?: string;
  symptoms?: string[];
  mood?: string[];
  notes?: string;
};

export type Streak = { start: Date; end: Date };

// Mirrors MAX_MANUAL_PERIOD_LENGTH in backend/src/utils/constants.js (also the max a user can
// manually enter for period length in cycle-length-question.tsx) — the ceiling used below for how
// far a still-open (not yet explicitly ended) streak is allowed to stretch. Keep both in sync.
const MAX_PLAUSIBLE_PERIOD_LENGTH = 14;

/**
 * Groups marked days into runs — each run is one logged period. Exported so prediction.tsx's
 * "Cycle History" can build its list from the same grouping this file uses for
 * averageCycleLength/averagePeriodDuration, instead of keeping a second copy of this logic.
 *
 * An **explicit end day (`entry.isEnd`) is the authoritative boundary** between one run and the
 * next — once hit, the next day always starts a new run, no matter how close in time. Until a
 * run has an explicit end, a later day still joins it as long as it's within
 * MAX_PLAUSIBLE_PERIOD_LENGTH of the run's *start* (not its last day, so a few small gaps in a
 * row can't chain into something implausibly long).
 *
 * This used to require every day to be exactly one calendar day after the last to count as the
 * same run — which meant recording an end day before circling back to fill in a skipped day in
 * between (e.g. marking the 14th, then jumping straight to the 18th as End day before ever
 * entering the 15th-17th) read as two separate periods instead of one, corrupting
 * averageCycleLength and the "Cycle History" list until the gap was filled in. Mirrors the same
 * fix in backend/src/services/cycleCacheService.js's groupIntoEpisodes — keep both in sync.
 */
export function getPeriodStreaks(entries: Record<string, PeriodDayEntry>): Streak[] {
  const sorted = Object.values(entries).sort((a, b) => a.date.getTime() - b.date.getTime());

  const streaks: (Streak & { hasExplicitEnd: boolean })[] = [];
  for (const entry of sorted) {
    const current = streaks[streaks.length - 1];
    const joinsCurrent = current && !current.hasExplicitEnd && daysBetween(current.start, entry.date) <= MAX_PLAUSIBLE_PERIOD_LENGTH;

    if (joinsCurrent) {
      current.end = entry.date;
    } else {
      streaks.push({ start: entry.date, end: entry.date, hasExplicitEnd: false });
    }

    if (entry.isEnd) streaks[streaks.length - 1].hasExplicitEnd = true;
  }

  return streaks.map(({ start, end }) => ({ start, end }));
}

type ProfileHydrationResponse = {
  age: number | null;
  onboarding: { isBeginner: boolean; firstQuestionAsked: boolean };
  cycle: { manualCycleLength: number | null; manualPeriodLength: number | null };
};

type RecordHydrationResponse = {
  date: string;
  isPeriodDay: boolean;
  isPeriodEnd: boolean;
  flowLevel: string | null;
  symptoms: string[];
  mood: string[];
  notes: string;
}[];

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
   * True once `periodEntries`/onboarding flags have been loaded from the backend for the
   * signed-in user (or that load failed and we're proceeding local-only) — false only for the
   * brief window right after sign-in. Screens that would otherwise flash a "first-time" layout
   * before real history arrives (Home) should gate on this.
   */
  hydrated: boolean;
  /**
   * Re-runs the backend hydration load without needing `user` itself to change. Needed
   * for exactly one case: a freshly-registered account hydrates *before* email
   * verification is possible (see the effect below's EMAIL_NOT_VERIFIED handling), so
   * nothing before then can retry it. verify-email.tsx calls this the moment the user
   * confirms they've verified, so Home/Calendar show real data immediately instead of
   * only picking it up on next app launch.
   */
  refreshHydration: () => void;
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
   * been marked. Whichever screen wrote it (Path A/B setup, Calendar, record.tsx) doesn't
   * matter; this always reflects the latest contiguous run of marked days. checkin.tsx
   * deliberately never marks a day here on its own — see its own doc comment.
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
   * the other, instead of each screen holding its own disconnected copy. Hydrated from
   * `GET /api/menstrual/records` on sign-in, then kept live locally as the optimistic source of
   * truth for the UI (see `commitDays` for how edits actually reach the backend).
   */
  periodEntries: Record<string, PeriodDayEntry>;
  /** Tapping a day marks/unmarks it directly — no separate confirm step. Un-marking deletes the backend record immediately (see `commitDays` for why marking itself doesn't sync right away). */
  togglePeriodDay: (date: Date) => void;
  /** Idempotent mark — unlike togglePeriodDay, safe to call on a day that may already be marked (bulk range-add). */
  markPeriodDay: (date: Date) => void;
  /** Flags one specific day as the end of the period — marks it if it isn't already, and un-flags any other day. */
  setPeriodEndDay: (date: Date) => void;
  updatePeriodDayEntry: (date: Date, patch: Partial<Omit<PeriodDayEntry, 'date'>>) => void;
  /**
   * The actual sync point with the backend — every write screen calls this once, at its own
   * explicit "Save"/"Record"/"Done" action, with the day(s) it just finished editing and its own
   * `source` tag. Deliberately not fired from the individual local setters above: those get
   * called on every single tap while a day's still being edited (each symptom chip, each mood
   * chip...), and a network call per tap would be both wasteful and, on a flaky connection,
   * visibly laggy for something that's supposed to feel instant. POSTs to
   * `/api/menstrual/records/batch` (works fine for a single day too — `records` just has one
   * entry) so every write screen goes through one shared codepath and one shared 409-locked-day
   * error shape. Rejects (doesn't swallow) so the calling screen can Alert the user on failure —
   * most likely a locked past-month day the client-side check missed a race on.
   */
  commitDays: (entries: CommitDayEntry[], source: RecordSource) => Promise<void>;
};

const AppStateContext = createContext<AppStateValue | null>(null);

/**
 * Session state for "has the user done X yet" flags, the cycle profile derived from them, and
 * the period days actually entered — hydrated from the backend on sign-in (see the effect below)
 * and kept live locally from there, so Home, the guided recorder, the Calendar tab, and the
 * check-in/record modals all read and edit the same live data instead of each hardcoding its own
 * mock. Local edits are optimistic (applied to state immediately); `commitDays` and the
 * `setAverageCycleLength`/`setAveragePeriodDuration`/`setIsBeginner` setters below are what
 * actually persist them — see each one's own doc comment for why the sync point is where it is.
 */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [firstQuestionAsked, setFirstQuestionAsked] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  // Bumped by refreshHydration() to force the effect below to re-run against the same
  // `user` — see that function's own doc comment on AppStateValue for why plain `user`
  // isn't enough on its own.
  const [hydrationTrigger, setHydrationTrigger] = useState(0);
  const [periodEntries, setPeriodEntries] = useState<Record<string, PeriodDayEntry>>({});
  const [userAge, setUserAgeState] = useState<number | null>(null);
  const [isBeginner, setIsBeginnerState] = useState(false);
  // Manual estimates — used until there's enough real history to calculate the real thing.
  const [manualCycleLength, setManualCycleLength] = useState(DEFAULT_CYCLE_LENGTH);
  const [manualPeriodDuration, setManualPeriodDuration] = useState(DEFAULT_PERIOD_DURATION);

  const firstPeriodRecorded = Object.keys(periodEntries).length > 0;

  // Loads whatever this user already has saved server-side the moment they're signed in — so a
  // returning user sees their real cycle data on Home/Calendar instead of a blank slate that then
  // "catches up" mid-session. Re-runs (and clears down to the blank slate first) on every change
  // of `user`, including sign-out, so a second account signing in on the same device never shows
  // a flash of the previous account's data.
  useEffect(() => {
    if (!user) {
      setHydrated(false);
      setPeriodEntries({});
      setIsBeginnerState(false);
      setManualCycleLength(DEFAULT_CYCLE_LENGTH);
      setManualPeriodDuration(DEFAULT_PERIOD_DURATION);
      setUserAgeState(null);
      setFirstQuestionAsked(false);
      return;
    }

    let cancelled = false;
    (async () => {
      // Registering fires this effect the instant Firebase's own sign-up succeeds — completely
      // independently of auth-context.tsx's register() still awaiting its own separate
      // POST /auth/register call, the one that actually creates the matching Mongo user doc.
      // A GET here can land in that gap and 404 with "No account found for this token —
      // register first" even though registration is genuinely still in progress a moment
      // behind, not actually failed. Retrying a few times with a short pause closes that race
      // without the two contexts needing to coordinate directly — self-heals on whichever
      // attempt lands after /auth/register finishes, almost always the very next one.
      const MAX_ATTEMPTS = 5;
      const RETRY_DELAY_MS = 600;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        if (cancelled) return;
        try {
          const [profile, records] = await Promise.all([
            // quiet: true on both — a failed attempt here is expected and self-handled by this
            // retry loop (see the comment above), not something that should pop LogBox's
            // red-screen overlay on every single attempt. The catch block below still logs a
            // real console.error itself once retries are actually exhausted.
            apiRequest<ProfileHydrationResponse>('/profile/me', { quiet: true }),
            apiRequest<RecordHydrationResponse>('/menstrual/records', { quiet: true }),
          ]);
          if (cancelled) return;

          setIsBeginnerState(profile.onboarding.isBeginner);
          if (profile.onboarding.firstQuestionAsked) setFirstQuestionAsked(true);
          if (profile.cycle.manualCycleLength != null) setManualCycleLength(profile.cycle.manualCycleLength);
          if (profile.cycle.manualPeriodLength != null) setManualPeriodDuration(profile.cycle.manualPeriodLength);
          setUserAgeState(profile.age);

          const entries: Record<string, PeriodDayEntry> = {};
          // Only real period days belong in periodEntries — GET /menstrual/records also returns
          // Check-in's isPeriodDay:false wellness-only logs (symptoms/mood on an ordinary day),
          // which must NOT be hydrated in here or they'd silently start counting as period days
          // (firstPeriodRecorded, streaks, averageCycleLength) the next time the app signs back
          // in, even though the same-session write correctly kept them out. See checkin.tsx.
          for (const r of records.filter((r) => r.isPeriodDay)) {
            const date = parseIsoDate(r.date);
            entries[dateKey(date)] = {
              date,
              isEnd: r.isPeriodEnd || undefined,
              flow: r.flowLevel ?? undefined,
              symptoms: r.symptoms ?? [],
              mood: r.mood ?? [],
              notes: r.notes || undefined,
            };
          }
          setPeriodEntries(entries);
          break;
        } catch (err) {
          const stillRegistering = err instanceof Error && err.message.includes('No account found');
          if (stillRegistering && attempt < MAX_ATTEMPTS) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
            continue;
          }
          // Expected, not a bug: a freshly-registered account is signed in to Firebase
          // (so `user` is set and this effect fires) but hasn't clicked the email
          // verification link yet, so authMiddleware.js rejects every request with this
          // until they do. Retrying won't help within this mount's lifetime — only
          // verify-email.tsx's refreshHydration() call, once they've actually verified,
          // will. A plain console.log (not .error) so this expected, common state
          // doesn't pop LogBox's red "crash" overlay on every fresh sign-up.
          if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') {
            console.log('[app-state] skipping hydration — email not verified yet');
            break;
          }
          // Backend unreachable, or genuinely out of retries — fall back to starting from a
          // blank local session rather than blocking the app on it. Whatever the user enters
          // this session still works locally; commitDays below will simply keep failing to
          // persist until the backend's reachable again.
          console.error('[app-state] failed to hydrate from backend, starting from a blank local session:', err);
          break;
        }
      }

      if (!cancelled) setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, hydrationTrigger]);

  const streaks = useMemo(() => getPeriodStreaks(periodEntries), [periodEntries]);

  /**
   * Automatic Learning Logic: Cycle Length is Start Date → next Start Date, so as soon as a
   * *second* period's start date exists this is measurable exactly — no averaging needed, no
   * End Date needed. From a third period onward, each new start date folds into a rolling
   * average of the real start-to-start gaps so far, so the estimate keeps tracking the user's
   * actual pattern rather than freezing at whatever the first real cycle happened to be. Mirrors
   * the backend's own cycleCacheService.js recomputation, so this local estimate and the
   * server's cached one should never meaningfully disagree.
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
    const existed = !!periodEntries[key];
    setPeriodEntries((prev) => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: { date, symptoms: [], mood: [] } };
    });
    // Un-marking is always a deliberate, standalone action (the ✕ in "Recorded Days") — unlike
    // marking (which only really "counts" once a screen's own commitDays fires, see that
    // method's doc comment), there's no separate confirm step coming later for a delete, so this
    // syncs immediately rather than waiting for one.
    if (existed) {
      apiRequest(`/menstrual/records/${isoDate(date)}`, { method: 'DELETE' }).catch((err) => {
        console.error(`[app-state] failed to delete backend record for ${isoDate(date)}:`, err);
      });
    }
  };

  const markPeriodDay = (date: Date) => {
    const key = dateKey(date);
    setPeriodEntries((prev) => (prev[key] ? prev : { ...prev, [key]: { date, symptoms: [], mood: [] } }));
  };

  const setPeriodEndDay = (date: Date) => {
    const key = dateKey(date);
    setPeriodEntries((prev) => {
      const next: Record<string, PeriodDayEntry> = { ...prev, [key]: prev[key] ?? { date, symptoms: [], mood: [] } };
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

  const commitDays = async (entries: CommitDayEntry[], source: RecordSource) => {
    if (entries.length === 0) return;
    await apiRequest('/menstrual/records/batch', {
      method: 'POST',
      body: {
        source,
        records: entries.map((e) => ({
          date: isoDate(e.date),
          isPeriodDay: e.isPeriodDay ?? true,
          isPeriodEnd: !!e.isEnd,
          flow: e.flow || undefined,
          symptoms: e.symptoms ?? [],
          mood: e.mood ?? [],
          notes: e.notes || undefined,
        })),
      },
    });
  };

  /**
   * Backs setIsBeginner/setAverageCycleLength/setAveragePeriodDuration below — fires
   * PUT /api/menstrual/cycle-setup in the background so none of onboarding's three screens
   * (last-period-one-date.tsx, last-period-unknown.tsx, record-first-period.tsx) need to
   * remember to call it themselves on top of the local setter they already call.
   */
  const syncCycleSetup = (patch: { isBeginner?: boolean; manualCycleLength?: number; manualPeriodLength?: number }) => {
    apiRequest('/menstrual/cycle-setup', { method: 'PUT', body: patch }).catch((err) => {
      console.error('[app-state] failed to sync cycle-setup to backend:', err, patch);
    });
  };

  const value = useMemo<AppStateValue>(
    () => ({
      firstPeriodRecorded,
      firstQuestionAsked,
      markFirstQuestionAsked: () => setFirstQuestionAsked(true),
      hydrated,
      refreshHydration: () => setHydrationTrigger((n) => n + 1),
      userAge,
      setUserAge: (age: number) => setUserAgeState(age),
      isBeginner,
      setIsBeginner: (value: boolean) => {
        setIsBeginnerState(value);
        syncCycleSetup({ isBeginner: value });
      },
      averageCycleLength,
      setAverageCycleLength: (days: number) => {
        setManualCycleLength(days);
        syncCycleSetup({ manualCycleLength: days });
      },
      averagePeriodDuration,
      setAveragePeriodDuration: (days: number) => {
        setManualPeriodDuration(days);
        syncCycleSetup({ manualPeriodLength: days });
      },
      lastPeriodStartDate,
      nextPeriodStartDate,
      periodEntries,
      togglePeriodDay,
      markPeriodDay,
      setPeriodEndDay,
      updatePeriodDayEntry,
      commitDays,
    }),
    [
      firstPeriodRecorded,
      firstQuestionAsked,
      hydrated,
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

const { computeCycleUpdate, groupIntoEpisodes, validatePeriodDayConsistency } = require("./cycleCacheService");

/** Builds a fake MenstrualRecord — computeCycleUpdate/groupIntoEpisodes only ever read `.date`
 *  and `.isPeriodEnd`, so that's all this needs (no Mongo document required). */
function rec(y, m, d, isPeriodEnd = false) {
  return { date: new Date(y, m - 1, d), isPeriodEnd };
}

function daysDiff(a, b) {
  return Math.round((b - a) / 86400000);
}

describe("groupIntoEpisodes", () => {
  it("groups a gap-free, explicitly-ended run into one episode", () => {
    const episodes = groupIntoEpisodes([rec(2026, 8, 14), rec(2026, 8, 15), rec(2026, 8, 16), rec(2026, 8, 17), rec(2026, 8, 18, true)]);
    expect(episodes).toHaveLength(1);
    expect(episodes[0].start).toEqual(new Date(2026, 7, 14));
    expect(episodes[0].end).toEqual(new Date(2026, 7, 18));
    expect(episodes[0].hasExplicitEnd).toBe(true);
  });

  it("still groups as one episode even with unlogged days in between, as long as the end day is explicit (regression: used to require exact day-adjacency)", () => {
    // Only the 14th and 18th were ever entered — 15th/16th/17th never individually logged.
    const episodes = groupIntoEpisodes([rec(2026, 8, 14), rec(2026, 8, 18, true)]);
    expect(episodes).toHaveLength(1);
    expect(episodes[0].start).toEqual(new Date(2026, 7, 14));
    expect(episodes[0].end).toEqual(new Date(2026, 7, 18));
  });

  it("starts a brand new episode immediately after an explicit end, regardless of gap size", () => {
    const episodes = groupIntoEpisodes([rec(2026, 8, 1, true), rec(2026, 8, 2)]);
    expect(episodes).toHaveLength(2);
  });

  it("keeps two periods within the same calendar month separate when far enough apart (Case D)", () => {
    const episodes = groupIntoEpisodes([rec(2026, 8, 1, true), rec(2026, 8, 22)]);
    expect(episodes).toHaveLength(2);
    expect(episodes[0].start).toEqual(new Date(2026, 7, 1));
    expect(episodes[1].start).toEqual(new Date(2026, 7, 22));
  });

  it("does not let an un-ended episode stretch implausibly long across a genuinely separate later period", () => {
    // 14th logged, never explicitly ended, then a completely unrelated period 40 days later.
    const episodes = groupIntoEpisodes([rec(2026, 8, 14), rec(2026, 9, 23)]);
    expect(episodes).toHaveLength(2);
  });
});

describe("computeCycleUpdate", () => {
  it("returns the null/default state when there's no history and no manual input at all", () => {
    const update = computeCycleUpdate([], null, null);
    expect(update).toEqual({
      averageCycleLength: 28,
      averagePeriodLength: 5,
      lastPeriodStart: null,
      lastPeriodEnd: null,
      nextPeriodStart: null,
      nextPeriodEnd: null,
      fertileWindowStart: null,
      fertileWindowEnd: null,
    });
  });

  it("uses the manual onboarding answers instead of the 28/5 defaults when no real history exists yet", () => {
    const update = computeCycleUpdate([], 32, 7);
    expect(update.averageCycleLength).toBe(32);
    expect(update.averagePeriodLength).toBe(7);
  });

  it("a single real logged period overrides manual period length once it's explicitly ended, but not cycle length (needs 2+ starts)", () => {
    const update = computeCycleUpdate([rec(2026, 8, 14), rec(2026, 8, 20, true)], 32, 7);
    // Only one episode exists → still no real start-to-start gap → cycle length stays the manual seed.
    expect(update.averageCycleLength).toBe(32);
    // But the period WAS explicitly ended (Aug14 -> Aug20 = 7 days), so its real length is used —
    // matches the manual answer here by coincidence; the next test checks a *disagreeing* manual value.
    expect(update.averagePeriodLength).toBe(7);
  });

  it("real logged period length overrides a manual answer that disagrees with it", () => {
    // User said periods run 5 days, but this one was explicitly logged as 3 (Aug14-16).
    const update = computeCycleUpdate([rec(2026, 8, 14), rec(2026, 8, 15), rec(2026, 8, 16, true)], 28, 5);
    expect(update.averagePeriodLength).toBe(3);
  });

  // Case A: Early Period Entry (Short Cycle / Health Shift)
  describe("Case A — early period logged mid-cycle", () => {
    it("immediately resets lastPeriodStart to the new date and recomputes averageCycleLength from the real gap", () => {
      // A prior period started Jul 1. The user logs a brand new start on Jul 22 — 21 days later,
      // well short of whatever average was previously assumed.
      const update = computeCycleUpdate([rec(2026, 7, 1, true), rec(2026, 7, 22)], 32, 5);
      expect(update.lastPeriodStart).toEqual(new Date(2026, 6, 22));
      // Only one gap exists (Jul1 -> Jul22 = 21 days) — with just these 2 episodes, the average
      // *is* that real 21-day gap, not the stale 32-day manual estimate.
      expect(update.averageCycleLength).toBe(21);
    });

    it("recomputes nextPeriodStart from the NEW start date, not the old one", () => {
      const update = computeCycleUpdate([rec(2026, 7, 1, true), rec(2026, 7, 22)], 32, 5);
      // 21-day average, from the new Jul 22 start → Aug 12, not from the old Jul 1 start.
      expect(update.nextPeriodStart).toEqual(new Date(2026, 7, 12));
    });
  });

  // Case B: Late Period (Overdue Prediction) — verified at the currentCycleDay/cyclePhase level
  // in predictionService.test.js; computeCycleUpdate's own contract is simply that it never
  // mutates lastPeriodStart/nextPeriodStart on its own just because "today" has moved past it —
  // only a new logged record does that.
  describe("Case B — overdue, nothing new logged", () => {
    it("leaves lastPeriodStart/nextPeriodStart exactly as last computed, however much time has passed", () => {
      const records = [rec(2026, 7, 1, true), rec(2026, 7, 5)];
      const update = computeCycleUpdate(records, 28, 5);
      // Calling this again with the exact same records (i.e. "today" moved on, nothing new
      // logged) must be a no-op — same output both times.
      expect(computeCycleUpdate(records, 28, 5)).toEqual(update);
    });
  });

  // Case C: Variable Period End Date Logging
  describe("Case C — period ends later than the predicted default", () => {
    it("keeps nextPeriodStart unchanged when the end day moves, and updates averagePeriodLength for future predictions", () => {
      const startOnly = computeCycleUpdate([rec(2026, 8, 1)], 28, 5);
      const endedOnDay7 = computeCycleUpdate(
        [rec(2026, 8, 1), rec(2026, 8, 2), rec(2026, 8, 3), rec(2026, 8, 4), rec(2026, 8, 5), rec(2026, 8, 6), rec(2026, 8, 7, true)],
        28,
        5,
      );
      // Same start date → same predicted next start, regardless of how long the period actually ran.
      expect(startOnly.nextPeriodStart).toEqual(endedOnDay7.nextPeriodStart);
      // But the real 7-day length is now known and feeds nextPeriodEnd going forward.
      expect(endedOnDay7.averagePeriodLength).toBe(7);
      expect(daysDiff(endedOnDay7.nextPeriodStart, endedOnDay7.nextPeriodEnd)).toBe(6);
    });
  });

  // Case D: Consecutive Short/Long Cycles in the Same Calendar Month
  describe("Case D — two periods logged within the same calendar month", () => {
    it("treats the second one as a brand new cycle, not a duplicate/merged episode", () => {
      const update = computeCycleUpdate([rec(2026, 8, 1, true), rec(2026, 8, 22)], 28, 5);
      expect(update.lastPeriodStart).toEqual(new Date(2026, 7, 22));
      expect(update.averageCycleLength).toBe(21); // Aug1 -> Aug22
    });
  });

  it("averages cycle length across more than 2 episodes, not just the most recent gap", () => {
    // Gaps: Jun1->Jul1 = 30, Jul1->Aug1 = 31 (see the dateHelper test for why July isn't 28/30).
    const update = computeCycleUpdate([rec(2026, 6, 1, true), rec(2026, 7, 1, true), rec(2026, 8, 1)], null, null);
    expect(update.averageCycleLength).toBe(Math.round((30 + 31) / 2));
  });
});

/** An incoming period-day write, same date shape as rec() plus the isPeriodDay flag the real
 *  request body always carries. */
function incomingDay(y, m, d, isPeriodEnd = false) {
  return { date: new Date(y, m - 1, d), isPeriodDay: true, isPeriodEnd };
}

// PERIOD-004: Calendar's day-by-day editor writes one day at a time, in *separate* requests —
// `existing` below is what's already saved (built the same way recomputeCycleCache groups
// history); `incoming` is what this write is trying to add. That within-one-request-only check
// is menstrualValidators.test.js's batchUpsertRecordSchema tests, a deliberately different check.
describe("validatePeriodDayConsistency", () => {
  describe("an end day before an already-open period's start", () => {
    it("❌ rejects it", () => {
      // Sep 5-7 already saved as an open period (no end yet); Sep 3 now marked as End day.
      const existing = [rec(2026, 9, 5), rec(2026, 9, 6), rec(2026, 9, 7)];
      expect(validatePeriodDayConsistency(existing, [incomingDay(2026, 9, 3, true)])).toMatch(/end date can't be before the start/i);
    });

    it("✅ accepts the normal flow: end day is the last day of its own still-open period", () => {
      const existing = [rec(2026, 9, 5), rec(2026, 9, 6)];
      expect(validatePeriodDayConsistency(existing, [incomingDay(2026, 9, 7, true)])).toBeNull();
    });

    it("✅ accepts a single-day period (start and end are the same day, nothing saved yet)", () => {
      expect(validatePeriodDayConsistency([], [incomingDay(2026, 9, 5, true)])).toBeNull();
    });

    it("✅ accepts a new, isolated end day once the previous period was already properly closed", () => {
      // Aug 20-24 already closed and saved; Sep 3 is a separate short period, not a conflict.
      const existing = [rec(2026, 8, 20), rec(2026, 8, 24, true)];
      expect(validatePeriodDayConsistency(existing, [incomingDay(2026, 9, 3, true)])).toBeNull();
    });

    // Regression: an earlier draft of this check compared a closed episode's end against the
    // *regrouped, full* picture's next episode — which is true by construction for ANY two
    // chronologically-ordered episodes, so it wrongly rejected the ordinary, very common case of
    // "I've had a period before, and I'm currently on my period now."
    it("✅ does not misfire on a past closed period + a currently open one — adding a day to the open period", () => {
      const existing = [
        rec(2026, 8, 20),
        rec(2026, 8, 21),
        rec(2026, 8, 22),
        rec(2026, 8, 23),
        rec(2026, 8, 24, true), // closed
        rec(2026, 9, 20),
        rec(2026, 9, 21),
        rec(2026, 9, 22), // currently open, no end yet
      ];
      // Just extending the already-open Sep period by one more day — nothing to reject.
      expect(validatePeriodDayConsistency(existing, [incomingDay(2026, 9, 23)])).toBeNull();
    });
  });

  it("✅ is a no-op with nothing saved and nothing incoming", () => {
    expect(validatePeriodDayConsistency([], [])).toBeNull();
  });
});

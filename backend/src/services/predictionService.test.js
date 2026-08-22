const { predictNextCycle, buildPhases, cyclePhase, currentCycleDay } = require("./predictionService");

describe("currentCycleDay — formula 1: floor((today - latestPeriodStart) / 86400000) + 1", () => {
  it("is Day 1 on the start date itself", () => {
    expect(currentCycleDay(new Date(2026, 7, 1), new Date(2026, 7, 1))).toBe(1);
  });

  it("counts forward correctly mid-cycle", () => {
    expect(currentCycleDay(new Date(2026, 7, 1), new Date(2026, 7, 15))).toBe(15);
  });

  it("is null when there's no lastPeriodStart yet (nothing ever logged)", () => {
    expect(currentCycleDay(null, new Date())).toBeNull();
  });

  // Case B: Late Period — today is past the predicted next start, nothing new logged.
  it("keeps counting past averageCycleLength instead of capping/resetting/erroring (Case B)", () => {
    // A 30-day-average user, still on their ORIGINAL start date 35 days later — Day 35, not
    // Day 5 of a phantom new cycle, not an error, not negative.
    const day = currentCycleDay(new Date(2026, 6, 1), new Date(2026, 6, 1 + 34));
    expect(day).toBe(35);
    expect(day).toBeGreaterThan(0);
  });

  it("ignores time-of-day on both inputs (normalizes to midnight)", () => {
    const start = new Date(2026, 7, 1, 23, 0, 0);
    const today = new Date(2026, 7, 2, 1, 0, 0);
    // Only 2 hours apart in wall-clock time, but a different calendar day — should read as Day 2.
    expect(currentCycleDay(start, today)).toBe(2);
  });
});

describe("predictNextCycle", () => {
  const base = { lastPeriodStart: new Date(2026, 7, 1), averageCycleLength: 30, averagePeriodLength: 6 };

  it("returns null when there's no lastPeriodStart (nothing logged yet)", () => {
    expect(predictNextCycle({ lastPeriodStart: null, averageCycleLength: 28, averagePeriodLength: 5 })).toBeNull();
  });

  // Formula 2: Next Period Start = latestPeriodStart + userAverageCycleLength
  it("computes Next Period Start as start + cycle length, exactly", () => {
    const { nextPeriodStart } = predictNextCycle(base);
    expect(nextPeriodStart).toEqual(new Date(2026, 7, 31)); // Aug 1 + 30 days
  });

  it("Next Period Start never depends on averagePeriodLength", () => {
    const short = predictNextCycle({ ...base, averagePeriodLength: 2 });
    const long = predictNextCycle({ ...base, averagePeriodLength: 12 });
    expect(short.nextPeriodStart).toEqual(long.nextPeriodStart);
  });

  // Formula 3: Next Period End = nextPeriodStart + (userAveragePeriodLength - 1)
  it("computes Next Period End as nextPeriodStart + (period length - 1)", () => {
    const { nextPeriodStart, nextPeriodEnd } = predictNextCycle(base);
    expect(daysDiff(nextPeriodStart, nextPeriodEnd)).toBe(5); // 6-day period spans 5 days after its start
  });

  // Formula 5: Ovulation Date = nextPeriodStart - 14 days
  it("places ovulation exactly 14 days before Next Period Start, scaling with cycle length", () => {
    const shortCycle = predictNextCycle({ ...base, averageCycleLength: 21 });
    const longCycle = predictNextCycle({ ...base, averageCycleLength: 40 });
    expect(daysDiff(shortCycle.fertileWindowEnd, shortCycle.nextPeriodStart)).toBe(14);
    expect(daysDiff(longCycle.fertileWindowEnd, longCycle.nextPeriodStart)).toBe(14);
    // The actual calendar dates must differ — a longer cycle means a later ovulation date.
    expect(longCycle.fertileWindowEnd.getTime()).toBeGreaterThan(shortCycle.fertileWindowEnd.getTime());
  });

  // Formula 6: Fertile Window = [Ovulation Date - 4 days] to Ovulation Date
  it("computes a 5-day fertile window ending exactly on ovulation day", () => {
    const { fertileWindowStart, fertileWindowEnd } = predictNextCycle(base);
    expect(daysDiff(fertileWindowStart, fertileWindowEnd)).toBe(4);
  });

  it("regression: fertile window must actually shift when cycle length changes (previous formula canceled it out to a constant)", () => {
    const cycle28 = predictNextCycle({ ...base, averageCycleLength: 28 });
    const cycle35 = predictNextCycle({ ...base, averageCycleLength: 35 });
    const shiftDays = daysDiff(cycle28.fertileWindowStart, cycle35.fertileWindowStart);
    // A 7-day-longer cycle must push the whole fertile window 7 days later, not 0.
    expect(shiftDays).toBe(7);
  });
});

describe("buildPhases", () => {
  it("defaults to 28/5 when called with no arguments", () => {
    const phases = buildPhases();
    expect(phases.find((p) => p.key === "menstrual")).toEqual({ key: "menstrual", label: "Menstrual phase", start: 1, end: 5 });
  });

  it("scales every boundary with a non-default cycle/period length", () => {
    const phases = buildPhases(35, 7);
    const menstrual = phases.find((p) => p.key === "menstrual");
    const luteal = phases.find((p) => p.key === "luteal");
    expect(menstrual.end).toBe(7); // matches averagePeriodLength, not the 5-day default
    expect(luteal.end).toBe(35); // matches averageCycleLength, not the 28-day default
  });

  it("never returns an inverted (end < start) phase range", () => {
    // A deliberately extreme combination: long period relative to a short cycle.
    for (const phase of buildPhases(21, 10)) {
      expect(phase.end).toBeGreaterThanOrEqual(phase.start);
    }
  });

  it("floors an unrealistic/corrupt cycle length at 20 rather than producing negative ranges", () => {
    const phases = buildPhases(1, 5);
    for (const phase of phases) {
      expect(phase.start).toBeGreaterThanOrEqual(1);
      expect(phase.end).toBeGreaterThanOrEqual(phase.start);
    }
  });
});

describe("cyclePhase", () => {
  it("returns Menstrual on day 1", () => {
    expect(cyclePhase(1, 28, 5)).toBe("Menstrual phase");
  });

  // Case A: an early/short cycle should read as Menstrual immediately once cycleDay resets to 1
  // — same assertion as above, phrased for that scenario.
  it("reads Menstrual the instant cycleDay resets to 1, regardless of the previous cycle's phase", () => {
    expect(cyclePhase(1, 32, 5)).toBe("Menstrual phase");
  });

  // Case B: Late period — day number exceeds every phase's range.
  it("falls back to the last phase (Luteal) instead of crashing/returning undefined when the day is past averageCycleLength", () => {
    expect(cyclePhase(35, 30, 5)).toBe("Luteal phase");
  });
});

function daysDiff(a, b) {
  return Math.round((b - a) / 86400000);
}

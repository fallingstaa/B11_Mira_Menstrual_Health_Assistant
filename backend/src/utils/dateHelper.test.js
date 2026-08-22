const { toDayKey, daysBetween, isValidDateString, isSameMonth, isPastMonth } = require("./dateHelper");

describe("toDayKey", () => {
  it("normalizes a date-with-time to UTC midnight", () => {
    const d = toDayKey(new Date(2026, 7, 14, 23, 59, 59));
    expect(d.getUTCHours()).toBe(0);
    expect(d.getUTCMinutes()).toBe(0);
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(7);
    expect(d.getUTCDate()).toBe(14);
  });

  it("parses a YYYY-MM-DD string the same way", () => {
    const d = toDayKey("2026-08-14");
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(7);
    expect(d.getUTCDate()).toBe(14);
  });
});

describe("daysBetween", () => {
  it("counts whole days forward", () => {
    expect(daysBetween(new Date(2026, 7, 1), new Date(2026, 7, 15))).toBe(14);
  });

  it("counts whole days backward as negative", () => {
    expect(daysBetween(new Date(2026, 7, 15), new Date(2026, 7, 1))).toBe(-14);
  });

  it("is 0 for the same day", () => {
    expect(daysBetween(new Date(2026, 7, 1), new Date(2026, 7, 1))).toBe(0);
  });

  it("handles a month boundary correctly (July has 31 days, not 30 or 28)", () => {
    expect(daysBetween(new Date(2026, 6, 1), new Date(2026, 7, 1))).toBe(31);
  });

  it("handles a year boundary correctly", () => {
    expect(daysBetween(new Date(2026, 11, 20), new Date(2027, 0, 5))).toBe(16);
  });
});

describe("isValidDateString", () => {
  it("accepts a well-formed date string", () => {
    expect(isValidDateString("2026-08-14")).toBe(true);
  });

  it("rejects garbage", () => {
    expect(isValidDateString("not-a-date")).toBe(false);
  });

  it("rejects non-strings (e.g. a Date object slipping through)", () => {
    expect(isValidDateString(new Date())).toBe(false);
  });
});

describe("isSameMonth", () => {
  it("is true for two dates in the same month/year", () => {
    expect(isSameMonth(new Date(2026, 7, 1), new Date(2026, 7, 31))).toBe(true);
  });

  it("is false across a month boundary", () => {
    expect(isSameMonth(new Date(2026, 7, 31), new Date(2026, 8, 1))).toBe(false);
  });

  it("is false across a year boundary even if the month number matches", () => {
    expect(isSameMonth(new Date(2025, 7, 15), new Date(2026, 7, 15))).toBe(false);
  });
});

describe("isPastMonth", () => {
  it("is true when date's month/year is strictly before today's", () => {
    expect(isPastMonth(new Date(2026, 6, 15), new Date(2026, 7, 1))).toBe(true);
  });

  it("is false for the current month itself", () => {
    expect(isPastMonth(new Date(2026, 7, 1), new Date(2026, 7, 31))).toBe(false);
  });

  it("is false for a future month", () => {
    expect(isPastMonth(new Date(2026, 8, 1), new Date(2026, 7, 15))).toBe(false);
  });

  it("is true across a year boundary (Dec of last year is a past month relative to Jan this year)", () => {
    expect(isPastMonth(new Date(2025, 11, 31), new Date(2026, 0, 1))).toBe(true);
  });
});

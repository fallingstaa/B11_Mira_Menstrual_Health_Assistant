const { cycleSetupSchema, batchUpsertRecordSchema } = require("./menstrualValidators");

const accepts = (input) => cycleSetupSchema.safeParse(input).success;

const acceptsBatch = (records) => batchUpsertRecordSchema.safeParse({ source: "record", records }).success;

describe("UT-003 — cycleSetupSchema length boundaries", () => {
  describe("manualCycleLength (21–45, whole numbers)", () => {
    it("accepts 21 (lower boundary)", () => {
      expect(accepts({ manualCycleLength: 21 })).toBe(true);
    });

    it("accepts 45 (upper boundary)", () => {
      expect(accepts({ manualCycleLength: 45 })).toBe(true);
    });

    it("rejects 20 (just below the lower boundary)", () => {
      expect(accepts({ manualCycleLength: 20 })).toBe(false);
    });

    it("rejects 46 (just above the upper boundary)", () => {
      expect(accepts({ manualCycleLength: 46 })).toBe(false);
    });

    it("rejects 28.5 (not a whole number, even though it is in range)", () => {
      expect(accepts({ manualCycleLength: 28.5 })).toBe(false);
    });
  });

  describe("manualPeriodLength (1–14, whole numbers)", () => {
    it("accepts 1 (lower boundary)", () => {
      expect(accepts({ manualPeriodLength: 1 })).toBe(true);
    });

    it("accepts 14 (upper boundary)", () => {
      expect(accepts({ manualPeriodLength: 14 })).toBe(true);
    });

    it("rejects 0 (just below the lower boundary)", () => {
      expect(accepts({ manualPeriodLength: 0 })).toBe(false);
    });

    it("rejects 15 (just above the upper boundary)", () => {
      expect(accepts({ manualPeriodLength: 15 })).toBe(false);
    });
  });
});

describe("UT-004 — cycleSetupSchema required input", () => {
  it("rejects an empty object (at least one field must be provided)", () => {
    const result = cycleSetupSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts { manualCycleLength: 32 } on its own", () => {
    expect(accepts({ manualCycleLength: 32 })).toBe(true);
  });

  it("does not invent a manualPeriodLength (or any other field) when it was not sent", () => {
    const result = cycleSetupSchema.safeParse({ manualCycleLength: 32 });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ manualCycleLength: 32 });
    expect(result.data).not.toHaveProperty("manualPeriodLength");
  });
});

describe("PERIOD-004 — batchUpsertRecordSchema rejects an end date before the start date", () => {
  it("❌ rejects Start 05 Sep / End 01 Sep", () => {
    expect(
      acceptsBatch([
        { date: "2026-09-05", isPeriodDay: true },
        { date: "2026-09-04", isPeriodDay: true },
        { date: "2026-09-03", isPeriodDay: true },
        { date: "2026-09-02", isPeriodDay: true },
        { date: "2026-09-01", isPeriodDay: true, isPeriodEnd: true },
      ]),
    ).toBe(false);
  });

  it("✅ accepts Start 05 Sep / End 05 Sep (a single-day period)", () => {
    expect(acceptsBatch([{ date: "2026-09-05", isPeriodDay: true, isPeriodEnd: true }])).toBe(true);
  });

  it("✅ accepts Start 05 Sep / End 07 Sep", () => {
    expect(
      acceptsBatch([
        { date: "2026-09-05", isPeriodDay: true },
        { date: "2026-09-06", isPeriodDay: true },
        { date: "2026-09-07", isPeriodDay: true, isPeriodEnd: true },
      ]),
    ).toBe(true);
  });

  it("reports a clear message, not just a generic validation failure", () => {
    const result = batchUpsertRecordSchema.safeParse({
      source: "record",
      records: [
        { date: "2026-09-05", isPeriodDay: true },
        { date: "2026-09-01", isPeriodDay: true, isPeriodEnd: true },
      ],
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toMatch(/end date can't be before its start date/i);
  });
});

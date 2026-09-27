// Must stay first — registers the Firebase mocks before authMiddleware is loaded.
require("./helpers/mockFirebase");

const request = require("supertest");

const app = require("./helpers/testApp");
const { connectTestDb, clearTestDb, disconnectTestDb } = require("./helpers/testDb");
const { tokenFor, createUser } = require("./helpers/testHelpers");
const MenstrualRecord = require("../../models/MenstrualRecord");

jest.setTimeout(120000);

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

const AS_OF = "asOf=2026-09-25";

/**
 * PERIOD-004 — a period's end date must never be before its start date.
 *
 * These go straight at POST /api/menstrual/records/batch with a raw JSON body — no record.tsx,
 * no app-state.tsx, nothing from the mobile app involved — specifically to prove the backend
 * itself rejects invalid ranges even if a client other than the real app sends them.
 */
describe("PERIOD-004 — Invalid Period Date Range (backend, bypassing the frontend)", () => {
  it("❌ rejects Start 05 Sep / End 01 Sep and saves nothing to MongoDB", async () => {
    const user = await createUser("period004-invalid");

    const res = await request(app)
      .post(`/api/menstrual/records/batch?${AS_OF}`)
      .set("Authorization", tokenFor("period004-invalid"))
      .send({
        source: "record",
        records: [
          { date: "2026-09-05", isPeriodDay: true },
          { date: "2026-09-04", isPeriodDay: true },
          { date: "2026-09-03", isPeriodDay: true },
          { date: "2026-09-02", isPeriodDay: true },
          // The bug: this end day (01 Sep) is earlier than every isPeriodDay day above.
          { date: "2026-09-01", isPeriodDay: true, isPeriodEnd: true },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
    expect(res.body.message).toMatch(/end date can't be before its start date/i);

    // The real point of this test: nothing from the rejected batch ever reached MongoDB.
    expect(await MenstrualRecord.countDocuments({ userId: user._id })).toBe(0);
  });

  it("✅ accepts Start 05 Sep / End 05 Sep (a single-day period)", async () => {
    const user = await createUser("period004-sameday");

    const res = await request(app)
      .post(`/api/menstrual/records/batch?${AS_OF}`)
      .set("Authorization", tokenFor("period004-sameday"))
      .send({
        source: "record",
        records: [{ date: "2026-09-05", isPeriodDay: true, isPeriodEnd: true }],
      });

    expect(res.status).toBe(201);
    const saved = await MenstrualRecord.find({ userId: user._id });
    expect(saved).toHaveLength(1);
    expect(saved[0].isPeriodEnd).toBe(true);
  });

  it("❌ rejects marking an earlier day as End when a later period is already open — Calendar's day-by-day flow, not a single range submission", async () => {
    const user = await createUser("period004-open-period");
    const auth = tokenFor("period004-open-period");

    // Request 1 (e.g. Calendar, several days ago): logs Sep 5-7 as an open period — no end yet.
    for (const date of ["2026-09-05", "2026-09-06", "2026-09-07"]) {
      const res = await request(app)
        .post(`/api/menstrual/records/batch?${AS_OF}`)
        .set("Authorization", auth)
        .send({ source: "calendar", records: [{ date, isPeriodDay: true }] });
      expect(res.status).toBe(201);
    }

    // Request 2 (today, a *separate* request): user taps Sep 3 in Calendar and marks it End day.
    const res = await request(app)
      .post(`/api/menstrual/records/batch?${AS_OF}`)
      .set("Authorization", auth)
      .send({ source: "calendar", records: [{ date: "2026-09-03", isPeriodDay: true, isPeriodEnd: true }] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/end date can't be before the start/i);

    // Nothing from the rejected request reached MongoDB, and the earlier, valid save is untouched.
    const saved = await MenstrualRecord.find({ userId: user._id }).sort({ date: 1 });
    expect(saved.map((r) => r.date.toISOString().slice(0, 10))).toEqual(["2026-09-05", "2026-09-06", "2026-09-07"]);
    expect(saved.every((r) => !r.isPeriodEnd)).toBe(true);
  });

  it("✅ accepts Start 05 Sep / End 07 Sep and saves all 3 days, end day flagged correctly", async () => {
    const user = await createUser("period004-valid");

    const res = await request(app)
      .post(`/api/menstrual/records/batch?${AS_OF}`)
      .set("Authorization", tokenFor("period004-valid"))
      .send({
        source: "record",
        records: [
          { date: "2026-09-05", isPeriodDay: true },
          { date: "2026-09-06", isPeriodDay: true },
          { date: "2026-09-07", isPeriodDay: true, isPeriodEnd: true },
        ],
      });

    expect(res.status).toBe(201);
    const saved = await MenstrualRecord.find({ userId: user._id }).sort({ date: 1 });
    expect(saved).toHaveLength(3);
    expect(saved.map((r) => r.isPeriodEnd)).toEqual([false, false, true]);
  });

  // Regression: an earlier version of this fix compared a closed episode's end against the whole
  // regrouped picture's next episode, which misfired on the ordinary case of "I've had a period
  // before AND I'm on my period right now" — this proves that's fixed, end to end through the
  // real API and a real (in-memory) MongoDB.
  it("✅ does not misfire on a past closed period + a currently open one — extending the open period by a day", async () => {
    const user = await createUser("period004-past-and-current");
    const auth = tokenFor("period004-past-and-current");

    // A period from last month, already closed.
    const past = await request(app)
      .post(`/api/menstrual/records/batch?${AS_OF}`)
      .set("Authorization", auth)
      .send({
        source: "calendar",
        records: [
          { date: "2026-08-20", isPeriodDay: true },
          { date: "2026-08-21", isPeriodDay: true },
          { date: "2026-08-22", isPeriodDay: true, isPeriodEnd: true },
        ],
      });
    expect(past.status).toBe(201);

    // The current period, already logged for a couple of days, still open (no end yet).
    const current = await request(app)
      .post(`/api/menstrual/records/batch?${AS_OF}`)
      .set("Authorization", auth)
      .send({
        source: "calendar",
        records: [
          { date: "2026-09-20", isPeriodDay: true },
          { date: "2026-09-21", isPeriodDay: true },
        ],
      });
    expect(current.status).toBe(201);

    // Just logging one more day of the still-open current period — must not be rejected.
    const res = await request(app)
      .post(`/api/menstrual/records/batch?${AS_OF}`)
      .set("Authorization", auth)
      .send({ source: "calendar", records: [{ date: "2026-09-22", isPeriodDay: true }] });

    expect(res.status).toBe(201);
    const saved = await MenstrualRecord.find({ userId: user._id });
    expect(saved).toHaveLength(6);
  });
});

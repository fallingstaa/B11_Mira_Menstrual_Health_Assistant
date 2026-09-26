// Must stay first — registers the Firebase mocks before authMiddleware is loaded.
require("./helpers/mockFirebase");

const request = require("supertest");

const app = require("./helpers/testApp");
const { connectTestDb, clearTestDb, disconnectTestDb } = require("./helpers/testDb");
const { tokenFor, createUser } = require("./helpers/testHelpers");
const MenstrualRecord = require("../../models/MenstrualRecord");
const User = require("../../models/User");

jest.setTimeout(120000);

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : d);

// "Today" for the whole flow (dev-only ?asOf, see utils/devClock.js) — keeps every logged date in
// the current month, so the past-month lock rule doesn't get in the way of what's being tested.
const AS_OF = "asOf=2026-07-25";

describe("INT-001 — Period record → API → MongoDB → cycle cache → prediction", () => {
  it("logging two periods through the API updates the stored cycle cache and the prediction", async () => {
    const user = await createUser("int001-user");
    const auth = tokenFor("int001-user");
    const post = (body) => request(app).post(`/api/menstrual/records?${AS_OF}`).set("Authorization", auth).send(body);

    // Period 1: Jul 1 → Jul 5 (explicit end day). Period 2 starts Jul 22, 21 days after Period 1.
    const first = await post({ date: "2026-07-01", isPeriodDay: true, source: "record" });
    const end = await post({ date: "2026-07-05", isPeriodDay: true, isPeriodEnd: true, source: "record" });
    const second = await post({ date: "2026-07-22", isPeriodDay: true, source: "record" });

    // API layer: each write is accepted and echoed back.
    expect([first.status, end.status, second.status]).toEqual([201, 201, 201]);
    expect(day(second.body.data.date)).toBe("2026-07-22");

    // Database layer: all three records were actually stored, for this user only.
    const stored = await MenstrualRecord.find({ userId: user._id }).sort({ date: 1 });
    expect(stored.map((r) => day(r.date))).toEqual(["2026-07-01", "2026-07-05", "2026-07-22"]);

    // Cycle cache layer: recomputeCycleCache ran after the writes and saved its result on the User.
    const { cycle } = await User.findById(user._id);
    expect(day(cycle.lastPeriodStart)).toBe("2026-07-22");
    expect(cycle.averageCycleLength).toBe(21); // Jul 1 → Jul 22
    expect(cycle.averagePeriodLength).toBe(5); // Jul 1 → Jul 5, the only completed period
    expect(day(cycle.nextPeriodStart)).toBe("2026-08-12"); // Jul 22 + 21 days

    // Response layer: GET /prediction returns those same stored values.
    const prediction = await request(app).get(`/api/menstrual/prediction?${AS_OF}`).set("Authorization", auth);
    expect(prediction.status).toBe(200);
    expect(prediction.body.data.averageCycleLength).toBe(21);
    expect(day(prediction.body.data.nextPeriodStart)).toBe("2026-08-12");
    expect(prediction.body.data.currentDay).toBe(4); // Jul 22 is Day 1 → Jul 25 is Day 4
  });

  it("rejects an invalid record with 400 and writes nothing to the database or cycle cache", async () => {
    const user = await createUser("int001-invalid");

    // `source` is required by upsertRecordSchema.
    const res = await request(app)
      .post(`/api/menstrual/records?${AS_OF}`)
      .set("Authorization", tokenFor("int001-invalid"))
      .send({ date: "2026-07-01", isPeriodDay: true });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
    expect(await MenstrualRecord.countDocuments({ userId: user._id })).toBe(0);

    const { cycle } = await User.findById(user._id);
    expect(cycle.lastPeriodStart).toBeNull();
  });
});

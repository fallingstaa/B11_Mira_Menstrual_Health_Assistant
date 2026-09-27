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

const day = (d) => new Date(d).toISOString().slice(0, 10);

// Dev-only "today" (see utils/devClock.js) — keeps every date in the current month.
const AS_OF = "asOf=2026-07-25";

/** Two users, each with one logged period start on a different date, written through the real API. */
async function setUpTwoUsers() {
  const userA = await createUser("int002-userA");
  const userB = await createUser("int002-userB");

  const log = (uid, date) =>
    request(app)
      .post(`/api/menstrual/records?${AS_OF}`)
      .set("Authorization", tokenFor(uid))
      .send({ date, isPeriodDay: true, source: "record" });

  await log("int002-userA", "2026-07-01");
  await log("int002-userB", "2026-07-10");
  return { userA, userB };
}

describe("INT-002 — Authentication → protected API → user data isolation", () => {
  it("each authenticated user is served only their own records and prediction", async () => {
    await setUpTwoUsers();
    const get = (path, uid) => request(app).get(`${path}?${AS_OF}`).set("Authorization", tokenFor(uid));

    // Records: A sees only A's Jul 1, B sees only B's Jul 10.
    const recordsA = await get("/api/menstrual/records", "int002-userA");
    const recordsB = await get("/api/menstrual/records", "int002-userB");
    expect(recordsA.status).toBe(200);
    expect(recordsA.body.data.map((r) => day(r.date))).toEqual(["2026-07-01"]);
    expect(recordsB.body.data.map((r) => day(r.date))).toEqual(["2026-07-10"]);

    // Prediction: each is computed from the caller's own history (default 28-day cycle, no gap yet).
    const predA = await get("/api/menstrual/prediction", "int002-userA");
    const predB = await get("/api/menstrual/prediction", "int002-userB");
    expect(day(predA.body.data.nextPeriodStart)).toBe("2026-07-29"); // Jul 1 + 28
    expect(predA.body.data.currentDay).toBe(25); // Jul 1 → Jul 25
    expect(day(predB.body.data.nextPeriodStart)).toBe("2026-08-07"); // Jul 10 + 28
    expect(predB.body.data.currentDay).toBe(16); // Jul 10 → Jul 25
  });

  it("a user cannot delete another user's record by using that record's date", async () => {
    const { userA } = await setUpTwoUsers();

    // B asks to delete Jul 1 — a date only A has logged. The controller scopes the delete to B's own id.
    const res = await request(app)
      .delete(`/api/menstrual/records/2026-07-01?${AS_OF}`)
      .set("Authorization", tokenFor("int002-userB"));
    expect(res.status).toBe(200);

    // A's record is still there, untouched.
    const remaining = await MenstrualRecord.find({ userId: userA._id });
    expect(remaining.map((r) => day(r.date))).toEqual(["2026-07-01"]);
  });
});

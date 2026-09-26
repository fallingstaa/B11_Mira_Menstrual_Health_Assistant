// Must stay first — registers the Firebase mocks before authMiddleware is loaded.
require("./helpers/mockFirebase");

const request = require("supertest");

const app = require("./helpers/testApp");
const { connectTestDb, clearTestDb, disconnectTestDb } = require("./helpers/testDb");
const { tokenFor, createUser } = require("./helpers/testHelpers");

// The first run may need to download the MongoDB binary used by mongodb-memory-server.
jest.setTimeout(120000);

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

// Infrastructure check only — proves the harness works. The real integration tests
// (INT-001 / INT-002) are separate files.
describe("integration-test setup", () => {
  it("rejects a request with no Authorization header (real authMiddleware runs)", async () => {
    const res = await request(app).get("/api/menstrual/records");
    expect(res.status).toBe(401);
  });

  it("resolves a mocked-Firebase token to a real User in the in-memory database", async () => {
    await createUser("setup-user");

    const res = await request(app).get("/api/menstrual/records").set("Authorization", tokenFor("setup-user"));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "success", data: [] });
  });

  it("returns 404 for a valid token whose user does not exist in the database", async () => {
    const res = await request(app).get("/api/menstrual/records").set("Authorization", tokenFor("nobody"));
    expect(res.status).toBe(404);
  });
});

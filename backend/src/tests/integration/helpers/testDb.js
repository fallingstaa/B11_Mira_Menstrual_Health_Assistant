const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

/**
 * Temporary in-memory MongoDB for integration tests. Nothing here reads MONGODB_URI, so the
 * real Atlas database is never touched. Usage in a test file:
 *
 *   beforeAll(connectTestDb);   afterEach(clearTestDb);   afterAll(disconnectTestDb);
 *
 * A single-node *replica set*, not a plain standalone server — Atlas (production) is always a
 * replica set, and POST /api/menstrual/records/batch relies on that: it wraps its writes in a
 * Mongo session transaction (see batchUpsertRecords in menstrualController.js), which a plain
 * standalone `mongod` flatly refuses ("Transaction numbers are only allowed on a replica set
 * member or mongos"). A single-node replica set supports transactions the same way Atlas does,
 * so any test that exercises that endpoint gets the same guarantees production has.
 */
let mongod;

async function connectTestDb() {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongod.getUri());
}

async function clearTestDb() {
  const { collections } = mongoose.connection;
  for (const name of Object.keys(collections)) {
    await collections[name].deleteMany({});
  }
}

async function disconnectTestDb() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

module.exports = { connectTestDb, clearTestDb, disconnectTestDb };

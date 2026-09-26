const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

/**
 * Temporary in-memory MongoDB for integration tests. Nothing here reads MONGODB_URI, so the
 * real Atlas database is never touched. Usage in a test file:
 *
 *   beforeAll(connectTestDb);   afterEach(clearTestDb);   afterAll(disconnectTestDb);
 */
let mongod;

async function connectTestDb() {
  mongod = await MongoMemoryServer.create();
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

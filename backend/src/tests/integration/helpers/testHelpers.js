const User = require("../../../models/User");

/** Authorization header value the mocked Firebase (mockFirebase.js) accepts for this uid. */
function tokenFor(firebaseUid) {
  return `Bearer test-token:${firebaseUid}`;
}

/** Creates a real User document in the test database, keyed by the given firebaseUid. */
function createUser(firebaseUid, overrides = {}) {
  return User.create({
    firebaseUid,
    email: `${firebaseUid}@example.com`,
    profile: { name: firebaseUid },
    ...overrides,
  });
}

module.exports = { tokenFor, createUser };

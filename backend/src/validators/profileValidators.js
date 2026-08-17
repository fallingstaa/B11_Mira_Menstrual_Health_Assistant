const { z } = require("zod");

// Every field optional — PUT /api/profile/me is a partial update (only provided keys
// change), matching profileController.js's existing `if (x !== undefined)` behavior.
const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  dateOfBirth: z.iso.date("dateOfBirth must be YYYY-MM-DD").optional(),
  preferredLanguage: z.string().trim().min(1).max(40).optional(),
  preferences: z
    .object({
      pushNotifications: z.boolean().optional(),
      checkinReminders: z.boolean().optional(),
    })
    .optional(),
});

module.exports = { updateProfileSchema };

const { z } = require("zod");

const { MIN_AGE, MAX_AGE } = require("../utils/constants");

// Every field optional — PUT /api/profile/me is a partial update (only provided keys
// change), matching profileController.js's existing `if (x !== undefined)` behavior.
const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  age: z.number().int(`age must be a whole number`).min(MIN_AGE, `age must be at least ${MIN_AGE}`).max(MAX_AGE, `age must be at most ${MAX_AGE}`).optional(),
  dateOfBirth: z.iso.date("dateOfBirth must be YYYY-MM-DD").optional(),
  preferredLanguage: z.string().trim().min(1).max(40).optional(),
  preferences: z
    .object({
      pushNotifications: z.boolean().optional(),
      checkinReminders: z.boolean().optional(),
    })
    .optional(),
});

// Backs POST /api/profile/push-token. Expo's push token format has shipped under two
// different bracket-prefixes across SDK versions ("ExponentPushToken[...]" and
// "ExpoPushToken[...]") — accept either rather than picking one and breaking the other.
const pushTokenSchema = z.object({
  expoPushToken: z
    .string()
    .trim()
    .regex(/^Expo(nent)?PushToken\[.+\]$/, "expoPushToken must look like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"),
});

module.exports = { updateProfileSchema, pushTokenSchema };

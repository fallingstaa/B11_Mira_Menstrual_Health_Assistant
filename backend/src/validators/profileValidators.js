const { z } = require("zod");

const { MIN_AGE, MAX_AGE } = require("../utils/constants");

// Every field optional — PUT /api/profile/me is a partial update (only provided keys
// change), matching profileController.js's existing `if (x !== undefined)` behavior.
const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  age: z.number().int(`age must be a whole number`).min(MIN_AGE, `age must be at least ${MIN_AGE}`).max(MAX_AGE, `age must be at most ${MAX_AGE}`).optional(),
  dateOfBirth: z.iso.date("dateOfBirth must be YYYY-MM-DD").optional(),
  preferredLanguage: z.string().trim().min(1).max(40).optional(),
  // Real photo uploads go through POST/DELETE /api/profile/avatar instead (see
  // profileController.js) — those manage this field themselves. This path exists for
  // pointing it at a URL hosted somewhere else entirely, a rarer case. `.nullable()`
  // (distinct from just omitting the key) is what lets a client explicitly clear a
  // previously-set photo back to none, same "omit vs. null" distinction the rest of
  // this schema doesn't need since every other field always has *some* value.
  avatarUrl: z.string().trim().url("avatarUrl must be a valid URL").max(2048).nullable().optional(),
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

// Backs PUT /api/profile/email — a separate endpoint from PUT /api/profile/me since
// changing the login email touches Firebase Auth too, not just this one Mongo doc. Same
// trim/lowercase/email shape as authValidators.js's forgotPasswordSchema, so the same
// address always normalizes to the same string on both sides of the app.
const changeEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("email must be a valid email address"),
});

module.exports = { updateProfileSchema, pushTokenSchema, changeEmailSchema };

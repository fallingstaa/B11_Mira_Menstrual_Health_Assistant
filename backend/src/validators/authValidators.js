const { z } = require("zod");

const { MIN_AGE, MAX_AGE } = require("../utils/constants");

const registerSchema = z.object({
  idToken: z.string().min(1, "idToken is required"),
  name: z.string().trim().min(1, "name is required").max(120),
  // Matches register.tsx's MIN_AGE/MAX_AGE — collected right on the registration form
  // now, not deferred to the period-setup flow. Optional so older/other clients that
  // don't send it yet don't start failing registration.
  age: z.number().int(`age must be a whole number`).min(MIN_AGE, `age must be at least ${MIN_AGE}`).max(MAX_AGE, `age must be at most ${MAX_AGE}`).optional(),
});

const loginSchema = z.object({
  idToken: z.string().min(1, "idToken is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("must be a valid email address"),
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema };

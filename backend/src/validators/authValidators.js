const { z } = require("zod");

const registerSchema = z.object({
  idToken: z.string().min(1, "idToken is required"),
  name: z.string().trim().min(1, "name is required").max(120),
});

const loginSchema = z.object({
  idToken: z.string().min(1, "idToken is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("must be a valid email address"),
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema };

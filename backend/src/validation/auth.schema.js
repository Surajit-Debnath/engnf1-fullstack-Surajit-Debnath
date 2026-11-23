
const { z } = require("zod");

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(50),

  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .toLowerCase(),

  password: z
    .string()
    .min(8)
    .max(64)
    .regex(/[A-Za-z]/)
    .regex(/[0-9]/),
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

module.exports = {
  registerSchema,
  loginSchema,
};

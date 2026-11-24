const { z } = require('zod');

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must contain at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .max(254, 'Email cannot exceed 254 characters')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must contain at least 8 characters')
    .max(64, 'Password cannot exceed 64 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one digit'),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .max(254)
    .toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };

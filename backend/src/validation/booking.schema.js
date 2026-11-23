
const { z } = require("zod");

const createBookingSchema = z.object({
  resourceId: z.string().min(1, "Resource ID is required"),

  ticketId: z.string().nullable().optional(),

  startTime: z.string().datetime({
    offset: true,
    message: "Start time must be a valid ISO 8601 timestamp",
  }),

  endTime: z.string().datetime({
    offset: true,
    message: "End time must be a valid ISO 8601 timestamp",
  }),

  purpose: z
    .string()
    .trim()
    .min(5, "Purpose must contain at least 5 characters")
    .max(200, "Purpose cannot exceed 200 characters"),
});

const rejectBookingSchema = z.object({
  decisionNote: z
    .string()
    .trim()
    .min(5, "Rejection note must contain at least 5 characters")
    .max(200, "Rejection note cannot exceed 200 characters"),
});

module.exports = {
  createBookingSchema,
  rejectBookingSchema,
};

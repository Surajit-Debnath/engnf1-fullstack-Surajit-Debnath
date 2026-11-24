const { z } = require('zod');
const { objectIdSchema } = require('./ticket.schema');

const isoDateTimeSchema = z.string().datetime({
  offset: true,
  message: 'Must be a valid ISO 8601 date-time with timezone',
});

const createBookingSchema = z.object({
  resourceId: objectIdSchema,
  ticketId: objectIdSchema.nullable().optional(),
  startTime: isoDateTimeSchema,
  endTime: isoDateTimeSchema,
  purpose: z
    .string()
    .trim()
    .min(5, 'Purpose must contain at least 5 characters')
    .max(200, 'Purpose cannot exceed 200 characters'),
});

const rejectBookingSchema = z.object({
  decisionNote: z
    .string()
    .trim()
    .min(5, 'Rejection note must contain at least 5 characters')
    .max(200, 'Rejection note cannot exceed 200 characters'),
});

module.exports = { createBookingSchema, rejectBookingSchema };

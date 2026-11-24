const { z } = require("zod");

const objectIdSchema = z.string().regex(
  /^[a-f\d]{24}$/i,
  "Invalid MongoDB ObjectId"
);

const bookingSchema = z.object({
  resourceId: objectIdSchema,

  startTime: z.string().datetime({
    offset: false,
    message: "startTime must be an ISO 8601 UTC timestamp",
  }),

  endTime: z.string().datetime({
    offset: false,
    message: "endTime must be an ISO 8601 UTC timestamp",
  }),

  purpose: z.string()
    .trim()
    .min(5, "Purpose must contain at least 5 characters")
    .max(200, "Purpose cannot exceed 200 characters"),

  ticketId: objectIdSchema.nullable().optional(),
}).strict().superRefine((data, ctx) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);

  // B1-B2: UTC timestamps must align to 00 or 30 minutes.
  for (const [field, date] of [
    ["startTime", start],
    ["endTime", end],
  ]) {
    if (
      ![0, 30].includes(date.getUTCMinutes()) ||
      date.getUTCSeconds() !== 0 ||
      date.getUTCMilliseconds() !== 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: "Time must align to 00 or 30 minutes with zero seconds and milliseconds",
      });
    }
  }

  // B3: Duration must be between 30 and 240 minutes.
  const duration = (end.getTime() - start.getTime()) / 60000;

  if (duration < 30 || duration > 240) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: "Booking duration must be between 30 and 240 minutes",
    });
  }

  // B4: Start time must be in the future and within 30 days.
  const now = Date.now();
  const maxStart = now + 30 * 24 * 60 * 60 * 1000;

  if (start.getTime() <= now) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["startTime"],
      message: "Booking must start in the future",
    });
  } else if (start.getTime() > maxStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["startTime"],
      message: "Booking cannot start more than 30 days ahead",
    });
  }
});
const bookingStatuses = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];
const myBookingsQuerySchema = z.object({
  status: z.enum(bookingStatuses).optional(),

  page: z.coerce.number().int().min(1).default(1),
}).strict();





const adminBookingsQuerySchema = z.object({
  status: z.enum(bookingStatuses).optional(),

  resourceId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid resource ID")
    .optional(),

  from: z
    .string()
    .datetime({ offset: false })
    .optional(),

  to: z
    .string()
    .datetime({ offset: false })
    .optional(),

  page: z
    .string()
    .regex(/^[1-9]\d*$/, "Page must be a positive integer")
    .transform(Number)
    .refine(Number.isSafeInteger, "Invalid page number")
    .default("1"),
})
.strict()
.superRefine((data, ctx) => {
  // from and to must be provided together.
  if (Boolean(data.from) !== Boolean(data.to)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [data.from ? "to" : "from"],
      message: "Both from and to are required",
    });

    return;
  }

  // from must be earlier than to.
  if (data.from && data.to) {
    if (new Date(data.from) >= new Date(data.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: "to must be later than from",
      });
    }
  }
});
// Validate booking ID in URL parameters
const bookingParamsSchema = z.object({
  id: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid booking ID"),
});

// Rejection requires a non-empty note
const rejectBookingSchema = z.object({
  note: z
    .string()
    .trim()
    .min(1, "Rejection note is required"),
}).strict();
module.exports = {
  bookingSchema,
  objectIdSchema,
  myBookingsQuerySchema,
  adminBookingsQuerySchema,
  bookingParamsSchema,
  rejectBookingSchema
};

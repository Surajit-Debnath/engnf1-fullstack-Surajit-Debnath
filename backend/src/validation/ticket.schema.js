const { z } = require("zod");

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

const ticketCategoryEnum = z.enum([
  "BILLING",
  "BUG",
  "FEATURE_REQUEST",
  "LOGIN",
  "DELIVERY",
]);
const ticketPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
const ticketStatusEnum = z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]);

const ticketTextSchema = z.object({
  subject: z.string().trim().min(3, "Subject must contain at least 3 characters").max(150, "Subject cannot exceed 150 characters"),
  body: z.string().trim().min(5, "Body must contain at least 5 characters").max(2000, "Body cannot exceed 2000 characters"),
});

const importTicketSchema = z.object({
  externalId: z.string().trim().min(1, "External ID is required"),
  ...ticketTextSchema.shape,
});

const importTicketsSchema = z.object({
  tickets: z.array(importTicketSchema).min(1, "At least one ticket is required").max(500, "You can import at most 500 tickets at once"),
});

const updateTicketSchema = z
  .object({
    category: ticketCategoryEnum.optional(),
    priority: ticketPriorityEnum.optional(),
    status: ticketStatusEnum.optional(),
    assigneeId: objectIdSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

const ticketQuerySchema = z.object({
  status: ticketStatusEnum.optional(),
  category: ticketCategoryEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  q: z.string().trim().max(200, "Search query cannot exceed 200 characters").optional(),
});

module.exports = {
  objectIdSchema,
  ticketCategoryEnum,
  ticketPriorityEnum,
  ticketStatusEnum,
  ticketTextSchema,
  importTicketSchema,
  importTicketsSchema,
  updateTicketSchema,
  ticketQuerySchema,
};

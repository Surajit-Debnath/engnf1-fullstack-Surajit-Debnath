
const { z } = require("zod");

const ticketCategoryEnum = z.enum([
  "BILLING",
  "BUG",
  "FEATURE_REQUEST",
  "LOGIN",
  "DELIVERY",
]);

const ticketPriorityEnum = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

const ticketStatusEnum = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
]);

const ticketTextSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3)
    .max(150),

  body: z
    .string()
    .trim()
    .min(5)
    .max(2000),
});

const importTicketSchema = z.object({
  externalId: z.string().trim().min(1),
  ...ticketTextSchema.shape,
});

const importTicketsSchema = z.object({
  tickets: z.array(importTicketSchema).min(1),
});

const updateTicketSchema = z
  .object({
    category: ticketCategoryEnum.optional(),
    priority: ticketPriorityEnum.optional(),
    status: ticketStatusEnum.optional(),
    assigneeId: z.string().nullable().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0
  );

const ticketQuerySchema = z.object({
  status: ticketStatusEnum.optional(),
  category: ticketCategoryEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  q: z.string().trim().optional(),
});

module.exports = {
  ticketCategoryEnum,
  ticketPriorityEnum,
  ticketStatusEnum,
  ticketTextSchema,
  importTicketSchema,
  importTicketsSchema,
  updateTicketSchema,
  ticketQuerySchema,
};

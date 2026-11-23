
const { z } = require("zod");

const resourceTypeEnum = z.enum([
  "ROOM",
  "LAB",
  "EQUIPMENT",
]);

const createResourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Resource name must contain at least 3 characters")
    .max(60, "Resource name cannot exceed 60 characters"),

  type: resourceTypeEnum,

  capacity: z
    .number()
    .int("Capacity must be an integer")
    .min(1, "Capacity must be at least 1")
    .max(500, "Capacity cannot exceed 500"),

  description: z
    .string()
    .trim()
    .max(300, "Description cannot exceed 300 characters")
    .nullable()
    .optional(),
});

const updateResourceSchema = createResourceSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0
  );

module.exports = {
  resourceTypeEnum,
  createResourceSchema,
  updateResourceSchema,
};

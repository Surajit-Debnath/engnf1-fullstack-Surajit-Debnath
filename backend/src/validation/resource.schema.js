const { z } = require('zod');

const resourceTypeEnum = z.enum(['ROOM', 'LAB', 'EQUIPMENT']);

const createResourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Resource name must contain at least 3 characters')
    .max(60, 'Resource name cannot exceed 60 characters'),
  type: resourceTypeEnum,
  capacity: z
    .number({ message: 'Capacity must be a number' })
    .int('Capacity must be an integer')
    .min(1, 'Capacity must be at least 1')
    .max(500, 'Capacity cannot exceed 500'),
  description: z
    .string()
    .trim()
    .max(300, 'Description cannot exceed 300 characters')
    .nullable()
    .optional(),
});

const updateResourceSchema = createResourceSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });
const resourceQuerySchema = z.object({
  search: z.string().trim().optional(),
  type: resourceTypeEnum.optional(),
  minCapacity: z.coerce.number().int().min(1).max(500).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
const availabilityQuerySchema = z
  .object({
    from: z.string().datetime({
      offset: false,
      message: "from must be an ISO 8601 UTC timestamp",
    }),

    to: z.string().datetime({
      offset: false,
      message: "to must be an ISO 8601 UTC timestamp",
    }),
  })
  .refine(
    (data) => new Date(data.from) < new Date(data.to),
    {
      message: "from must be earlier than to",
      path: ["to"],
    }
  );
module.exports = {
  resourceTypeEnum,
  createResourceSchema,
  updateResourceSchema,
  resourceQuerySchema,
  availabilityQuerySchema
};

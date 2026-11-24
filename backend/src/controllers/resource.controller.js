const { resourceQuerySchema } = require('../validation/resource.schema');
const { sendError } = require('../utils/apiResponse');
const Resource = require('../models/Resource');

const PAGE_SIZE = 10;

// Escape special regex characters so search input is treated as literal text.
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function getResources(filters, userRole) {
  const { search, type, minCapacity, page } = filters;

  const query = {};

  // USER can only see active resources.
  if (userRole === 'USER') {
    query.isActive = true;
  }

  // ADMIN does not get an isActive restriction.

  if (type) {
    query.type = type;
  }

  if (minCapacity !== undefined) {
    query.capacity = { $gte: minCapacity };
  }

  if (search) {
    query.name = {
      $regex: escapeRegex(search),
      $options: 'i',
    };
  }

  const skip = (page - 1) * PAGE_SIZE;

  const [resources, total] = await Promise.all([
    Resource.find(query).sort({ name: 1 }).skip(skip).limit(PAGE_SIZE).lean(),
    Resource.countDocuments(query),
  ]);

  return {
    data: resources,
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}
async function getResourcesController(req, res) {
  try {
    const validation = resourceQuerySchema.safeParse(req.query);

    if (!validation.success) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Invalid resource query parameters'
      );
    }

    // Pass the authenticated user's role to the service.
    const result = await getResources(validation.data, req.userRole);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get resources error:', error);

    return sendError(
      res,
      500,
      'INTERNAL_SERVER_ERROR',
      'Internal Server Error'
    );
  }
}

module.exports = {
  getResourcesController,
};

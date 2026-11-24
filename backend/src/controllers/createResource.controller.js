const {createResourceSchema} = require("../validation/resource.schema");
const {sendError} = require("../utils/apiResponse");
const Resource = require("../models/Resource");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function createResource(resourceData) {
  const existingResource = await Resource.findOne({
    name: {
      $regex: `^${escapeRegex(resourceData.name)}$`,
      $options: "i",
    },
  });

  if (existingResource) {
    return {
      conflict: true,
    };
  }

  const resource = await Resource.create(resourceData);

  return {
    conflict: false,
    resource,
  };
}
async function createResourceController(req, res) {
  try {
    // Validate request body.
    const validation = createResourceSchema.safeParse(req.body);

    if (!validation.success) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Invalid resource data"
      );
    }

    const result = await createResource(validation.data);

    if (result.conflict) {
      return sendError(
        res,
        409,
        "CONFLICT",
        "A resource with this name already exists"
      );
    }

    return res.status(201).json({
      resource: result.resource,
    });

  } catch (error) {
    console.error("Create resource error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
}

module.exports = {
  createResourceController,
};

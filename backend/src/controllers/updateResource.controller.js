const {objectIdSchema} = require("../validation/ticket.schema");
const {updateResourceSchema} = require("../validation/resource.schema");
const {sendError} = require("../utils/apiResponse");
const Resource = require("../models/Resource");

async function updateResource(resource, updates) {
  if (updates.name !== undefined) {
    const existingResource = await Resource.findOne({
      _id: { $ne: resource._id },
      name: updates.name,
    }).collation({
      locale: "en",
      strength: 2,
    });

    if (existingResource) {
      return { conflict: true };
    }
  }

  Object.assign(resource, updates);

  try {
    await resource.save();
  } catch (error) {
    if (error.code === 11000) {
      return { conflict: true };
    }
    throw error;
  }

  return { resource };
}

async function updateResourceController(req, res) {
  try {
    // 1. Validate path ID.
    const idValidation = objectIdSchema.safeParse(req.params.id);

    if (!idValidation.success) {
      return sendError(
        res,
        404,
        "NOT_FOUND",
        "Resource not found"
      );
    }

    // 2. Check whether the resource exists.
    const existingResource = await Resource.findById(idValidation.data);

    if (!existingResource) {
      return sendError(
        res,
        404,
        "NOT_FOUND",
        "Resource not found"
      );
    }
    const validation = updateResourceSchema.safeParse(req.body);

    if (!validation.success) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Invalid resource update data"
      );
    }

    // 4. Update the resource.
    const result = await updateResource(
      existingResource,
      validation.data
    );

    if (result.notFound) {
      return sendError(
        res,
        404,
        "NOT_FOUND",
        "Resource not found"
      );
    }

    if (result.conflict) {
      return sendError(
        res,
        409,
        "CONFLICT",
        "A resource with this name already exists"
      );
    }

    return res.status(200).json({
      resource: result.resource,
    });

  } catch (error) {
    console.error("Update resource error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
}

module.exports = {
  updateResourceController,
};

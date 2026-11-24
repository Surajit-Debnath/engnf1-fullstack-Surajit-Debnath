const {objectIdSchema} = require("../validation/ticket.schema");
const { sendError} = require("../utils/apiResponse");
const Resource = require("../models/Resource");

async function getResourceById(resourceId, userRole) {
  const query = {
    _id: resourceId,
  };

  // USER can only access active resources.
  if (userRole === "USER") {
    query.isActive = true;
  }

  const resource = await Resource.findOne(query).lean();

  return resource;
}
async function getResourceByIdController(req, res) {
  try {
    // Validate resource ID.
    const validation = objectIdSchema.safeParse(req.params.id);

    if (!validation.success) {
      return sendError(
        res,
        404,
        "NOT_FOUND",
        "Resource not found"
      );
    }

    const resource = await getResourceById(
      validation.data,
      req.userRole
    );

    if (!resource) {
      return sendError(
        res,
        404,
        "NOT_FOUND",
        "Resource not found"
      );
    }

    return res.status(200).json({
      resource,
    });

  } catch (error) {
    console.error("Get resource details error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
}

module.exports = {
  getResourceByIdController,
};

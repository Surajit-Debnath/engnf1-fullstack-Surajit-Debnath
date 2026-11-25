const Resource = require("../models/Resource");
const {availabilityQuerySchema} = require("../validation/resource.schema");
const {objectIdSchema}=require("../validation/ticket.schema")
const {sendError} = require("../utils/apiResponse");
const Booking = require("../models/Booking");
const {expirePendingBookings} = require("../services/bookingExpiry.service");
async function getResourceAvailability(resourceId, from, to) {
  await expirePendingBookings();

  const bookings = await Booking.find({
    resourceId,
    status: {
      $in: ["PENDING", "APPROVED"],
    },
    startTime: { $lt: new Date(to) },
    endTime: { $gt: new Date(from) },
  })
    .select("startTime endTime status -_id")
    .sort({ startTime: 1 })
    .lean();

  return {
    resourceId,
    from,
    to,
    bookings,
  };
}
const MAX_RANGE_MS = 7 * 24 * 60 * 60 * 1000;

async function resourceAvailabilityController(req, res) {
  try {
    
    const idValidation = objectIdSchema.safeParse(req.params.id);

    if (!idValidation.success) {
      return sendError(
        res,
        404,
        "NOT_FOUND",
        "Resource not found"
      );
    }

    // 2. Check resource existence and USER visibility.
    const resourceQuery = {
      _id: idValidation.data,
    };

    if (req.userRole === "USER") {
      resourceQuery.isActive = true;
    }

    const resource = await Resource.findOne(resourceQuery).lean();

    if (!resource) {
      return sendError(
        res,
        404,
        "NOT_FOUND",
        "Resource not found"
      );
    }

    const validation = availabilityQuerySchema.safeParse(req.query);

    if (!validation.success) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Invalid availability date range"
      );
    }

    const { from, to } = validation.data;
    const range = new Date(to).getTime() - new Date(from).getTime();

    if (range > MAX_RANGE_MS) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Availability range cannot exceed 7 days"
      );
    }

    // 5. Fetch overlapping bookings.
    const result = await getResourceAvailability(
      resource._id,
      from,
      to
    );

    return res.status(200).json(result);

  } catch (error) {
    console.error("Resource availability error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
}

module.exports = {
  resourceAvailabilityController,
};

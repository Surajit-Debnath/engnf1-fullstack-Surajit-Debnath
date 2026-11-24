const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const {adminBookingsQuerySchema} = require("../validation/booking.schema");
const { sendError } = require("../utils/apiResponse");

async function getAllBookingsController(req, res) {
  try {
    // 1. Check ADMIN role
    if (req.adminRole !== "ADMIN") {
      return sendError(
        res,
        403,
        "FORBIDDEN",
        "Admin access required"
      );
    }

    // 2. Validate query parameters
    const validation = adminBookingsQuerySchema.safeParse(req.query);

    if (!validation.success) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Invalid query parameters"
      );
    }

    const {
      status,
      resourceId,
      from,
      to,
      page,
    } = validation.data;

    // 3. Build MongoDB filter
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (resourceId) {
      filter.resourceId = new mongoose.Types.ObjectId(resourceId);
    }

    // 4. Find bookings overlapping the requested date range
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);

      filter.startTime = {
        $lt: toDate,
      };

      filter.endTime = {
        $gt: fromDate,
      };
    }

    // 5. Pagination
    const limit = 10;
    const skip = (page - 1) * limit;

    // 6. Fetch bookings and total count
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ startTime: 1, _id: 1 })
        .skip(skip)
        .limit(limit),

      Booking.countDocuments(filter),
    ]);

    // 7. Return response
    return res.status(200).json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("Get all bookings error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
}

module.exports = {
  getAllBookingsController,
};

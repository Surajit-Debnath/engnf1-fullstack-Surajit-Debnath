const {myBookingsQuerySchema} = require("../validation/booking.schema");
const { sendError } = require("../utils/apiResponse");
const Booking = require("../models/Booking");
async function getMyBookings(userId, query) {
  const { status, page } = query;
  const limit = 10;
  const skip = (page - 1) * limit;
  const filter = { userId };
  if (status) {
    filter.status = status;
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
async function getMyBookingsController(req, res) {
  const validation = myBookingsQuerySchema.safeParse(req.query);

  if (!validation.success) {
    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "Invalid query parameters"
    );
  }

  try {
    const result = await getMyBookings(
      req.userId.id,
      validation.data
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
}

module.exports = {
  getMyBookingsController,
};
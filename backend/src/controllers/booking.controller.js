const {bookingSchema} = require("../validation/booking.schema");
const {createBooking,BookingError} = require("../services/booking.service");
const {sendError} = require("../utils/apiResponse");

async function createBookingController(req, res) {
  try {
    // 1. Validate request body.
    const validation = bookingSchema.safeParse(req.body);

    if (!validation.success) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Invalid booking data"
      );
    }

    // 2. Create booking using authenticated user's ID.
    const booking = await createBooking(
      validation.data,
      req.userId.id
    );

    return res.status(201).json({
      booking,
    });

  } catch (error) {
    if (error instanceof BookingError) {
      return sendError(
        res,
        error.status,
        error.code,
        error.message
      );
    }

    console.error("Create booking error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
}

module.exports = {
  createBookingController,
};

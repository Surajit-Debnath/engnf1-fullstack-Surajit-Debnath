const Booking = require("../models/Booking");
const {bookingParamsSchema,rejectBookingSchema} = require("../validation/booking.schema");
const { sendError } = require("../utils/apiResponse");

async function cancelBookingController(req, res) {
  try {
    // Validate booking ID
    const validation = bookingParamsSchema.safeParse(req.params);

    if (!validation.success) {
      return sendError(res, 404, "NOT_FOUND", "Booking not found");
    }

    const { id } = validation.data;
    const userId = req.userId.id;

    // Find booking
    const booking = await Booking.findById(id);

    if (!booking) {
      return sendError(res, 404, "NOT_FOUND", "Booking not found");
    }

    // Only the booking owner can cancel it
    if (booking.userId.toString() !== userId) {
      return sendError(
        res,
        403,
        "FORBIDDEN",
        "You can only cancel your own bookings"
      );
    }

    // Only future bookings can be cancelled
    const now = new Date();

    if (booking.startTime <= now) {
      return sendError(
        res,
        409,
        "CONFLICT",
        "Booking can no longer be cancelled"
      );
    }

    // Only PENDING and APPROVED can be cancelled
    if (!["PENDING", "APPROVED"].includes(booking.status)) {
      return sendError(
        res,
        409,
        "CONFLICT",
        "Booking cannot be cancelled in its current state"
      );
    }

    // Conditional update protects against concurrent transitions
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: id,
        userId,
        status: { $in: ["PENDING", "APPROVED"] },
        startTime: { $gt: now },
      },
      {
        $set: { status: "CANCELLED" },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!updatedBooking) {
      return sendError(
        res,
        409,
        "CONFLICT",
        "Booking state changed or booking is no longer cancellable"
      );
    }

    return res.status(200).json({
      booking: updatedBooking,
    });

  } catch (error) {
    console.error("Cancel booking error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
}

async function approveBookingController(req, res) {
  try {
    // ADMIN authorization
    if (req.adminRole !== "ADMIN") {
      return sendError(
        res,
        403,
        "FORBIDDEN",
        "Admin access required"
      );
    }

    // Validate booking ID
    const validation = bookingParamsSchema.safeParse(req.params);

    if (!validation.success) {
      return sendError(res, 404, "NOT_FOUND", "Booking not found");
    }

    const { id } = validation.data;

    const booking = await Booking.findById(id);

    if (!booking) {
      return sendError(res, 404, "NOT_FOUND", "Booking not found");
    }

    const now = new Date();

    // Booking must start in the future
    if (booking.startTime <= now) {
      return sendError(
        res,
        409,
        "CONFLICT",
        "Booking can no longer be approved"
      );
    }

    // Only PENDING can be approved
    if (booking.status !== "PENDING") {
      return sendError(
        res,
        409,
        "CONFLICT",
        "Only pending bookings can be approved"
      );
    }

    // Conditional atomic update
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: id,
        status: "PENDING",
        startTime: { $gt: now },
      },
      {
        $set: { status: "APPROVED" },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!updatedBooking) {
      return sendError(
        res,
        409,
        "CONFLICT",
        "Booking state changed or booking can no longer be approved"
      );
    }

    return res.status(200).json({
      booking: updatedBooking,
    });

  } catch (error) {
    console.error("Approve booking error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
}

async function rejectBookingController(req, res) {
  try {
    // ADMIN authorization
    if (req.adminRole !== "ADMIN") {
      return sendError(
        res,
        403,
        "FORBIDDEN",
        "Admin access required"
      );
    }

    // Validate booking ID
    const paramsValidation = bookingParamsSchema.safeParse(req.params);

    if (!paramsValidation.success) {
      return sendError(res, 404, "NOT_FOUND", "Booking not found");
    }

    // Validate rejection note
    const bodyValidation = rejectBookingSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "A valid rejection note is required"
      );
    }

    const { id } = paramsValidation.data;
    const { note } = bodyValidation.data;

    const booking = await Booking.findById(id);

    if (!booking) {
      return sendError(res, 404, "NOT_FOUND", "Booking not found");
    }

    const now = new Date();

    // Booking must start in the future
    if (booking.startTime <= now) {
      return sendError(
        res,
        409,
        "CONFLICT",
        "Booking can no longer be rejected"
      );
    }

    // Only PENDING can be rejected
    if (booking.status !== "PENDING") {
      return sendError(
        res,
        409,
        "CONFLICT",
        "Only pending bookings can be rejected"
      );
    }

    // Conditional atomic update
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: id,
        status: "PENDING",
        startTime: { $gt: now },
      },
      {
        $set: {
          status: "REJECTED",
          decisionNote: note,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!updatedBooking) {
      return sendError(
        res,
        409,
        "CONFLICT",
        "Booking state changed or booking can no longer be rejected"
      );
    }

    return res.status(200).json({
      booking: updatedBooking,
    });

  } catch (error) {
    console.error("Reject booking error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
}

module.exports = {
  cancelBookingController,
  approveBookingController,
  rejectBookingController,
};
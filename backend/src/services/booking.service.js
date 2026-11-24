const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Resource = require("../models/Resource");
const User = require("../models/User");
const Ticket = require("../models/Ticket");

class BookingError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function createBooking(bookingData, userId) {
  const session = await mongoose.startSession();

  let createdBooking;

  try {
    await session.withTransaction(async () => {
      const now = new Date();

      // 1. Lock the active resource.
      // Concurrent bookings for this resource will conflict here.
      const resource = await Resource.findOneAndUpdate(
        {
          _id: bookingData.resourceId,
          isActive: true,
        },
        {
          $inc: { bookingLockVersion: 1 },
        },
        { returnDocument: "after", session }
      );

      if (!resource) {
        throw new BookingError(
          404,
          "NOT_FOUND",
          "Active resource not found"
        );
      }

      // 2. Lock the user document.
      // This protects the maximum-three-bookings rule across resources.
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $inc: { bookingLockVersion: 1 },
        },
        { returnDocument: "after", session }
      );

      if (!user) {
        throw new BookingError(
          404,
          "NOT_FOUND",
          "User not found"
        );
      }

      // 3. Check optional ticket reference.
      if (bookingData.ticketId) {
        const ticket = await Ticket.findById(
          bookingData.ticketId
        ).session(session);

        if (!ticket) {
          throw new BookingError(
            404,
            "NOT_FOUND",
            "Referenced ticket not found"
          );
        }
      }

      // 4. Maximum 3 future PENDING/APPROVED bookings per user.
      const activeFutureBookings = await Booking.countDocuments({
        userId,
        startTime: { $gt: now },
        status: { $in: ["PENDING", "APPROVED"] },
      }).session(session);

      if (activeFutureBookings >= 3) {
        throw new BookingError(
          409,
          "CONFLICT",
          "You already have 3 future active bookings"
        );
      }

      // 5. Check overlapping bookings for this resource.
      const overlappingBooking = await Booking.findOne({
        resourceId: bookingData.resourceId,

        status: {
          $in: ["PENDING", "APPROVED"],
        },

        startTime: {
          $lt: new Date(bookingData.endTime),
        },

        endTime: {
          $gt: new Date(bookingData.startTime),
        },
      }).session(session);

      if (overlappingBooking) {
        throw new BookingError(
          409,
          "CONFLICT",
          "Resource is already booked for this time slot"
        );
      }

      // 6. Create booking only after all checks pass.
      const [booking] = await Booking.create(
        [
          {
            ...bookingData,
            userId,
            status: "PENDING",
          },
        ],
        { session }
      );

      createdBooking = booking;
    });

    return createdBooking;
  } finally {
    await session.endSession();
  }
}

module.exports = {
  createBooking,
  BookingError,
};

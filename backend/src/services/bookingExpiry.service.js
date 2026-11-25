const Booking = require("../models/Booking");

async function expirePendingBookings() {
  const result = await Booking.updateMany(
    {
      status: "PENDING",
      startTime: { $lte: new Date() },
    },
    {
      $set: {
        status: "REJECTED",
        decisionNote: "Time ran out",
      },
    }
  );

  if (result.modifiedCount > 0) {
    console.log(
      `Automatically rejected ${result.modifiedCount} expired bookings`
    );
  }

  return result.modifiedCount;
}

function startBookingExpiryJob() {
  let isRunning = false;

  async function run() {
    if (isRunning) return;

    isRunning = true;

    try {
      await expirePendingBookings();
    } catch (error) {
      console.error("Booking expiration error:", error);
    } finally {
      isRunning = false;
    }
  }

  // Run immediately on server startup.
  void run();

  // Check for expired bookings every 10 seconds.
  return setInterval(run, 10000);
}

module.exports = {
  expirePendingBookings,
  startBookingExpiryJob,
};
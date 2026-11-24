const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const { sendError } = require("../utils/apiResponse");

async function admin_OwnerbookingController(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, "NOT_FOUND", "Booking not found");
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return sendError(res, 404, "NOT_FOUND", "Booking not found");
    }

    const userId = req.userId.id;
    const userRole = req.userRole;
    // Only the owner or ADMIN can access this booking.
    if (userRole === "ADMIN" || booking.userId.toString() === userId) 
    {
      return res.status(200).json({ booking });
    }
    else{
        return sendError(
        res,
        403,
        "FORBIDDEN",
        "You cannot access this booking"
      );
    }
    

  } catch (error) {
    console.error("Get booking error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
}

module.exports = {
  admin_OwnerbookingController,
};
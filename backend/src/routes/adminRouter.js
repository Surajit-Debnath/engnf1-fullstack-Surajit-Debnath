const { Router } = require('express');
const Resource = require("../models/Resource");
const Booking = require("../models/Booking");
const Ticket = require("../models/Ticket");
const { sendError } = require("../utils/apiResponse");
const adminRouter = Router();
const {bookingStatuses}=require("../validation/booking.schema");
const {expirePendingBookings} = require("../services/bookingExpiry.service");
async function getAdminStatsController(req, res) {
  try {
    // 1. ADMIN authorization
    if (req.adminRole !== "ADMIN") {
      return sendError(
        res,
        403,
        "FORBIDDEN",
        "Admin access required"
      );
    }
    // 3. Execute statistics queries
    await expirePendingBookings();
    const [
      activeResources,
      bookingStatusRows,
      topResources,
      ticketStatsRows,
    ] = await Promise.all([

      // Count active resources
      Resource.countDocuments({
        isActive: true,
      }),

      // Count bookings by status
      Booking.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      // Find top 3 most-booked resources
      Booking.aggregate([
        {
          $group: {
            _id: "$resourceId",
            bookingCount: { $sum: 1 },
          },
        },
        {
          $sort: {
            bookingCount: -1,
            _id: 1,
          },
        },
        {
          $limit: 3,
        },
        {
          $lookup: {
            from: Resource.collection.name,
            localField: "_id",
            foreignField: "_id",
            as: "resource",
          },
        },
        {
          $unwind: "$resource",
        },
        {
          $project: {
            _id: 0,
            resourceId: "$_id",
            name: "$resource.name",
            type: "$resource.type",
            bookingCount: 1,
          },
        },
      ]),

      // Ticket analytics
      Ticket.aggregate([
        {
          $facet: {
            byCategory: [
              {
                $group: {
                  _id: "$category",
                  count: { $sum: 1 },
                },
              },
            ],

            byPriority: [
              {
                $group: {
                  _id: "$priority",
                  count: { $sum: 1 },
                },
              },
            ],

            byStatus: [
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]),
    ]);

    // 4. Ensure all four booking statuses are present
    const bookingsByStatus = Object.fromEntries(
      bookingStatuses.map((status) => [status, 0])
    );

    for (const item of bookingStatusRows) {
      if (Object.hasOwn(bookingsByStatus, item._id)) {
        bookingsByStatus[item._id] = item.count;
      }
    }

    // 5. Build ticket statistics
    const ticketStats = ticketStatsRows[0] || {
      byCategory: [],
      byPriority: [],
      byStatus: [],
    };

    // 6. Return response
    return res.status(200).json({
      activeResources,
      bookingsByStatus,
      topResources,
      ticketStats,
    });

  } catch (error) {
    console.error("Admin stats error:", error);

    return sendError(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal Server Error"
    );
  }
}

adminRouter.get("/stats",getAdminStatsController);

module.exports = {
    adminRouter:adminRouter
};

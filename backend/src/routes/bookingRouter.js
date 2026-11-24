const { Router } = require("express");
const {authMiddleware}=require("../middleware/authmiddleware");
const {adminMiddleware}=require("../middleware/adminmiddleware");

const {createBookingController} = require("../controllers/booking.controller");
const {getMyBookingsController}=require("../controllers/mybooking.controller");
const {admin_OwnerbookingController}=require("../controllers/admin_ownerbooking.controller");
const {getAllBookingsController}=require("../controllers/adminbooking.controller");
const {cancelBookingController,approveBookingController,rejectBookingController}=require("../controllers/bookinglifecycle.controller");
const bookingRouter = Router();

bookingRouter.post("/",authMiddleware,createBookingController);
bookingRouter.get("/mine",authMiddleware,getMyBookingsController);
bookingRouter.get("/:id",authMiddleware,admin_OwnerbookingController);
bookingRouter.get("/",adminMiddleware,getAllBookingsController);
bookingRouter.patch("/:id/cancel",authMiddleware,cancelBookingController);
bookingRouter.patch("/:id/approve",adminMiddleware,approveBookingController);
bookingRouter.patch("/:id/reject",adminMiddleware,rejectBookingController);

module.exports = {
  bookingRouter:bookingRouter,
};

const { Router } = require("express");
const {authMiddleware}=require("../middleware/authmiddleware");
const {adminMiddleware}=require("../middleware/adminmiddleware");

const {createBookingController} = require("../controllers/booking.controller");
const bookingRouter = Router();

bookingRouter.post("/",authMiddleware,createBookingController);

module.exports = {
  bookingRouter:bookingRouter,
};

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
const PORT = process.env.PORT;
const MONGODB_URL = process.env.MONGODB_URL;
const {startBookingExpiryJob} = require("./services/bookingExpiry.service");

const { authRouter } = require('./routes/authRouter');
const { ticketRouter } = require('./routes/ticketRouter');
const { statsRouter } = require('../src/routes/statsRouter');
const {resourceRouter}=require("../src/routes/resourceRouter");
const {bookingRouter}=require("../src/routes/bookingRouter");
const { adminRouter } = require('./routes/adminRouter');
const { authMiddleware } = require('../src/middleware/authmiddleware');
const {adminMiddleware}=require("../src/middleware/adminmiddleware");
const app = express();

async function connect() {
  try {
    await mongoose.connect(MONGODB_URL);

    console.log("Mongo connected");

    // Start automatic booking expiration
    startBookingExpiryJob();

    console.log("Booking expiration job started");

    app.listen(PORT, () => {
      console.log(`Listening on port: ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

connect();
app.use(express.json());
app.use(cors());
app.get('/api/health', (req, res) => {
  res.json({ message: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/tickets', authMiddleware, ticketRouter);
app.use('/api/stats', authMiddleware, statsRouter);
app.use('/api/resources',resourceRouter);
app.use('/api/bookings',bookingRouter);
app.use("/api/admin",adminMiddleware,adminRouter);
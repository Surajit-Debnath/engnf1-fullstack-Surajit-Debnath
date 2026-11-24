require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const PORT = process.env.PORT;
const MONGODB_URL = process.env.MONGODB_URL;
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
  app.listen(PORT, () => {
    console.log(`listening on port:${PORT}`);
  });
  await mongoose.connect(MONGODB_URL);
  console.log('Mongo connected');
}
connect();
app.use(express.json());
app.get('/api/health', (req, res) => {
  res.json({ message: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/tickets', authMiddleware, ticketRouter);
app.use('/api/stats', authMiddleware, statsRouter);
app.use('/api/resources',resourceRouter);
app.use('/api/bookings',bookingRouter);
app.use("/api/admin",adminMiddleware,adminRouter);
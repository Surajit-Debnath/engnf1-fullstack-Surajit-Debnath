require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const PORT = process.env.PORT;
const MONGODB_URL = process.env.MONGODB_URL;
const {authRouter}=require("./routes/authRouter");
const {ticketRouter}=require("./routes/ticketRouter");
const {statsRouter}=require("../src/routes/statsRouter");
const {authMiddleware}=require("../src/middleware/authmiddleware");
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
app.get("/api/health",(req,res)=>{
    res.json({"message":"ok"})
});


app.use("/api/auth",authRouter);
app.use("/api/tickets",authMiddleware,ticketRouter);
app.use("/api/stats", authMiddleware,statsRouter );

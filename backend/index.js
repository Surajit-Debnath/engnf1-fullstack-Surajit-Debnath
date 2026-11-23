require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const PORT = process.env.PORT;
const MONGODB_URL = process.env.MONGODB_URL;

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

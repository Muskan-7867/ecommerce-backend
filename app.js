// import connectDB from "./src/config/db.js";
// import express from "express";
// import mainRouter from "./src/router/route.js";
// import dotenv from "dotenv";
// import cors from "cors";

const connectDB = require("./src/config/db.js");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mainRouter = require("./src/router/route.js");

dotenv.config();

const BASE_URL = process.env.VITE_BASE_URL;
const app = express();
app.use(express.json());
const port = 3000;

connectDB();
const corsOptions = {
  origin: ["https://omeg-bazaar-client.vercel.app", "http://localhost:5173", "https://omegbazaar.com", "http://localhost:3001"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
  optionSuccessStatus: 200,
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

app.use(mainRouter);
// setInterval(rerunMachine, 60000);

app.get("/", (req, res) => {
  res.send("Hello Worlddd!!");
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

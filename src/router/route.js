
// import { adminRouter } from "./admin.router.js";
// import emailRoutes from "./email.router.js";
// import { orderRouter } from "./order.router.js";
// import { productRouter } from "./product.router.js";
// import { UserRouter } from "./user.router.js";
// import { Router } from "express";

const adminRouter = require("./adminrouter.js");
const emailRoutes = require("./emailrouter.js");
// const orderRouter = require("./orderrouter.js");
const orderRouter = require("./orderrouter.js")
const productRouter = require("./productrouter.js");
const { UserRouter } = require("./userrouter.js");
const express   = require("express");

const router = express.Router();

router.use("/api/v1/user", UserRouter);
router.use("/api/v1/product", productRouter);
router.use("/api/v1/order", orderRouter);
router.use("/api/v1/admin", adminRouter);
router.use("/api", emailRoutes);




module.exports =  router;

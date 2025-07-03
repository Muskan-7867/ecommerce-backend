// import { Router } from "express";
// import { adminLogin, createAdmin, getAdminInfo } from "../controllers/admin.controller.js";
// import { adminAuthenticator } from "../middleware/adminauth.js";

const { adminLogin, createAdmin, getAdminInfo } = require("../controllers/admincontroller.js");
const { adminAuthenticator } = require("../middleware/adminauth.js");

const express   = require("express");
const adminRouter = express.Router();

adminRouter.post("/create", createAdmin)
adminRouter.post("/login", adminLogin)
adminRouter.get("/all", adminAuthenticator,  getAdminInfo)

module.exports = adminRouter

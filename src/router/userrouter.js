// import { Router } from "express";
// import {
//   fetchUserAddressFromId,
//   forgotPassword,
//   getAllUsers,
//   getUser,
//   resetPassword,
//   updateUserProfile,
//   userLogin,

//   userRegister
// } from "../controllers/user.controller.js";
// import { createAddress } from "../controllers/address.controller.js";
// import { authenticator } from "../middleware/authenticator.js";

const express   = require("express");
const {
  fetchUserAddressFromId,
  forgotPassword,
  getAllUsers,
  getUser,
  resetPassword,
  updateUserProfile,
  userLogin,

  userRegister
} = require("../controllers/usercontroller.js");
const  createAddress  = require("../controllers/addresscontroller.js");
const { authenticator } = require("../middleware/authenticator.js");

const  UserRouter = express.Router();
UserRouter.post("/login", userLogin);
UserRouter.get("/allusers", getAllUsers);
UserRouter.post("/register", userRegister);
UserRouter.get("/current", authenticator, getUser);
UserRouter.put("/update", authenticator, updateUserProfile);
UserRouter.post("/forgotpassword", forgotPassword);
UserRouter.post("/resetpassword/:token", resetPassword);
UserRouter.put("/address", authenticator, createAddress);
UserRouter.get(
  "/useraddress/:addressId",
  authenticator,
  fetchUserAddressFromId
);

module.exports = { UserRouter };
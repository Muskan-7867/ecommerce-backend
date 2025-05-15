import { Router } from "express";
import {
  fetchUserAddressFromId,
  forgotPassword,
  getAllUsers,
  getUser,
  updateUserProfile,
  userLogin,
  
  userRegister
} from "../controllers/user.controller.js";
import { createAddress } from "../controllers/address.controller.js";
import { authenticator } from "../middleware/authenticator.js";

export const UserRouter = Router();
UserRouter.post("/login", userLogin);
UserRouter.get("/allusers", getAllUsers);
UserRouter.post("/register", userRegister);
UserRouter.get("/current", authenticator, getUser);
UserRouter.put("/update", authenticator, updateUserProfile)
UserRouter.post("/forgotpassword", forgotPassword);
UserRouter.put("/address", authenticator, createAddress);
UserRouter.get("/useraddress/:addressId", authenticator, fetchUserAddressFromId);

import { Router } from "express";
import {
  forgotPassword,
  getUser,
  updateUserProfile,
  userLogin,
  
  userRegister
} from "../controllers/user.controller.js";
import { userAddress } from "../controllers/address.controller.js";
import { authenticator } from "../middleware/authenticator.js";

export const UserRouter = Router();
UserRouter.post("/login", userLogin);
UserRouter.post("/register", userRegister);
UserRouter.get("/current", authenticator, getUser);
UserRouter.put("/update", authenticator, updateUserProfile)
UserRouter.post("/forgotpassword", forgotPassword);
UserRouter.post("/address", authenticator, userAddress);

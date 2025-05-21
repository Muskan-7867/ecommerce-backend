import { Router } from "express";
import { adminLogin, createAdmin, getAdminInfo } from "../controllers/admin.controller.js";
import { adminAuthenticator } from "../middleware/adminauth.js";

export const adminRouter = Router();

adminRouter.post("/create", createAdmin)
adminRouter.post("/login", adminLogin)
adminRouter.get("/all", adminAuthenticator,  getAdminInfo)



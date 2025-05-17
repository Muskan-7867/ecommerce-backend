import { Router } from "express";
import { adminLogin, createAdmin } from "../controllers/admin.controller.js";

export const adminRouter = Router();

adminRouter.post("/create", createAdmin)
adminRouter.post("/login", adminLogin)



import { adminRouter } from "./admin.router.js";
import { productRouter } from "./product.router.js";
import { UserRouter } from "./user.router.js";
import { Router } from "express";
const router = Router();

router.use("/api/v1/user", UserRouter);
router.use("/api/v1/product", productRouter);
router.use("/api/v1/admin", adminRouter);



export default router;

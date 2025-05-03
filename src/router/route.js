
import { productRouter } from "./product.router.js";
import { UserRouter } from "./user.router.js";
import { Router } from "express";
const router = Router();

router.use("/api/v1/user", UserRouter);
router.use("/api/v2/product", productRouter);


export default router;

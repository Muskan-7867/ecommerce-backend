import { Router } from "express";
import { createRazorPayOrder, createRazorPayOrderOfCart, deleteOrderById, getClientByOrderId, getOrderProducts, newOrder, paymentVerify } from "../controllers/order.controller.js";
import { authenticator } from "../middleware/authenticator.js";

export const orderRouter = Router()

orderRouter.post("/razorpayorder", authenticator, createRazorPayOrder);
orderRouter.delete("/delete/:orderid", deleteOrderById);
orderRouter.get("/products", authenticator , getOrderProducts);
orderRouter.post("/paymentverify", authenticator, paymentVerify);
orderRouter.post("/create", authenticator,  newOrder);
orderRouter.post("/cartrazorpayorder", authenticator,  createRazorPayOrderOfCart);
orderRouter.get("/client/:orderId",  getClientByOrderId);

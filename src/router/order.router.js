import { Router } from "express";
import { createRazorPayOrder, createRazorPayOrderOfCart, deleteOrderById, getClientByOrderId, getOrderProducts, newOrder, paymentVerify, updateOrderStatus, updatePaymentPaidStatus, updatePaymentStatus } from "../controllers/order.controller.js";
import { authenticator } from "../middleware/authenticator.js";
import { roleAuthenticator } from "../middleware/authenticator.js";

export const orderRouter = Router()

orderRouter.post("/razorpayorder", authenticator, createRazorPayOrder);
orderRouter.delete("/delete/:orderid", deleteOrderById);
orderRouter.get("/products", authenticator , getOrderProducts);
orderRouter.post("/paymentverify", authenticator, paymentVerify);
orderRouter.post("/create", authenticator,  newOrder);
orderRouter.post("/cartrazorpayorder", authenticator,  createRazorPayOrderOfCart);
orderRouter.get("/client/:orderId",  getClientByOrderId);
orderRouter.patch('/:orderId/status', authenticator, roleAuthenticator('admin'), updateOrderStatus);
orderRouter.patch('/:orderId/payment-status', authenticator, roleAuthenticator('admin'), updatePaymentStatus);
orderRouter.patch('/:orderId/payment-paid', authenticator, roleAuthenticator('admin'), updatePaymentPaidStatus);


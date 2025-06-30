import { Router } from "express";
import { createRazorPayOrder, createRazorPayOrderOfCart, deleteOrderById, getClientByOrderId, getOrderProducts, getOrdersById, newOrder, paymentVerify, updateOrderStatus, updatePaymentPaidStatus, updatePaymentStatus } from "../controllers/order.controller.js";
import { authenticator } from "../middleware/authenticator.js";
import { roleAuthenticator } from "../middleware/authenticator.js";

export const orderRouter = Router()

orderRouter.post("/razorpayorder", authenticator, createRazorPayOrder);
orderRouter.delete("/delete/:orderid", deleteOrderById);
orderRouter.get("/products", getOrderProducts);
orderRouter.post("/paymentverify", authenticator, paymentVerify);
orderRouter.post("/create", authenticator,  newOrder);
orderRouter.post("/cartrazorpayorder", authenticator,  createRazorPayOrderOfCart);
orderRouter.get("/client/:orderId",  getClientByOrderId);
orderRouter.patch('/:orderId/status', updateOrderStatus);
orderRouter.patch('/:orderId/payment-status',  updatePaymentStatus);
orderRouter.patch('/:orderId/payment-paid',  updatePaymentPaidStatus);
orderRouter.get('single/:orderId', getOrdersById);


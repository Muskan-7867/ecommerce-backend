import { Order } from "../models/order.model.js";
import { Payemnt } from "../models/payment.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utills/asyncHandler.js";

const orderProduct = asyncHandler(async (req, res) => {
  const { quantity, orderItems, address, totalPrice, totalQuantity } = req.body;
  if (!quantity || !address || !totalPrice) {
    return res.status(400).json({
      success: false,
      message: "Please fill all the fields"
    });
  }

  const payment = await Payemnt.create({
    amount: totalPrice,
    paymentMethod: "online_payment"
  });

  const order = await Order.create({
    address,
    quantity,
    totalPrice,
    totalQuantity,
    payment: payment._id,
    orderItems,
    client: req.user._id,
    isPaid: payment ? true : false
  });

  if (order) {
    const user = await User.findById(req.user._id);
    user.order.push(order._id);
    await user.save();
  }

  return res.status(200).json({
    success: true,
    message: "Order Placed Successfully",
    orderId: order._id
  });
});

const getOrderProducts = asyncHandler(async (req, res) => {
  const order = await Order.find({ client: req.user._id })
    .populate("orderItems.product")
    .populate("payment");
  return res.status(200).json({
    success: true,
    message: "Order Placed Successfully",
    order
  });
});

const deleteOrderById = asyncHandler(async (req, res) => {
  const { orderid } = req.params;
  console.log("from backend", orderid);
  const order = await Order.findById(orderid);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found"
    });
  }

  const deleteOrder = await Order.findByIdAndDelete(orderid);
  console.log("deleteOrder", deleteOrder)
  return res.status(200).json({
    success: true,
    message: "Order Deleted Successfully"
  });
});

export { orderProduct, getOrderProducts , deleteOrderById};

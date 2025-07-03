// import { Order } from "../models/order.model.js";
// import { Product } from "../models/product.model.js";
// import { asyncHandler } from "../utills/asyncHandler.js";
// import { CreateRazorPayInstance } from "../config/razorpay.js";
// import crypto from "crypto";
// import { Payment } from "../models/payment.model.js";
// import { User } from "../models/user.model.js";
// import {
//   sendOrderConfirmationEmail,
//   sendOrderStatusUpdateEmail
// } from "../email/emailservice.js";

const Order = require("../models/ordermodel.js");
const Product = require("../models/productmodel.js");
const asyncHandler = require("../utills/asyncHandler.js");
const CreateRazorPayInstance = require("../config/razorpay.js");
const crypto = require("crypto");
const Payment = require("../models/paymentmodel.js");
const User = require("../models/usermodel.js");
const {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail
} = require("../email/emailservice.js");

const generateReceiptId = () => crypto.randomBytes(16).toString("hex");


const createRazorPayOrder = asyncHandler(async (req, res) => {
  const { productid, address, quantity, paymentMethod } = req.body;

  if (!productid || !address || !quantity) {
    return res.status(400).json({
      success: false,
      message: "Please fill all the fields"
    });
  }

  const userId = req.user?._id;
  const product = await Product.findById(productid);
  const user = await User.findById(userId);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found"
    });
  }

  const productPrice = product.price * quantity;
  const totalPrice = productPrice + product.deliveryCharges;
  const receipt_id = generateReceiptId();

  const options = {
    amount: totalPrice * 100,
    currency: "INR",
    receipt: receipt_id
  };

  try {
    const razorpayInstance = CreateRazorPayInstance();

    razorpayInstance.orders.create(options, async (error, razorpayOrder) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Something went wrong while creating the Razorpay order",
          error
        });
      } else {
        const newOrder = await Order.create({
          client: userId,
          address,
          quantity,
          totalPrice,
          totalQuantity: quantity,
          deliveryCharges: product.deliveryCharges,
          orderItems: [
            {
              product: product._id,
              quantity,
              price: product.price
            }
          ],
          payment: {
            razorpay_order_id: razorpayOrder.id,
            status: "Pending",
            paymentMethod
          }
        });

        if (user) {
          user.order = user.order || [];
          user.order.push(newOrder._id);
          await user.save();
        }

        return res.status(201).json({
          success: true,
          message: "Razorpay order created successfully",
          razorpayOrder: razorpayOrder,
          orderId: newOrder._id
        });
      }
    });
  } catch (error) {
    console.log("from backend", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the Razorpay order",
      error
    });
  }
});


const createRazorPayOrderOfCart = asyncHandler(async (req, res) => {
  const { cartProductIds, address, quantities, paymentMethod } = req.body;
  const userId = req.user?._id;

  if (!cartProductIds || cartProductIds.length === 0) {
    return res.status(400).json({ success: false, message: "Cart is empty" });
  }

  // Fetch all products by IDs
  const products = await Product.find({ _id: { $in: cartProductIds } });
  const user = await User.findById(userId);

  if (!products || products.length === 0) {
    return res
      .status(404)
      .json({ success: false, message: "No valid products found in cart" });
  }

  // Build orderItems array
  const orderItems = products.map((product) => ({
    product: product._id,
    price: product.price,
    quantity: quantities[product._id] || 1,
    paymentMethod
  }));

  const totalQuantity = orderItems.reduce(
    (acc, item) => acc + item.quantity,
    0
  );
  const productTotal = orderItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const deliveryCharges =
    products.length > 0
      ? products.reduce(
          (acc, product) => acc + (product.deliveryCharges || 0),
          0
        ) / products.length
      : 0;

  // Round to 2 decimal places if needed
  const roundedDeliveryCharges = Math.round(deliveryCharges * 100) / 100;
  const totalPrice = productTotal + roundedDeliveryCharges;

  const receipt_id = generateReceiptId();

  const options = {
    amount: totalPrice * 100, // in paise
    currency: "INR",
    receipt: receipt_id
  };

  const razorpayInstance = CreateRazorPayInstance();

  razorpayInstance.orders.create(options, async (error, razorpayOrder) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: "Error in creating Razorpay order",
        error
      });
    }

    const newOrder = await Order.create({
      client: userId,
      orderItems,
      address,
      totalQuantity,
      totalPrice,
      roundedDeliveryCharges,
      payment: {
        razorpay_order_id: razorpayOrder.id,
        status: "Pending",
        paymentMethod: paymentMethod
      },
      status: "pending"
    });

    if (user) {
      user.order = user.order || [];
      user.order.push(newOrder._id);
      await user.save();
    }

    return res.status(200).json({
      success: true,
      order: newOrder,
      razorpayOrder
    });
  });
});

const paymentVerify = asyncHandler(async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      paymentMethod
    } = req.body;
    console.log(
      "from payment verify",
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId ||
      !paymentMethod
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all the required fields"
      });
    }
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const hmac = crypto.createHmac("sha256", secret);
    const data = `${razorpay_order_id}|${razorpay_payment_id}`;
    hmac.update(data);
    const generatedSignature = hmac.digest("hex");
    console.log(
      "from paymentverify--> generated signature",
      generatedSignature
    );
    console.log(
      "from paymentverify --> razorpay signature",
      razorpay_signature
    );

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }

    const order = await Order.findById(orderId).populate("orderItems.product");
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await Payment.create({
      order: order._id,
      user: user._id,
      amount: order.totalPrice,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentMethod
    });

    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(
      order._id,
      {
        $set: {
          "payment.razorpay_payment_id": razorpay_payment_id,
          "payment.razorpay_signature": razorpay_signature,
          "payment.status": "Success",
          isPaid: true,
          status: "processing",
          paidAt: new Date(),
          paymentMethod: paymentMethod
        }
      },
      { new: true }
    ).populate("orderItems.product");
    const emailData = {
      order: {
        _id: updatedOrder._id,
        date: updatedOrder.createdAt.toLocaleDateString(),
        status: "Processing",
        items: updatedOrder.orderItems.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          total: (item.price * item.quantity).toFixed(2)
        })),
        subtotal: updatedOrder.totalPrice - updatedOrder.deliveryCharges,
        delivery: updatedOrder.deliveryCharges,
        grandTotal: updatedOrder.totalPrice,
        paymentMethod: paymentMethod
      },
      user: {
        name: user.username,
        email: user.email
      },
      address: updatedOrder.address
    };

    // Send confirmation email
    try {
      await sendOrderConfirmationEmail(emailData);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the request if email fails
    }
    return res.status(200).json({
      success: true,
      message: "Order payment verified and updated successfully",
      data: updatedOrder
    });
  } catch (error) {
    console.error("Internal server error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

const newOrder = asyncHandler(async (req, res) => {
  const {
    quantity,
    address,
    totalPrice,
    totalQuantity,
    orderItems,
    payment,
    status,
    isPaid,
    deliveryCharges,
    paymentMethod
  } = req.body;

  const order = await Order.create({
    client: req.user._id,
    quantity,
    address,
    totalPrice,
    totalQuantity,
    orderItems,
    payment,
    status,
    isPaid,
    deliveryCharges,
    paymentMethod
  });
  console.log("from order controller", order);
  const user = await User.findById(req.user._id);
  if (user) {
    user.order = user.order || [];
    user.order.push(order._id);
    await user.save();

    const products = await Product.find({
      _id: { $in: order.orderItems.map((item) => item.product) }
    }).select("name");

    // Create product map for easy lookup
    const productMap = products.reduce((map, product) => {
      map[product._id] = product.name;
      return map;
    }, {});

    // Prepare email data with proper mapping
    const emailData = {
      order: {
        _id: order._id,
        items: order.orderItems.map((item) => ({
          name: productMap[item.product] || "Product", // Fallback name
          quantity: item.quantity,
          price: item.price,
          total: (item.quantity * item.price).toFixed(2)
        })),
        subtotal: order.totalPrice.toFixed(2),
        delivery: order.deliveryCharges.toFixed(2),
        grandTotal: (order.totalPrice + order.deliveryCharges).toFixed(2),
        paymentMethod: order.paymentMethod,
        status: order.status,
        date: order.createdAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        })
      },
      user: {
        name: user.username,
        email: user.email
      },
      address: address // Assuming address contains the full address string
    };

    // Send email (fire and forget)
    sendOrderConfirmationEmail(emailData).catch((error) => {
      console.error("Email sending error:", error);
    });
  }

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    order
  });
});

const getClientByOrderId = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId)
    .populate("client")
    .populate("address");
  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found"
    });
  }
  res.status(200).json({
    success: true,
    message: "Order found",
    order
  });
});

const getOrderProducts = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("orderItems.product")
    .populate("payment");

  // If no orders exist for the user
  if (!orders || orders.length === 0) {
    return res.status(200).json({
      success: true,
      message: "You have not placed any orders yet.",
      orders: []
    });
  }

  // If orders are found
  return res.status(200).json({
    success: true,
    message: "Orders fetched successfully.",
    orders
  });
});

const deleteOrderById = asyncHandler(async (req, res) => {
  const { orderid } = req.params;
  console.log("from backend", orderid);

  // Find the order
  const order = await Order.findById(orderid);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found"
    });
  }

  // Get the user ID from the order
  const userId = order.client;

  // Delete the order
  await Order.findByIdAndDelete(orderid);

  // Remove the order reference from the user document
  if (userId) {
    await User.findByIdAndUpdate(
      userId,
      { $pull: { order: orderid } },
      { new: true }
    );
  }

  return res.status(200).json({
    success: true,
    message: "Order deleted successfully"
  });
});

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "processing", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    const user = await User.findById(order.client);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user) {
      sendOrderStatusUpdateEmail({
        order,
        user: {
          name: user.username,
          email: user.email
        },
        address: order.address,
        updateType: "Order Status",
        newStatus: status
      }).catch(console.error);
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    const validStatuses = ["success", "pending", "failed"];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { "payment.paymentStatus": paymentStatus },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    const user = await User.findById(order.client);
    if (user) {
      sendOrderStatusUpdateEmail({
        order,
        user: {
          name: user.username,
          email: user.email
        },
        address: order.address,
        updateType: "Payment Status",
        newStatus: paymentStatus
      }).catch(console.error);
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const updatePaymentPaidStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { isPaid } = req.body;

    const order = await Order.findByIdAndUpdate(
      orderId,
      { isPaid },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    const user = await User.findById(order.client);
    if (user) {
      sendOrderStatusUpdateEmail({
        order,
        user: {
          name: user.username,
          email: user.email
        },
        address: order.address,
        updateType: "Payment Completion",
        newStatus: isPaid ? "Completed" : "Pending"
      }).catch(console.error);
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const getOrdersById = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId)
      .populate("client")
      .populate("orderItems.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Format the response as needed
    const response = {
      id: order._id,
      status: order.status,
      totalPrice: order.totalPrice,
      itemname: order.orderItems.map((item) => item.product.name),
      quantity: order.orderItems.map((item) => item.quantity)
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getOrderProducts,
  deleteOrderById,
  createRazorPayOrder,
  newOrder,
  paymentVerify,
  getClientByOrderId,
  createRazorPayOrderOfCart,
  updateOrderStatus,
  updatePaymentStatus,
  updatePaymentPaidStatus,
  getOrdersById
};

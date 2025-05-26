import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { asyncHandler } from "../utills/asyncHandler.js";
import { CreateRazorPayInstance } from "../config/razorpay.js";
import crypto from "crypto";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";

const generateReceiptId = () => crypto.randomBytes(10).toString("hex");

// const orderProduct = asyncHandler(async (req, res) => {
//   const { quantity, orderItems, address, totalPrice, totalQuantity } = req.body;
//   if (!quantity || !address || !totalPrice) {
//     return res.status(400).json({
//       success: false,
//       message: "Please fill all the fields"
//     });
//   }

//   const payment = await Payemnt.create({
//     amount: totalPrice,
//     paymentMethod: "online_payment"
//   });

//   const order = await Order.create({
//     address,
//     quantity,
//     totalPrice,
//     totalQuantity,
//     payment: payment._id,
//     orderItems,
//     client: req.user._id,
//     isPaid: payment ? true : false
//   });

//   if (order) {
//     const user = await User.findById(req.user._id);
//     user.order.push(order._id);

//     await user.save();
//   }

//   return res.status(200).json({
//     success: true,
//     message: "Order Placed Successfully",
//     orderId: order._id
//   });
// });

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
    amount: totalPrice * 100, // Razorpay expects paise
    currency: "INR",
    receipt: receipt_id
  };

  try {
    const razorpayInstance = CreateRazorPayInstance();
    const razorpayOrder = await new Promise((resolve, reject) => {
      razorpayInstance.orders.create(options, (err, order) => {
        if (err) return reject(err);
        resolve(order);
      });
    });

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

    const user = await User.findById(userId);
    if (user) {
      user.order = user.order || []; // Keep existing orders
      user.order.push(newOrder._id); // Add new one
      await user.save();
    }

    console.log("from backend", newOrder);
    return res.status(201).json({
      success: true,
      message: "Razorpay order created successfully",
      razorpayOrder,
      orderId: newOrder._id
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
      error: error.message || error
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
  const deliveryCharges = products.reduce(
    (acc, product) => acc + (product.deliveryCharges || 0),
    0
  );
  const totalPrice = productTotal + deliveryCharges;

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
      deliveryCharges,
      payment: {
        razorpay_order_id: razorpayOrder.id,
        status: "Pending",
        paymentMethod: paymentMethod
      },
      status: "pending" // match enum
    });

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
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Save payment info
    await Payment.create({
      order: order._id,
      user: req.user?._id,
      amount: order.totalPrice,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentMethod,
      
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
    );

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
    client,
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
  console.log(
    client,
    quantity,
    address,
    totalPrice,
    totalQuantity,
    orderItems,
    payment,
    status,
    isPaid,
    paymentMethod
  );

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


export {
  getOrderProducts,
  deleteOrderById,
  createRazorPayOrder,
  newOrder,
  paymentVerify,
  getClientByOrderId,
  createRazorPayOrderOfCart
};

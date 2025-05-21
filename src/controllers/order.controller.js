import { Order } from "../models/order.model.js";

import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utills/asyncHandler.js";
import { CreateRazorPayInstance } from "../config/razorpay.js";
import  crypto  from "crypto";
import { Payment } from "../models/payment.model.js";

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
  const { productid, address, quantity , deliveryCharges} = req.body;

  if (!productid || !address || !quantity || !deliveryCharges) {
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
  const totalPrice = productPrice + deliveryCharges;
  const receipt_id = generateReceiptId();

  const options = {
    amount: totalPrice * 100, 
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
      address,
      quantity,
      totalPrice,
      totalQuantity: quantity,
      deliveryCharges,
      orderItems: [
        {
          product: product._id,
          quantity,
          price: product.price
        }
      ],
      payment: {
        razorpay_order_id: razorpayOrder.id,
        status: "Pending"
      },
      
    });

    return res.status(201).json({
      success: true,
      message: "Razorpay order created successfully",
      razorpayOrder,
      orderId: newOrder._id
    });
  });
});


const paymentVerify = asyncHandler(async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Please provide all the required fields"
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    const isAuthentic = generatedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }

    const order = await Order.findOne({
      "payment.razorpay_order_id": razorpay_order_id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    console.log("from order--" , req.user._id)
    await Payment.create({
      order: order._id,
      user: req.user?._id,
      amount: order.totalPrice,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    const updatedOrder = await Order.findByIdAndUpdate(
      order._id,
      {
        $set: {
          "payment.razorpay_payment_id": razorpay_payment_id,
          "payment.razorpay_signature": razorpay_signature,
          "payment.status": "Success",
          paidAt: new Date()
        }
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Order payment verified successfully",
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

const newOrder = asyncHandler(async(req, res) => {
 
  const {client, quantity, address, totalPrice, totalQuantity, orderItems, payment, status, isPaid, deliveryCharges} = req.body;
  console.log(client, quantity, address, totalPrice, totalQuantity, orderItems, payment, status, isPaid)

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
    deliveryCharges
  });
  res.status(201).json({
    success: true,
    message: "Order created successfully",
    order
  })

})

const getOrderProducts = asyncHandler(async (req, res) => {
  const orders = await Order.find({ client: req.user._id })
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
  const order = await Order.findById(orderid);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found"
    });
  }

  const deleteOrder = await Order.findByIdAndDelete(orderid);
  console.log("deleteOrder", deleteOrder);
  return res.status(200).json({
    success: true,
    message: "Order Deleted Successfully"
  });
});

export {  getOrderProducts, deleteOrderById , createRazorPayOrder, newOrder, paymentVerify};

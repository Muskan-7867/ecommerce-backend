import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    amount: {
      type: Number,
      required: true
    },

    paymentMethod: {
      type: String,
      default: "Cash on Delivery",
      required: true
    },
    paymentStatus: {
      type: String,
      default: "Pending",
      required: true
    },
    razorpay_order_id: {
      type: String,
      required: true
    },
    razorpay_payment_id: {
      type: String,
      required: true
    },
    razorpay_signature: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", PaymentSchema);

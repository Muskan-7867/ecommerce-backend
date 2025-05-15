import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
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
    }
  },
  { timestamps: true }
);

export const Payemnt = mongoose.model("Payment" , PaymentSchema)
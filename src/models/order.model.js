import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  quantity: {
    type: Number,
    required: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    required: true
  },
  status:{
    type: String,
    enum: ["pending", "shipped", "delivered", "cancelled"],
    default: "pending"
  }
});

export const Order = mongoose.model("Order", orderSchema);




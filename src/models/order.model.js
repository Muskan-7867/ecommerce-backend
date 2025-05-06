import mongoose from "mongoose";
const orderSchema = new mongoose.Schema({
  quantity: {
    type: Number,
    required: true
  },

  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  orderItems: [{
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }
  }],

  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    required: true
  },
  
  totalPrice : {
    type: Number,
    required: true
  },

  totalQuantity : {
    type: Number,
    required: true
  },

  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment"
  },

  isPaid: {
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    enum: ["pending", "shipped", "delivered", "cancelled"],
    default: "pending"
  },
  
}, { timestamps: true});

export const Order = mongoose.model("Order", orderSchema);

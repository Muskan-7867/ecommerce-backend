import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    quantity: {
      type: Number,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        price: Number,
        quantity: Number
      }
    ],

    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true
    },

    totalPrice: {
      type: Number,
      required: true
    },

    totalQuantity: {
      type: Number,
      required: true
    },

    payment: {
      razorpay_order_id: String,
      razorpay_payment_id: String,
      razorpay_signature: String,

      status: {
        type: String,
        enum: ["Pending", "Success", "Failed"],
        default: "Pending"
      },

      
  
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

    updatedAt: {
      type: Date,
      default: Date.now
    },

    isPaid: {
      type: Boolean,
      default: false
    },

    deliveryCharges: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ["pending", "processing", "delivered", "cancelled"],
     
    },
    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery", "online"],
      
    }
    
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);

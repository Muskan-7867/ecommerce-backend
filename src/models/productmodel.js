// import mongoose from "mongoose";
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  features: {
    type: String,
    required: true
  },
  images: [
    {
      publicId: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      }
    }
  ],
  originalPrice: {
    type: Number,
    
  },
  inStock: {
    type: Boolean,
    required: true,
    default: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    
  },
  deliveryCharges: {
    type: Number,
  }
}, {timestamps : true});
 const Product = mongoose.model("Product", productSchema);
module.exports = Product;
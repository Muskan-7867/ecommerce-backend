// import mongoose from "mongoose";
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
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

  approved: {
    type: Boolean,
    default: false
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    }
  ]
});

 const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
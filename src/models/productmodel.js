
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
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
    videos: [
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
      type: Number
    },
    inStock: {
      type: Boolean,
      required: true,
      default: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category"
    },
    deliveryCharges: {
      type: Number
    },
    slug: { type: String, unique: true, required: true },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        name: { type: String, required: true }, // store user name for quick display
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String }
      }
    ],
    numReviews: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    
  },
  { timestamps: true }
);


const Product = mongoose.model("Product", productSchema);
module.exports = Product;

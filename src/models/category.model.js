import mongoose from "mongoose";

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
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    }
  ]
});

export const Category = mongoose.model("Category", categorySchema);

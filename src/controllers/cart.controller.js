import { Product } from "../models/product.model.js";
import { asyncHandler } from "../utills/asyncHandler.js";
import mongoose from "mongoose";

export const getCartProducts = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return res.status(404).json("id is not in array");
  }

  const objectId = ids.map((id) => new mongoose.Types.ObjectId(id));
  const products = await Product.find({ _id: { $in: objectId } });

  res.status(200).json({ products, message: " products fetch successfully" });
});

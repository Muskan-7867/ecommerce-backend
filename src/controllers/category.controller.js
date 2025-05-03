import { asyncHandler } from "../utills/asyncHandler.js";
import { uploadMultipleImages } from "../utills/cloudinary.js";
import { Category } from "../models/category.model.js";
import fs from "fs";

export const AddCategory = asyncHandler(async (req, res) => {
  const { name, description, products } = req.body;
  console.log(" from name", name);

  if (!name || !description ) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "Please upload an image" });
  }

  console.log("from files" , req.files)

  const filePath = req.files.map((file) => file.path);
  const updateresult = await uploadMultipleImages(filePath, "uploads");

  req.files.forEach((file) => {
    fs.unlinkSync(file.path);
  });

  const images = updateresult.map((result) => ({
    publicId: result.public_id,
    url: result.secure_url
  }));

  const category = await Category.create({
    name,
    description,
    products,
    images
  });

  res.status(200).json({
    success: true,
    message: "category added successfully",
    category
  });
});

export const getAllCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find().populate("products");
    return res.status(200).json({
        success:true,
        message: "All Categories are fetched successfully",
        categories
    })
})

export const getProductByCategoryName = asyncHandler(async (req, res) => {
  const { name } = req.params;
  console.log("from category name", name);

  // Find the category by its 'name' instead of '_id'
  const category = await Category.findOne({ name }).populate("products");

  // If the category doesn't exist, return an error
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    products: category.products,  
  });
});


export const getProductByCategoryId = asyncHandler(async (req, res) => {
  const { Id } = req.params;
  console.log("from category id", Id);

  // Find the category by its 'name' instead of '_id'
  const category = await Category.findById(Id).populate("products");

  // If the category doesn't exist, return an error
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "From Category Id Products fetched successfully",
    products: category.products,  
  });
});

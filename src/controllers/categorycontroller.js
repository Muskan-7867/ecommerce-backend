// import { asyncHandler } from "../utills/asyncHandler.js";
// import { uploadMultipleImages } from "../utills/cloudinary.js";
// import { Category } from "../models/category.model.js";
// import fs from "fs";

const asyncHandler = require("../utills/asyncHandler.js");
const Category = require("../models/categorymodel.js");
const fs = require("fs");
const { uploadMultipleFiles } = require("../utills/cloudinary.js");

const AddCategory = asyncHandler(async (req, res) => {
  const { name, description, products, approved } = req.body;
  console.log(" from name", name);

  if (!name || !description) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "Please upload an image" });
  }

  console.log("from files", req.files);

  const filePath = req.files.map((file) => file.path);
  const updateresult = await uploadMultipleFiles(filePath, "uploads");

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
    images,
    approved
  });

  res.status(200).json({
    success: true,
    message: "category added successfully",
    category
  });
});

const getAllCategoriesForUser = asyncHandler(async (req, res) => {
  const categories = await Category.find({ approved: true }).populate(
    "products"
  );
  return res.status(200).json({
    success: true,
    message: "All Categories are fetched successfully",
    categories
  });
});

const getAllCategoriesForAdmin = asyncHandler(async (req, res) => {
  const categories = await Category.find().populate("products");
  return res.status(200).json({
    success: true,
    message: "All Categories are fetched successfully",
    categories
  });
});

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().populate("products");
  return res.status(200).json({
    success: true,
    message: "All Categories are fetched successfully",
    categories
  });
});

const getProductByCategoryName = asyncHandler(async (req, res) => {
  const { name } = req.params;
  console.log("from category name", name);

  // Find the category by its 'name' instead of '_id'
  const category = await Category.findOne({ name }).populate("products");

  // If the category doesn't exist, return an error
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found"
    });
  }

  return res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    products: category.products
  });
});

const getProductByCategoryId = asyncHandler(async (req, res) => {
  const { Id } = req.params;
  console.log("from category id", Id);

  // Find the category by its 'name' instead of '_id'
  const category = await Category.findById(Id).populate("products");

  // If the category doesn't exist, return an error
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found"
    });
  }

  return res.status(200).json({
    success: true,
    message: "From Category Id Products fetched successfully",
    products: category.products
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found"
    });
  }

  return res.status(200).json({
    success: true,
    message: "Category deleted successfully"
  });
});

const getCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const category = await Category.findById(categoryId);
  console.log("from backend", category);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found"
    });
  }

  category.approved = !category.approved;
  await category.save();
  return res.status(200).json({
    success: true,
    message: "Category fetched successfully",
    category: category
  });
});

// export { AddCategory, getAllCategoriesForUser, getAllCategoriesForAdmin, getProductByCategoryName, getProductByCategoryId , deleteCategory , getAllCategories, getCategory};
module.exports = {
  AddCategory,
  getAllCategoriesForUser,
  getAllCategoriesForAdmin,
  getProductByCategoryName,
  getProductByCategoryId,
  deleteCategory,
  getAllCategories,
  getCategory
};

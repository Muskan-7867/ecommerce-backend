// import { asyncHandler } from "../utills/asyncHandler.js";
// import { uploadMultipleImages } from "../utills/cloudinary.js";
// import { Category } from "../models/category.model.js";
// import fs from "fs";

const asyncHandler = require("../utills/asyncHandler.js");
const Category = require("../models/categorymodel.js");
const fs = require("fs");
const { uploadMultipleFiles } = require("../utills/cloudinary.js");
const  Product = require("../models/productmodel.js");

const AddCategory = asyncHandler(async (req, res) => {
  const { name, description, products, approved, slug } = req.body;

  if (!name || !description || !slug) {
    return res.status(400).json({ message: "Please fill all the required fields" });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "Please upload an image" });
  }

  const filePath = req.files.map((file) => file.path);
  const uploadResult = await uploadMultipleFiles(filePath, "categories");

  // Clean temp files
  req.files.forEach((file) => fs.unlinkSync(file.path));

  const images = uploadResult.map((result) => ({
    publicId: result.public_id,
    url: result.secure_url
  }));

  const category = await Category.create({
    name,
    description,
    slug,
    products: products || [],
    images,
    approved: approved ?? false
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    category
  });
});


const getAllCategoriesForUser = asyncHandler(async (req, res) => {
  const categories = await Category.find({ approved: true }).select('name slug _id').populate("products");

 

  return res.status(200).json({
    success: true,
    categories: categories || []
  });
});


const getAllCategoriesForAdmin = asyncHandler(async (req, res) => {
  const categories = await Category.find().populate("products");
  return res.status(200).json({
    success: true,
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

// const getProductByCategoryName = asyncHandler(async (req, res) => {
//   const { name } = req.params;
//   console.log("from category name", name);

//   // Find the category by its 'name' instead of '_id'
//   const category = await Category.findOne({ name }).populate("products");

//   // If the category doesn't exist, return an error
//   if (!category) {
//     return res.status(404).json({
//       success: false,
//       message: "Category not found"
//     });
//   }

//   return res.status(200).json({
//     success: true,
//     message: "Products fetched successfully",
//     products: category.products
//   });
// });




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

const getProductByCategorySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const category = await Category.findOne({ slug }).populate("products");
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found"
    });
  }

  return res.status(200).json({
    success: true,
    products: category.products
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, slug, approved } = req.body;

  // Find existing category
  const category = await Category.findById(id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  // Handle file uploads (if new images provided)
  let images = category.images; // keep old images
  if (req.files && req.files.length > 0) {
    const filePath = req.files.map((file) => file.path);
    const uploadResult = await uploadMultipleFiles(filePath, "categories");

    // Clean temp files
    req.files.forEach((file) => fs.unlinkSync(file.path));

    images = uploadResult.map((result) => ({
      publicId: result.public_id,
      url: result.secure_url,
    }));
  }

  // Update fields
  category.name = name || category.name;
  category.description = description || category.description;
  category.slug = slug || category.slug;
  category.approved = approved ?? category.approved;
  category.images = images;

  await category.save();

  return res.status(200).json({
    success: true,
    message: "Category updated successfully",
    category,
  });
});

const getRelatedProductsByCategorySlug = async (req , res) => {
  try {
    const { slug } = req.params;

    // Find category by slug
    const category = await Category.findOne({ slug });
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Find products under that category
    const products = await Product.find({ category: category._id })
      .populate("category", "name slug") // optional
      .exec();
    console.log("from backend", products)
    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error fetching products by slug:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching products by slug",
    });
  }
}


// export { AddCategory, getAllCategoriesForUser, getAllCategoriesForAdmin, getProductByCategoryName, getProductByCategoryId , deleteCategory , getAllCategories, getCategory};
module.exports = {
  AddCategory,
  getAllCategoriesForUser,
  getAllCategoriesForAdmin,
  getProductByCategorySlug,
  getProductByCategoryId,
  deleteCategory,
  getAllCategories,
  getCategory,
  getProductByCategorySlug,
  updateCategory,
  getRelatedProductsByCategorySlug
};

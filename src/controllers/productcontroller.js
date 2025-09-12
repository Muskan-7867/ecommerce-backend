// import { Category } from "../models/category.model.js";
// import { Product } from "../models/product.model.js";
// import { asyncHandler } from "../utills/asyncHandler.js";
// import fs from "fs";
// import {
//   deleteMultipleImages,
//   uploadMultipleImages
// } from "../utills/cloudinary.js";
// import mongoose from "mongoose";

const Category = require("../models/categorymodel.js");
const Product = require("../models/productmodel.js");
const asyncHandler = require("../utills/asyncHandler.js");
const fs = require("fs");
const {
  deleteMultipleImages,
  uploadMultipleFiles,
  uploadImage
} = require("../utills/cloudinary.js");
const mongoose = require("mongoose");
const path = require("path");

//createproduct
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    slug,
    features,
    originalPrice,
    category,
    inStock,
    deliveryCharges
  } = req.body;

  if (!slug) {
      slug = slugify(name, { lower: true, strict: true });
    }

  if (!name || !description || !price || !features) {
    return res
      .status(400)
      .json({ error: "Please fill all the required fields" });
  }

  if ((!req.files || (!req.files.images && !req.files.videos))) {
    return res
      .status(400)
      .json({ error: "Please upload at least one image or video" });
  }

  // Handle images
  const imagePaths = req.files.images ? req.files.images.map((f) => f.path) : [];
  const videoPaths = req.files.videos ? req.files.videos.map((f) => f.path) : [];

  let uploadedImages = [];
  let uploadedVideos = [];

  try {
    // Upload images
    if (imagePaths.length > 0) {
      const uploadResults = await uploadMultipleFiles(imagePaths, "uploads");
      uploadedImages = uploadResults.map((result) => ({
        publicId: result.public_id,
        url: result.secure_url,
      }));
    }

    // Upload videos
    if (videoPaths.length > 0) {
      const uploadResults = await uploadMultipleVideos(videoPaths, "uploads");
      uploadedVideos = uploadResults.map((result) => ({
        publicId: result.public_id,
        url: result.secure_url,
      }));
    }

    // Create product
    const product = await Product.create({
      name,
      description,
      price,
      slug,
      features,
      images: uploadedImages,
      videos: uploadedVideos,
      inStock,
      originalPrice,
      category: category || undefined,
      deliveryCharges,
    });

    if (category) {
      const productCategory = await Category.findById(category);
      if (!productCategory) {
        return res.status(404).json({ error: "Category not found" });
      }
      productCategory.products.push(product._id);
      await productCategory.save();
    }

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    // Clean up if upload fails
    if (uploadedImages.length > 0) {
      await deleteMultipleImages(uploadedImages.map((r) => r.publicId));
    }
    if (uploadedVideos.length > 0) {
      await deleteMultipleVideos(uploadedVideos.map((r) => r.publicId));
    }
    throw error;
  } finally {
    // Always clean local files
    await cleanupTempFiles([...imagePaths, ...videoPaths]);
  }
});

// Video uploader helper
async function uploadMultipleVideos(filePaths, folder) {
  const cloudinary = require("cloudinary").v2;
  return Promise.all(
    filePaths.map((path) =>
      cloudinary.uploader.upload(path, {
        resource_type: "video",
        folder,
      })
    )
  );
}

async function deleteMultipleVideos(publicIds) {
  const cloudinary = require("cloudinary").v2;
  return Promise.all(
    publicIds.map((id) =>
      cloudinary.uploader.destroy(id, { resource_type: "video" })
    )
  );
}


async function cleanupTempFiles(filePaths) {
  if (!filePaths) return;

  const deletionPromises = filePaths.map((filePath) => {
    // Ensure we're always cleaning from /public/temp
    const resolvedPath = path.resolve(filePath);

    return new Promise((resolve) => {
      fs.access(resolvedPath, fs.constants.F_OK, (err) => {
        if (err) {
          console.log(`File ${resolvedPath} doesn't exist, skipping deletion`);
          return resolve();
        }

        fs.unlink(resolvedPath, (unlinkErr) => {
          if (unlinkErr) {
            console.warn(
              `Error deleting temp file ${resolvedPath}:`,
              unlinkErr.message
            );
          } else {
            console.log(`Successfully deleted temp file: ${resolvedPath}`);
          }
          resolve();
        });
      });
    });
  });

  await Promise.all(deletionPromises);
}
// Controller Function - Get All Products
const getAllProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find().populate("category", "name");
    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products"
    });
  }
});

const getFilteredProducts = asyncHandler(async (req, res) => {
  // Use only query parameters
  const maxPrice = Number(req.query.maxPrice) || 100000000;
  const minPrice = Number(req.query.minPrice) || 0;
  const limit = Number(req.query.limit) || 9;
  const page = Number(req.query.page) || 1;
  const categoryId = req.query.category || "all";
  const search = req.query.search;
  
  const filter = {
    price: { $gte: minPrice, $lte: maxPrice }
  };

  if (categoryId !== "all") {
    filter.category = categoryId;
  }

  if (search && search !== "-" && !search.startsWith("-")) {
    filter.name = { $regex: search, $options: "i" };
  }
  
  const products = await Product.find(filter)
    .populate("category", "name")
    .skip((page - 1) * limit)
    .limit(limit);

  const totalProduct = await Product.countDocuments(filter);

  return res.status(200).json({
    success: true,
    message:
      products.length > 0
        ? "Products fetched successfully"
        : "No products matched the filters.",
    totalProduct,
    products
  });
});


//get product by single id
const getProductsById = asyncHandler(async (req, res) => {
  const { singleproductid } = req.params;
  const product = await Product.findById(singleproductid);
  console.log("from get", product);
  if (!product) {
    return res.json({
      success: false,
      message: "Product not Found"
    });
  }
  res.status(200).json({
    success: true,
    message: "Product fetched successfully",
    product
  });
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const product = await Product.findOne({ slug });
  console.log("from get", product);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not Found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Product fetched successfully",
    product,
  });
});


//deleteProduct
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log("from id", id);
  const product = await Product.findById(id);
  console.log(product);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product Not Found!!"
    });
  }
  const result = await deleteMultipleImages(product.images);
  console.log(result);

  const deletedProduct = await Product.findByIdAndDelete(id);
  console.log(deletedProduct);

  res.status(200).json({
    success: true,
    message: "Product deleted successfully"
  });
});

//updateProduct
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    price,
    features,
    inStock,
    category,
    slug,
    deliveryCharges,
  } = req.body;

  // Find product
  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  // Update text fields

  product.description = description || product.description;
  product.price = price || product.price;
  product.features = features || product.features;
  product.inStock = inStock !== undefined ? inStock : product.inStock;
  product.category = category || product.category;
  product.deliveryCharges =
    deliveryCharges !== undefined
      ? deliveryCharges
      : product.deliveryCharges;
  product.slug = slug || product.slug;
  // Handle file uploads (multer puts them in req.files)
  if (req.files) {
    // Handle images
    if (req.files.images && req.files.images.length > 0) {
      const imagePaths = req.files.images.map((f) => f.path);
      const uploadedImages = await uploadMultipleFiles(imagePaths, "uploads");

      // Delete old images from Cloudinary
      if (product.images?.length > 0) {
        await deleteMultipleImages(product.images.map((img) => img.publicId));
      }

      // Replace with new images
      product.images = uploadedImages.map((result) => ({
        publicId: result.public_id,
        url: result.secure_url,
      }));

      // Cleanup temp files
      await cleanupTempFiles(imagePaths);
    }

    // Handle videos
    if (req.files.videos && req.files.videos.length > 0) {
      const videoPaths = req.files.videos.map((f) => f.path);
      const uploadedVideos = await Promise.all(
        videoPaths.map((path) =>
          uploadImage(path, "uploads") // uploadImage handles videos too (resource_type: "auto")
        )
      );

      // Delete old videos from Cloudinary
      if (product.videos?.length > 0) {
        await deleteMultipleImages(product.videos.map((vid) => vid.publicId));
      }

      // Replace with new videos
      product.videos = uploadedVideos.map((result) => ({
        publicId: result.public_id,
        url: result.secure_url,
      }));

      // Cleanup temp files
      await cleanupTempFiles(videoPaths);
    }
  }

  await product.save();

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product,
  });
});


const getFilteredProductsQuery = asyncHandler(async (req, res) => {
  // Read from query parameters
  const maxPrice = Number(req.query.maxPrice) || 1000000000000;
  const minPrice = Number(req.query.minPrice) || 0;
  const limit = Number(req.query.limit);
  const page = Number(req.query.page) || 1;
  const categoryId = req.query.category || null;
  const search = req.query.search || "";

  // Build the filter
  const filter = {
    price: { $gte: minPrice, $lte: maxPrice }
  };

  if (categoryId && categoryId !== "all") {
    filter.category = categoryId;
  }

  if (search && !search.startsWith("-")) {
    filter.name = { $regex: search, $options: "i" };
  }

  console.log("Final filter object:", filter);

  const products = await Product.find(filter)
    .populate("category", "name")
    .skip((page - 1) * limit)
    .limit(limit);

  const totalProduct = await Product.countDocuments(filter);

  return res.status(200).json({
    success: true,
    message:
      products.length > 0
        ? "Products fetched successfully"
        : "No products matched the filters.",
    totalProduct,
    products
  });
});

const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;

  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  // Check if user already reviewed
  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    // update existing review
    alreadyReviewed.rating = rating;
    alreadyReviewed.comment = comment;
  } else {
    // add new review
    const review = {
       user: req.user?._id || "6896f366894a4964331753a3",
  name: req.user?.name || "Muskan",
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
  }

  // update average rating
  product.averageRating =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  await product.save();

  res.status(201).json({
    success: true,
    message: "Review added/updated successfully",
    reviews: product.reviews,
    averageRating: product.averageRating,
    numReviews: product.numReviews,
  });
});

const getProductReviews = asyncHandler(async (req, res) => {
  const productId = req.params.id;

  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews, // returns array of reviews
    numReviews: product.numReviews,
    averageRating: product.averageRating,
  });
});

module.exports = {
  createProduct,
  getAllProducts,
  getFilteredProducts,
  getProductsById,
  deleteProduct,
  updateProduct,
  getFilteredProductsQuery,
  addReview,
  getProductReviews,
  getProductBySlug
};

import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { asyncHandler } from "../utills/asyncHandler.js";
import fs from "fs";
import { deleteMultipleImages, uploadMultipleImages } from "../utills/cloudinary.js";
import mongoose from "mongoose";

//createproduct
export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, features, originalPrice, category, inStock, deliveryCharges } = req.body;
  
  if (!name || !description || !price || !features) {
    return res.status(400).json({ error: "Please fill all the required fields" });
  }
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "Please upload at least one image" });
  }
  
  if (category && !mongoose.Types.ObjectId.isValid(category)) {
    return res.status(400).json({ error: "Invalid category. Please select a valid one or leave it empty." });
  }
  
  const filePaths = req.files.map((file) => file.path);
  let uploadResults;
  
  try {
    uploadResults = await uploadMultipleImages(filePaths, "uploads");
    
    const images = uploadResults.map((result) => ({
      publicId: result.public_id,
      url: result.secure_url
    }));
    
    const product = await Product.create({
      name,
      description,
      price,
      features,
      images,
      inStock,
      originalPrice,
      category: category || undefined,
      deliveryCharges
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
      product
    });
  } catch (error) {
    // Clean up any uploaded images if product creation fails
    if (uploadResults) {
      // Implement a function to delete uploaded images from cloud storage
      await deleteUploadedImages(uploadResults.map(r => r.public_id));
    }
    throw error; // Let asyncHandler handle it
  } finally {
    // Clean up temp files regardless of success/failure
    await cleanupTempFiles(filePaths);
  }
});

async function cleanupTempFiles(filePaths) {
  if (!filePaths) return;
  
  const deletionPromises = filePaths.map(filePath => {
    return new Promise((resolve) => {
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
          console.log(`File ${filePath} doesn't exist, skipping deletion`);
          return resolve();
        }
        
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.warn(`Error deleting temp file ${filePath}:`, unlinkErr.message);
          } else {
            console.log(`Successfully deleted temp file: ${filePath}`);
          }
          resolve();
        });
      });
    });
  });
  
  await Promise.all(deletionPromises);
}
// Controller Function - Get All Products
export const getAllProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find().populate("category", "name"); 
    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});


export const getFilteredProducts = asyncHandler(async (req, res) => {
  const maxPrice = Number(req.params.maxPrice) || 100000000;
  const minPrice = Number(req.params.minPrice) || 0;
  const limit = Number(req.params.limit) || 9;
  const page = Number(req.params.page) || 1;
  const categoryId = req.params.category || "all";
  const search = req.params.search;
  const filter = {
    price: { $gte: minPrice, $lte: maxPrice }
  };

  if (categoryId !== "all") {
    filter.category = categoryId;
  }

  if (search && !search.startsWith("-")) {
    filter.name = { $regex: search, $options: "i" };
  }
  const products = await Product.find(filter)
    .populate("category", "name")
    .skip((page - 1) * limit)
    .limit(limit);

  const totalProduct = await Product.countDocuments(filter);

  return res.status(200).json({
    success: true,
    message: products.length > 0 ? "Products fetched successfully" : "No products matched the filters.",
    totalProduct,
    products
  });
});


//get product by single id
export const getProductsById = asyncHandler(async (req, res) => {
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

//deleteProduct
export const deleteProduct = asyncHandler(async (req, res) => {
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
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, price, features, inStock, category , deliveryCharges} =
    req.body;

  console.log("from bakcend" , name, description, price, features, inStock, category, deliveryCharges)

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "product not found"
    });
  }
  product.name = name || product.name;
  (product.description = description || product.description),
    (product.price = price || product.price),
    (product.features = features || product.features),
    (product.inStock = inStock || product.inStock),
    (product.category = category || product.category),
    (product.deliveryCharges = deliveryCharges || product.deliveryCharges);
    await product.save();
  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product
  });
});

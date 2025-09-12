// import { Router } from "express";
// import {
//   createProduct,
//   deleteProduct,
//   getAllProducts,
//   getFilteredProducts,
//   getFilteredProductsQuery,
//   getProductsById,
//   updateProduct
// } from "../controllers/product.controller.js";
// import upload from "../middleware/multer.js";
// import { getCartProducts } from "../controllers/cart.controller.js";
// import {AddCategory,deleteCategory,getAllCategories,
//  getAllCategoriesForAdmin,
// getAllCategoriesForUser,
//  getCategory,
//  getProductByCategoryId,
// getProductByCategoryName
// }from "../controllers/category.controller.js";

const express = require("express");
const {
  createProduct,
  deleteProduct,
  getAllProducts,
  getFilteredProducts,
  getFilteredProductsQuery,
  getProductsById,
  updateProduct,
  addReview,
  getProductReviews,
  getProductBySlug
} = require("../controllers/productcontroller.js");
const upload = require("../middleware/multer.js");
const { getCartProducts } = require("../controllers/cartcontroller.js");
const {
  AddCategory,
  deleteCategory,
  getAllCategories,
  getAllCategoriesForAdmin,
  getAllCategoriesForUser,
  getCategory,
  getProductByCategoryId,
  getProductByCategoryName
} = require("../controllers/categorycontroller.js");
const { protect } = require("../middleware/protect.js");

const productRouter = express.Router();
productRouter.post(
  "/create",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 }
  ]),
  createProduct
);

productRouter.delete("/delete/:id", deleteProduct);
productRouter.get("/get", getFilteredProducts);
// productRouter.get("/get/:limit?/:page?/:minPrice?/:maxPrice?/:category?/:search?", getFilteredProducts);
productRouter.get("/all", getAllProducts);
productRouter.get("/single/:singleproductid", getProductsById);
productRouter.put("/update/:id", upload.fields([
  { name: "images", maxCount: 5 },
  { name: "videos", maxCount: 2 }
]), updateProduct);

productRouter.post("/cartproducts", getCartProducts);
productRouter.post("/category", upload.array("images"), AddCategory);
productRouter.get("/categoryid/:Id", getProductByCategoryId);
productRouter.get("/usercategories", getAllCategoriesForUser);
productRouter.get("/categories", getAllCategories);
productRouter.get("/category/:categoryId", getCategory);
productRouter.get("/admincategories", getAllCategoriesForAdmin);
productRouter.get("/category/name/:name", getProductByCategoryName);
productRouter.get("/getquery", getFilteredProductsQuery);
productRouter.delete("/category/delete/:id", deleteCategory);
productRouter.post("/:id/reviews", protect, addReview);
productRouter.get("/:id/reviews", getProductReviews);
productRouter.get("/slug/:slug", getProductBySlug);


module.exports = productRouter;

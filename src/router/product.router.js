import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getFilteredProducts,
  getProductsById,
  updateProduct
} from "../controllers/product.controller.js";
import upload from "../middleware/multer.js";
import { getCartProducts } from "../controllers/cart.controller.js";
import {
  AddCategory,
  getAllCategories,
  getProductByCategoryId,
  getProductByCategoryName
} from "../controllers/category.controller.js";

export const productRouter = Router();

productRouter.post("/create", upload.array("images"), createProduct);
productRouter.delete("/delete/:id", deleteProduct);
productRouter.get("/get/:limit/:page/:minPrice/:maxPrice/:category/:search",getFilteredProducts);
productRouter.get("/all", getAllProducts);
productRouter.get("/single/:id", getProductsById);
productRouter.put("/update/:id", updateProduct);
productRouter.post("/cartproducts", getCartProducts);
productRouter.post("/category", upload.array("images"), AddCategory);
productRouter.get("/categoryid/:Id", getProductByCategoryId);
productRouter.get("/categories", getAllCategories);
productRouter.get("/category/:name", getProductByCategoryName);

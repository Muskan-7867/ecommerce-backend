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
import {AddCategory,getAllCategories,
 getAllCategoriesForAdmin,
getAllCategoriesForUser,
 getCategory,
 getProductByCategoryId,
getProductByCategoryName
}from "../controllers/category.controller.js";


export const productRouter = Router();

productRouter.post("/create", upload.array("images"), createProduct);
productRouter.delete("/delete/:id", deleteProduct);
productRouter.get("/get/:limit/:page/:minPrice/:maxPrice/:category/:search",getFilteredProducts);
productRouter.get("/all", getAllProducts);
productRouter.get("/single/:singleproductid", getProductsById);
productRouter.put("/update/:id", updateProduct);
productRouter.post("/cartproducts", getCartProducts);
productRouter.post("/category", upload.array("images"), AddCategory);
productRouter.get("/categoryid/:Id", getProductByCategoryId);
productRouter.get("/usercategories", getAllCategoriesForUser);
productRouter.get("/categories", getAllCategories);
productRouter.get("/category/:categoryId", getCategory);
productRouter.get("/admincategories", getAllCategoriesForAdmin);
productRouter.get("/category/name/:name", getProductByCategoryName);






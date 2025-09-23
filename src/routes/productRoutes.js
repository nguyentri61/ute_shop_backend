import express from "express";
import {
  allProducts,
  paginatedProducts,
  newestProducts,
  bestSellingProducts,
  mostViewedProducts,
  topDiscountProducts,
  getProductById,
  createReview,
  getSimilarProducts,
  getProductsByCategory,
  getProducts
} from "../controllers/productController.js";
import {
  authMiddleware,
  adminMiddleware,
} from "../middlewares/authMiddlewares.js";
import { ro } from "date-fns/locale";
const router = express.Router();

router.get("/", getProducts);
router.get("/all", allProducts);
router.get("/paginated-products", paginatedProducts);
router.get("/newest", newestProducts);
router.get("/best-selling", bestSellingProducts);
router.get("/most-viewed", mostViewedProducts);
router.get("/top-discount", topDiscountProducts);
router.get("/:id", getProductById);
router.get("/:id/similar", getSimilarProducts);
router.post("/:id/reviews", authMiddleware, createReview);
router.get("/category/:categoryId", getProductsByCategory);
export default router;

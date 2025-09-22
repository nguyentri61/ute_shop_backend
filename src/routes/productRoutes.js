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
} from "../controllers/productController.js";
import {
  authMiddleware,
  adminMiddleware,
} from "../middlewares/authMiddlewares.js";
const router = express.Router();

router.get("/all", allProducts);
router.get("/paginated-products", paginatedProducts);
router.get("/newest", newestProducts);
router.get("/best-selling", bestSellingProducts);
router.get("/most-viewed", mostViewedProducts);
router.get("/top-discount", topDiscountProducts);
router.get("/:id", getProductById);
router.get("/:id/similar", getSimilarProducts);
router.post("/:id/reviews", authMiddleware, createReview);
export default router;

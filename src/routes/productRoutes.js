import express from "express";
import {
  allProducts,
  paginatedProducts,
  newestProducts,
  bestSellingProducts,
  mostViewedProducts,
  topDiscountProducts,
  getProductById,
} from "../controllers/productController.js";
const router = express.Router();

router.get("/all", allProducts);
router.get("/paginated-products", paginatedProducts);
router.get("/newest", newestProducts);
router.get("/best-selling", bestSellingProducts);
router.get("/most-viewed", mostViewedProducts);
router.get("/top-discount", topDiscountProducts);
router.get("/:id", getProductById);
export default router;

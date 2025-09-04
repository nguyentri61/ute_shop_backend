import express from "express";
import {
    allProducts,
    paginatedProducts,
    newestProducts,
    bestSellingProducts,
    mostViewedProducts,
    topDiscountProducts
} from "../controllers/productController.js";
const router = express.Router();

router.get("/all", allProducts);
router.get("/paginated-products", paginatedProducts)
router.get("/newest", newestProducts);
router.get("/best-selling", bestSellingProducts);
router.get("/most-viewed", mostViewedProducts);
router.get("/top-discount", topDiscountProducts);

export default router;

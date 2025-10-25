import express from "express";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddlewares.js";
import {
    // ADMIN - coupons
    getCouponStats,
    getCouponDistribution,
    getExpiringCoupons,
    listCoupons,
    createCoupons,
    updateCoupon,
    deleteCoupon,
} from "../controllers/couponController.js";
import { getDashboardStats, weeklySales, categoryShare } from "../controllers/dashboardController.js";

// NEW: category controller
import {
    listCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

// Tất cả endpoint dashboard / admin yêu cầu đăng nhập
router.use(authMiddleware);

// Thống kê tổng quan (cards)
router.get("/dashboard/stats", getDashboardStats);

// Doanh thu tuần (Area chart T2..CN)
router.get("/dashboard/weekly-sales", weeklySales);
router.get("/dashboard/category-share", categoryShare);

// --- COUPONS (ADMIN) -----------------------------------------
router.get("/coupons/stats", adminMiddleware, getCouponStats);
router.get("/coupons/distribution", adminMiddleware, getCouponDistribution);
router.get("/coupons/expiring", adminMiddleware, getExpiringCoupons);

// GET /admin/coupons?q=&type=&status=&userId=&page=&size=
router.get("/coupons", adminMiddleware, listCoupons);

// POST /admin/coupons
router.post("/coupons", adminMiddleware, createCoupons);

// PATCH /admin/coupons/:id
router.patch("/coupons/:id", adminMiddleware, updateCoupon);

// DELETE /admin/coupons/:id
router.delete("/coupons/:id", adminMiddleware, deleteCoupon);

// --- CATEGORIES (ADMIN) --------------------------------------
// GET /admin/categories?q=&page=&size=
router.get("/categories", adminMiddleware, listCategories);

// GET /admin/categories/:id
router.get("/categories/:id", adminMiddleware, getCategory);

// POST /admin/categories
// body: { name, icon? }
router.post("/categories", adminMiddleware, createCategory);

// PATCH /admin/categories/:id
// body: { name?, icon? }
router.patch("/categories/:id", adminMiddleware, updateCategory);

// DELETE /admin/categories/:id
router.delete("/categories/:id", adminMiddleware, deleteCategory);

export default router;

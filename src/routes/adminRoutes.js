import express from "express";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddlewares.js";
import {
    // ADMIN
    getCouponStats,
    getCouponDistribution,
    getExpiringCoupons,
    listCoupons,
    createCoupons,
    updateCoupon,
    deleteCoupon,
} from "../controllers/couponController.js";
import { getDashboardStats, weeklySales, categoryShare } from "../controllers/dashboardController.js";

const router = express.Router();

// Tất cả endpoint dashboard yêu cầu đăng nhập
router.use(authMiddleware);

// Thống kê tổng quan (cards)
router.get("/dashboard/stats", getDashboardStats);

// Doanh thu tuần (Area chart T2..CN)
router.get("/dashboard/weekly-sales", weeklySales);
router.get("/dashboard/category-share", categoryShare);

// GET /admin/coupons/stats
router.get("/coupons/stats", adminMiddleware, getCouponStats);

// GET /admin/coupons/distribution
router.get("/coupons/distribution", adminMiddleware, getCouponDistribution);

// GET /admin/coupons/expiring?days=30
router.get("/coupons/expiring", adminMiddleware, getExpiringCoupons);

// GET /admin/coupons?q=&type=&status=&userId=&page=&size=
router.get("/coupons", adminMiddleware, listCoupons);

// POST /admin/coupons
router.post("/coupons", adminMiddleware, createCoupons);

// PATCH /admin/coupons/:id
router.patch("/coupons/:id", adminMiddleware, updateCoupon);

// DELETE /admin/coupons/:id
router.delete("/coupons/:id", adminMiddleware, deleteCoupon);

export default router;

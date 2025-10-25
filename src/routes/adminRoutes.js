// src/routes/adminRoutes.js
import express from "express";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddlewares.js";
import { uploadMedia } from "../middlewares/uploadMedia.js";
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

// Categories (admin)
import {
    listCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
} from "../controllers/categoryController.js";

// Users (admin)
import {
    listAdminUsers,
    getAdminUser,
    createAdminUser,
    updateAdminUser,
    deleteAdminUser,
    unblockAdminUser,    // <-- mở chặn
    changeUserRole,      // <-- đổi vai trò
} from "../controllers/adminUserController.js";

import {
    listAdminProducts,
    getAdminProduct,
    createAdminProduct,
    updateAdminProduct,
    deleteAdminProduct,
} from "../controllers/adminProductController.js";


const router = express.Router();

// Tất cả endpoint dashboard / admin yêu cầu đăng nhập
router.use(authMiddleware);

// --- DASHBOARD ----------------------------------------------
// Dashboard endpoints require auth (not necessarily admin)
router.get("/dashboard/stats", getDashboardStats);
router.get("/dashboard/weekly-sales", weeklySales);
router.get("/dashboard/category-share", categoryShare);

// --- COUPONS (ADMIN) -----------------------------------------
router.get("/coupons/stats", adminMiddleware, getCouponStats);
router.get("/coupons/distribution", adminMiddleware, getCouponDistribution);
router.get("/coupons/expiring", adminMiddleware, getExpiringCoupons);

// GET /api/admin/coupons?q=&type=&status=&userId=&page=&size=
router.get("/coupons", adminMiddleware, listCoupons);

// POST /api/admin/coupons
router.post("/coupons", adminMiddleware, createCoupons);

// PATCH /api/admin/coupons/:id
router.patch("/coupons/:id", adminMiddleware, updateCoupon);

// DELETE /api/admin/coupons/:id
router.delete("/coupons/:id", adminMiddleware, deleteCoupon);

// --- CATEGORIES (ADMIN) --------------------------------------
// GET /api/admin/categories?q=&page=&size=
router.get("/categories", adminMiddleware, listCategories);

// GET /api/admin/categories/:id
router.get("/categories/:id", adminMiddleware, getCategory);

// POST /api/admin/categories
// body: { name, icon? }
router.post("/categories", adminMiddleware, createCategory);

// PATCH /api/admin/categories/:id
// body: { name?, icon? }
router.patch("/categories/:id", adminMiddleware, updateCategory);

// DELETE /api/admin/categories/:id
router.delete("/categories/:id", adminMiddleware, deleteCategory);

// --- USERS (ADMIN) ------------------------------------------
// GET /api/admin/users?q=&role=&start=&end=&page=&size=
router.get("/users", adminMiddleware, listAdminUsers);

// GET /api/admin/users/:id
router.get("/users/:id", adminMiddleware, getAdminUser);

// POST /api/admin/users
// body: { email, fullName, phone?, role?, address? }
router.post("/users", adminMiddleware, createAdminUser);

// PATCH /api/admin/users/:id
// body: { fullName?, phone?, role?, address?, verified? }
router.patch("/users/:id", adminMiddleware, updateAdminUser);

// DELETE /api/admin/users/:id
// NOTE: backend should implement soft-block in deleteAdminUser
router.delete("/users/:id", adminMiddleware, deleteAdminUser);

// PATCH /api/admin/users/:id/unblock  -> mở chặn tài khoản
router.patch("/users/:id/unblock", adminMiddleware, unblockAdminUser);

// PATCH /api/admin/users/:id/role -> thay đổi vai trò (body: { role: "ADMIN"|"USER" })
router.patch("/users/:id/role", adminMiddleware, changeUserRole);
router.get("/products", adminMiddleware, listAdminProducts);
router.get("/products/:id", adminMiddleware, getAdminProduct);

// POST /api/admin/products
router.post("/products", adminMiddleware, uploadMedia.array("files", 10), createAdminProduct);

// PATCH /api/admin/products/:id
router.patch("/products/:id", adminMiddleware, uploadMedia.array("files", 10), updateAdminProduct);

// DELETE
router.delete("/products/:id", adminMiddleware, deleteAdminProduct);
export default router;

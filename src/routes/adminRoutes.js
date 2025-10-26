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
    unblockAdminUser,
    changeUserRole,
} from "../controllers/adminUserController.js";

// Products (admin)
import {
    listAdminProducts,
    getAdminProduct,
    createAdminProduct,
    updateAdminProduct,
    deleteAdminProduct,
} from "../controllers/adminProductController.js";

const router = express.Router();

// All admin routes require authentication
router.use(authMiddleware);

// --- DASHBOARD ----------------------------------------------
router.get("/dashboard/stats", getDashboardStats);
router.get("/dashboard/weekly-sales", weeklySales);
router.get("/dashboard/category-share", categoryShare);

// --- COUPONS (ADMIN) -----------------------------------------
router.get("/coupons/stats", adminMiddleware, getCouponStats);
router.get("/coupons/distribution", adminMiddleware, getCouponDistribution);
router.get("/coupons/expiring", adminMiddleware, getExpiringCoupons);

router.get("/coupons", adminMiddleware, listCoupons);
router.post("/coupons", adminMiddleware, createCoupons);
router.patch("/coupons/:id", adminMiddleware, updateCoupon);
router.delete("/coupons/:id", adminMiddleware, deleteCoupon);

// --- CATEGORIES (ADMIN) --------------------------------------
// List / Get
router.get("/categories", adminMiddleware, listCategories);
router.get("/categories/:id", adminMiddleware, getCategory);

// POST /api/admin/categories
router.post("/categories", adminMiddleware, uploadMedia.single("file"), createCategory);

// PATCH /api/admin/categories/:id
router.patch("/categories/:id", adminMiddleware, uploadMedia.single("file"), updateCategory);

// Delete category
router.delete("/categories/:id", adminMiddleware, deleteCategory);

// --- USERS (ADMIN) ------------------------------------------
router.get("/users", adminMiddleware, listAdminUsers);
router.get("/users/:id", adminMiddleware, getAdminUser);
router.post("/users", adminMiddleware, createAdminUser);
router.patch("/users/:id", adminMiddleware, updateAdminUser);
router.delete("/users/:id", adminMiddleware, deleteAdminUser);

// Unblock user
router.patch("/users/:id/unblock", adminMiddleware, unblockAdminUser);

// Change user role
router.patch("/users/:id/role", adminMiddleware, changeUserRole);

// --- PRODUCTS (ADMIN) ---------------------------------------
router.get("/products", adminMiddleware, listAdminProducts);
router.get("/products/:id", adminMiddleware, getAdminProduct);

// Create product: multipart, multiple files under "files" (max 10)
router.post("/products", adminMiddleware, uploadMedia.array("files", 10), createAdminProduct);

// Update product: multipart, multiple files under "files" (max 10)
router.patch("/products/:id", adminMiddleware, uploadMedia.array("files", 10), updateAdminProduct);

// Delete product
router.delete("/products/:id", adminMiddleware, deleteAdminProduct);

export default router;

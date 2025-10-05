// src/routes/coupon.routes.js
import express from "express";
import {
    // USER
    getAllCoupons,
    getCouponsByUserId,
    getCouponsForUser,
} from "../controllers/couponController.js";
import { authMiddleware } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// Tất cả route bên dưới yêu cầu đăng nhập
router.use(authMiddleware);

/* =========================
 *          USER
 * ========================= */
// GET /coupons/all
router.get("/all", getAllCoupons);

// GET /coupons/my -> tất cả coupon hợp lệ của user
router.get("/my", getCouponsByUserId);

// GET /coupons/my-coupons?type=PRODUCT|SHIPPING|ORDER|USER
router.get("/my-coupons", getCouponsForUser);

export default router;

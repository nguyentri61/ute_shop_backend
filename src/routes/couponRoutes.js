import express from "express";
import { getAllCoupons, getCouponsByTypeAndUserId } from "../controllers/couponController.js";
import { authMiddleware } from "../middlewares/authMiddlewares.js";
const router = express.Router();

router.use(authMiddleware);

router.get("/all", getAllCoupons)
router.get("/my-coupons", getCouponsByTypeAndUserId);

export default router;

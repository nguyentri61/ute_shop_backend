import express from "express";
import { authMiddleware } from "../middlewares/authMiddlewares.js";
import { getDashboardStats, weeklySales, categoryShare } from "../controllers/dashboardController.js";

const router = express.Router();

// Tất cả endpoint dashboard yêu cầu đăng nhập
router.use(authMiddleware);

// Thống kê tổng quan (cards)
router.get("/dashboard/stats", getDashboardStats);

// Doanh thu tuần (Area chart T2..CN)
router.get("/dashboard/weekly-sales", weeklySales);
router.get("/dashboard/category-share", categoryShare);

export default router;

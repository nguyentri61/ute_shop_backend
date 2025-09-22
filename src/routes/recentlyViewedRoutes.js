import express from "express";
import {
  getRecentlyViewed,
  addToRecentlyViewedController,
} from "../controllers/recentlyViewedController.js";
import { authMiddleware } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// Lấy danh sách sản phẩm đã xem gần đây
router.get("/", getRecentlyViewed);

// Thêm sản phẩm vào danh sách đã xem
router.post("/add", addToRecentlyViewedController);

export default router;

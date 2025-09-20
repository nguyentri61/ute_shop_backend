import express from "express";
import {
  getFavorites,
  addToFavoritesController,
  removeFromFavoritesController,
  checkIsFavoriteController,
} from "../controllers/favoriteController.js";
import { authMiddleware } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// Lấy danh sách sản phẩm yêu thích
router.get("/", getFavorites);

// Thêm sản phẩm vào danh sách yêu thích
router.post("/add", addToFavoritesController);

// Xóa sản phẩm khỏi danh sách yêu thích
router.delete("/remove/:productId", removeFromFavoritesController);

// Kiểm tra sản phẩm có trong danh sách yêu thích không
router.get("/check/:productId", checkIsFavoriteController);

export default router;

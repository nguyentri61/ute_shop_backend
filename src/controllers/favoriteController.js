import {
  getFavoritesByUserId,
  addToFavorites,
  removeFromFavorites,
  checkIsFavorite,
} from "../services/favoriteServices.js";
import { successResponse, errorResponse } from "../utils/response.js";

// Lấy danh sách sản phẩm yêu thích
export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const favorites = await getFavoritesByUserId(userId);
    return successResponse(res, "Lấy danh sách yêu thích thành công", favorites);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// Thêm sản phẩm vào danh sách yêu thích
export const addToFavoritesController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return errorResponse(res, "Thiếu productId", 400);
    }

    const favorite = await addToFavorites(userId, productId);
    return successResponse(res, "Đã thêm vào danh sách yêu thích", favorite);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

// Xóa sản phẩm khỏi danh sách yêu thích
export const removeFromFavoritesController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    if (!productId) {
      return errorResponse(res, "Thiếu productId", 400);
    }

    const result = await removeFromFavorites(userId, productId);
    return successResponse(res, result.message, result);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

// Kiểm tra sản phẩm có trong danh sách yêu thích không
export const checkIsFavoriteController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    if (!productId) {
      return errorResponse(res, "Thiếu productId", 400);
    }

    const result = await checkIsFavorite(userId, productId);
    return successResponse(res, "Kiểm tra yêu thích thành công", result);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

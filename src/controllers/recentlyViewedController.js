import {
  getRecentlyViewedByUserId,
  addToRecentlyViewed,
} from "../services/recentlyViewedServices.js";
import { successResponse, errorResponse } from "../utils/response.js";

// Lấy danh sách sản phẩm đã xem gần đây
export const getRecentlyViewed = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 8;
    
    const recentlyViewed = await getRecentlyViewedByUserId(userId, limit);
    return successResponse(res, "Lấy danh sách đã xem thành công", recentlyViewed);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// Thêm sản phẩm vào danh sách đã xem
export const addToRecentlyViewedController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return errorResponse(res, "Thiếu productId", 400);
    }

    const result = await addToRecentlyViewed(userId, productId);
    return successResponse(res, result.message, result);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

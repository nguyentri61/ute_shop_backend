import {
  getAllProducts,
  getPaginatedProducts,
  getNewestProducts,
  getBestSellingProducts,
  getMostViewedProducts,
  getTopDiscountProducts,
  getProductByIdService,
  createReviewService,
} from "../services/productServices.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const allProducts = async (req, res) => {
  try {
    const products = await getAllProducts();
    return successResponse(res, "Lấy tất cả sản phẩm", products);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

export const paginatedProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const products = await getPaginatedProducts(page, limit);
    return successResponse(res, "Lấy sản phẩm theo phân trang", products);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

export const newestProducts = async (req, res) => {
  try {
    const products = await getNewestProducts();
    return successResponse(
      res,
      "Lấy 08 sản phẩm mới nhất thành công",
      products
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

export const bestSellingProducts = async (req, res) => {
  try {
    const products = await getBestSellingProducts();
    return successResponse(
      res,
      "Lấy 06 sản phẩm bán chạy nhất thành công",
      products
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

export const mostViewedProducts = async (req, res) => {
  try {
    const products = await getMostViewedProducts();
    return successResponse(
      res,
      "Lấy 08 sản phẩm xem nhiều nhất thành công",
      products
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

export const topDiscountProducts = async (req, res) => {
  try {
    const products = await getTopDiscountProducts();
    return successResponse(
      res,
      "Lấy 04 sản phẩm khuyến mãi cao nhất thành công",
      products
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params; // Lấy id từ route

  if (!id) {
    return errorResponse(res, "Thiếu id sản phẩm", 400);
  }

  try {
    const product = await getProductByIdService(id);

    if (!product) {
      return errorResponse(res, "Không tìm thấy sản phẩm", 404);
    }

    return successResponse(res, "Lấy chi tiết sản phẩm thành công", product);
  } catch (err) {
    console.error(err);
    return errorResponse(res, err.message || "Lỗi server", 500);
  }
};

export const createReview = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    const review = await createReviewService({
      productId,
      userId,
      rating,
      comment,
    });
    console.log("Đánh giá");
    return successResponse(res, "Đánh giá sản phẩm thành côngg", review);
  } catch (err) {
    console.error(err);
    return errorResponse(res, err.message || "Lỗi server", 500);
  }
};

// export const getMyCoupons = async (req, res) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       return errorResponse(res, "Người dùng chưa đăng nhập", 401);
//     }


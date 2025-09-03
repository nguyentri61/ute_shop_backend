import {
    getAllProducts,
    getNewestProducts,
    getBestSellingProducts,
    getMostViewedProducts,
    getTopDiscountProducts,
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

export const newestProducts = async (req, res) => {
    try {
        const products = await getNewestProducts();
        return successResponse(res, "Lấy 08 sản phẩm mới nhất thành công", products);
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

export const bestSellingProducts = async (req, res) => {
    try {
        const products = await getBestSellingProducts();
        return successResponse(res, "Lấy 06 sản phẩm bán chạy nhất thành công", products);
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

export const mostViewedProducts = async (req, res) => {
    try {
        const products = await getMostViewedProducts();
        return successResponse(res, "Lấy 08 sản phẩm xem nhiều nhất thành công", products);
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

export const topDiscountProducts = async (req, res) => {
    try {
        const products = await getTopDiscountProducts();
        return successResponse(res, "Lấy 04 sản phẩm khuyến mãi cao nhất thành công", products);
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

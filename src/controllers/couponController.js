// src/controllers/coupon.controller.js
import {
    // === User services ===
    getAllCouponsService,
    getCouponsByUserIdService,

    // === Admin services ===
    couponStatsService,
    couponDistributionService,
    expiringCouponsService,
    listCouponsService,
    createCouponsService,
    updateCouponService,
    deleteCouponService,
    getCouponsForUserService,
} from "../services/couponService.js";
import { errorResponse, successResponse } from "../utils/response.js";

export const getAllCoupons = async (req, res) => {
    try {
        const coupons = await getAllCouponsService();
        return successResponse(res, "Lấy danh sách mã giảm giá thành công", coupons);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};


export const getCouponsByUserId = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return errorResponse(res, "Người dùng chưa đăng nhập", 401);
        }
        const coupons = await getCouponsByUserIdService(userId);
        return successResponse(res, "Lấy danh sách mã giảm giá thành công", coupons);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

export const getCouponsForUser = async (req, res) => {
    try {
        const userId = req.user?.id;
        const type = req.query.type?.toUpperCase();
        if (!userId) {
            return errorResponse(res, "Người dùng chưa đăng nhập", 401);
        }
        if (!type) {
            return errorResponse(res, "Thiếu loại mã giảm giá", 400);
        }
        const allowedTypes = new Set(["PRODUCT", "SHIPPING", "ORDER", "USER"]);
        if (!allowedTypes.has(type)) {
            return errorResponse(res, "Loại mã giảm giá không hợp lệ", 400);
        }

        const coupons = await getCouponsForUserService(type, userId);
        return successResponse(res, "Lấy danh sách mã giảm giá theo loại thành công", coupons);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/* =========================
 *         ADMIN
 * ========================= */

/**
 * Thống kê tổng quan coupon
 * GET /admin/coupons/stats
 */
export const getCouponStats = async (_req, res) => {
    try {
        const data = await couponStatsService();
        return successResponse(res, "Lấy thống kê mã giảm giá thành công", data);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * Phân bố loại coupon
 * GET /admin/coupons/distribution
 */
export const getCouponDistribution = async (_req, res) => {
    try {
        const data = await couponDistributionService();
        return successResponse(res, "Lấy phân bố loại mã giảm giá thành công", data);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * Danh sách coupon sắp hết hạn (mặc định 30 ngày)
 * GET /admin/coupons/expiring?days=30
 */
export const getExpiringCoupons = async (req, res) => {
    try {
        const days = parseInt(req.query.days || "30", 10);
        const data = await expiringCouponsService(days);
        return successResponse(res, "Lấy danh sách mã sắp hết hạn thành công", data);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * List + filter + pagination
 * GET /admin/coupons?q=&type=&status=active|expired&userId=&page=1&size=10
 */
export const listCoupons = async (req, res) => {
    try {
        const q = req.query.q || "";
        const type = req.query.type?.toUpperCase();
        const status = req.query.status || ""; // active | expired | ''
        const userId = req.query.userId || "";
        const page = Math.max(parseInt(req.query.page || "1", 10), 1);
        const size = Math.max(Math.min(parseInt(req.query.size || "10", 10), 100), 1);

        const allowedTypes = new Set(["PRODUCT", "SHIPPING"]);
        if (type && !allowedTypes.has(type)) {
            return errorResponse(res, "Loại mã giảm giá không hợp lệ", 400);
        }

        const data = await listCouponsService({ q, type, status, userId, page, size });
        return successResponse(res, "Lấy danh sách mã giảm giá (admin) thành công", data);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * Tạo coupon
 * POST /admin/coupons
 * body: { code, type, description, discount, minOrderValue, expiredAt, userId?, quantity }
 */
export const createCoupons = async (req, res) => {
    try {
        const payload = req.body || {};
        const required = ["code", "type", "description", "discount", "expiredAt", "quantity"];
        const missing = required.filter((k) => payload[k] == null || payload[k] === "");
        if (missing.length) {
            return errorResponse(res, `Thiếu trường bắt buộc: ${missing.join(", ")}`, 400);
        }

        const allowedTypes = new Set(["PRODUCT", "SHIPPING"]);

        const quantity = Number(payload.quantity);

        if (!Number.isInteger(quantity) || quantity <= 0) {
            return errorResponse(res, "Trường 'quantity' phải là số nguyên dương", 400);
        }

        if (!allowedTypes.has(String(payload.type).toUpperCase())) {
            return errorResponse(res, "Loại mã giảm giá không hợp lệ", 400);
        }

        const coupons = await createCouponsService({
            code: String(payload.code).trim(),
            type: String(payload.type).toUpperCase(),
            description: String(payload.description).trim(),
            discount: Number(payload.discount),
            minOrderValue: Number(payload.minOrderValue || 0),
            expiredAt: payload.expiredAt, // ISO string or date
            userId: payload.userId || null,
            quantity: payload.quantity,
        });

        if (!coupons || (Array.isArray(coupons) && coupons.length === 0)) {
            return errorResponse(res, "Có lỗi khi tạo mã giảm giá", 500);
        }

        return successResponse(res, "Tạo mã giảm giá thành công", coupons, 201);
    } catch (error) {
        return errorResponse(res, error.message, error.status || 500);
    }
};

/**
 * Cập nhật coupon
 * PATCH /admin/coupons/:id
 */
export const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const payload = { ...req.body };

        if (payload.type) {
            const allowedTypes = new Set(["PRODUCT", "SHIPPING"]);
            if (!allowedTypes.has(String(payload.type).toUpperCase())) {
                return errorResponse(res, "Loại mã giảm giá không hợp lệ", 400);
            }
            payload.type = String(payload.type).toUpperCase();
        }

        const updated = await updateCouponService(id, payload);
        return successResponse(res, "Cập nhật mã giảm giá thành công", updated);
    } catch (error) {
        return errorResponse(res, error.message, error.status || 500);
    }
};

/**
 * Xoá coupon
 * DELETE /admin/coupons/:id
 */
export const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteCouponService(id);
        // trả về successResponse cho đồng bộ style, thay vì 204 no-content
        return successResponse(res, "Xoá mã giảm giá thành công", true);
    } catch (error) {
        return errorResponse(res, error.message, error.status || 500);
    }
};

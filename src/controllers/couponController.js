import { getAllCouponsService, getCouponsByTypeAndUserIdService, getCouponsByUserIdService } from "../services/couponService.js";
import { errorResponse, successResponse } from "../utils/response.js";

export const getCouponsByUserId = async (req, res) => {

    try {
        const userId = req.user?.id;
        console.log(userId);
        if (!userId) {
            return errorResponse(res, "Người dùng chưa đăng nhập", 401);
        }

        const coupons = await getCouponsByUserIdService(userId);
        return successResponse(res, "Lấy danh sách đơn hàng thành công", coupons);

    } catch (error) {
        return errorResponse(res, err.message, 500);
    }
}

export const getAllCoupons = async (req, res) => {
    try {
        const coupons = await getAllCouponsService();
        return successResponse(res, "Lấy danh sách mã giảm giá thành công", coupons);
    } catch (error) {
        return errorResponse(res, err.message, 500);
    }
};

export const getCouponsByTypeAndUserId = async (req, res) => {
    try {
        const userId = req.user?.id;
        const type = req.query.type;
        console.log(userId, type);
        if (!userId) {
            return errorResponse(res, "Người dùng chưa đăng nhập", 401);
        }
        if (!type) {
            return errorResponse(res, "Thiếu loại mã giảm giá", 400);
        }
        if (type !== "SHIPPING" && type !== "PRODUCT") {
            return errorResponse(res, "Loại mã giảm giá không hợp lệ", 400);
        }
        const coupons = await getCouponsByTypeAndUserIdService(type, userId);
        return successResponse(res, "Lấy danh sách mã giảm giá vận chuyển thành công", coupons);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};


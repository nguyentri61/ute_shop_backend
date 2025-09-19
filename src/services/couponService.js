import { findAllCoupons, findCouponsByTypeAndUserId, findCouponsByUserId } from "../repositories/couponRepository.js";

export const getCouponsByUserIdService = async (userId) => {
    return await findCouponsByUserId(userId);
};

export const getAllCouponsService = async () => {
    return await findAllCoupons();
};

export const getCouponsByTypeAndUserIdService = async (type, userId) => {
    return await findCouponsByTypeAndUserId(type, userId);
}

export const validateCoupon = async (couponId, subTotal = 0, userId) => {
    if (!couponId || !userId) {
        return null; // Thiếu thông tin
    }

    const coupons = await findCouponsByUserId(userId);
    if (!coupons || !Array.isArray(coupons) || coupons.length === 0) {
        return null; // Không có coupon nào
    }

    // Tìm coupon theo ID và kiểm tra các điều kiện
    const coupon = coupons.find(c => c.id === couponId
        && c.orderId === null
        && new Date(c.expiredAt) >= new Date()
        && (c.type === "SHIPPING" || c.type === "PRODUCT")
        && c.userId === userId
        && c.type === "PRODUCT" ? subTotal >= c.minOrderValue : true);

    return coupon || null; // Trả về coupon nếu tìm thấy, nếu không trả về null
}

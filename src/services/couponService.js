import {
    // User-facing
    findAllCoupons,
    findCouponsByUserId,
    findCouponsByTypeAndUserId,
    // Admin-facing
    countAllCoupons,
    countActiveCoupons,
    countExpiredCoupons,
    avgDiscountActiveCoupons,
    groupByType,
    findExpiringInDays,
    findCouponsWithFilterPaged,
    createCouponRepo,
    createCouponsRepo,
    updateCouponRepo,
    deleteCouponRepo,
    findCouponByCode,
    findCouponById,
} from "../repositories/couponRepository.js";

/* ========== USER SERVICES ========== */

export const getCouponsByUserIdService = async (userId) => {
    return await findCouponsByUserId(userId);
};

export const getAllCouponsService = async () => {
    return await findAllCoupons();
};

export const getCouponsByTypeAndUserIdService = async (type, userId) => {
    return await findCouponsByTypeAndUserId(type, userId);
};

/**
 * Validate coupon theo yêu cầu:
 * - phải thuộc về user
 * - chưa gán orderId
 * - chưa hết hạn
 * - type ∈ {SHIPPING, PRODUCT}
 * - nếu PRODUCT thì subTotal >= minOrderValue
 */
export const validateCoupon = async (couponId, subTotal = 0, userId) => {
    if (!couponId || !userId) return null;

    const coupons = await findCouponsByUserId(userId);
    if (!Array.isArray(coupons) || coupons.length === 0) return null;

    const coupon = coupons.find((c) =>
        c.id === couponId &&
        c.orderId === null &&
        new Date(c.expiredAt) >= new Date() &&
        (c.type === "SHIPPING" || c.type === "PRODUCT") &&
        c.userId === userId &&
        // FIX precedence: nếu KHÔNG phải PRODUCT thì pass, còn PRODUCT thì check minOrderValue
        (c.type !== "PRODUCT" || subTotal >= c.minOrderValue)
    );

    return coupon || null;
};

/* ========== ADMIN SERVICES ========== */

export const couponStatsService = async () => {
    const [total, active, expired, avg] = await Promise.all([
        countAllCoupons(),
        countActiveCoupons(),
        countExpiredCoupons(),
        avgDiscountActiveCoupons(),
    ]);

    // Loại phổ biến (dựa theo count)
    const dist = await groupByType();
    const mostType = dist.sort((a, b) => b.count - a.count)[0]?.type ?? null;

    return {
        total,
        active,
        expired,
        avgDiscount: avg ?? 0,
        mostType,
    };
};

export const couponDistributionService = async () => {
    return await groupByType(); // [{ type, count }]
};

export const expiringCouponsService = async (days = 30) => {
    const rows = await findExpiringInDays(days);
    // gom theo yyyy-mm-dd
    const map = new Map();
    for (const r of rows) {
        const key = new Date(r.expiredAt).toISOString().slice(0, 10);
        map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, count]) => ({ date, count }));
};

export const listCouponsService = async ({ q, type, status, userId, page = 1, size = 10 }) => {
    const { total, items } = await findCouponsWithFilterPaged({ q, type, status, userId, page, size });
    return { total, page, size, items };
};

export const createCouponService = async (data) => {
    // unique code
    const exists = await findCouponByCode(String(data.code || "").trim());
    if (exists) {
        const err = new Error("Coupon code đã tồn tại");
        err.status = 409;
        throw err;
    }
    return await createCouponRepo(data);
};

export const createCouponsService = async (data) => {
    // unique code
    const exists = await findCouponByCode(String(data.code || "").trim());
    if (exists) {
        const err = new Error("Coupon code đã tồn tại");
        err.status = 409;
        throw err;
    }
    return await createCouponsRepo(data);
};

export const updateCouponService = async (id, data) => {
    if (data.code) {
        const dup = await findCouponByCode(String(data.code).trim());
        if (dup && dup.id !== id) {
            const err = new Error("Coupon code đã tồn tại");
            err.status = 409;
            throw err;
        }
    }
    // tồn tại?
    const found = await findCouponById(id);
    if (!found) {
        const err = new Error("Không tìm thấy coupon");
        err.status = 404;
        throw err;
    }
    return await updateCouponRepo(id, data);
};

export const deleteCouponService = async (id) => {
    // tồn tại?
    const found = await findCouponById(id);
    if (!found) {
        const err = new Error("Không tìm thấy coupon");
        err.status = 404;
        throw err;
    }
    await deleteCouponRepo(id);
    return true;
};

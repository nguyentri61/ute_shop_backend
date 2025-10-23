// cartService.js
import { cartRepository } from "../repositories/cartRepository.js";
import { cartItemDto } from "../dto/cartItem.dto.js";
import { findValidCouponByCode } from "../repositories/couponRepository.js";

/**
 * -----------------------------
 *  Shipping Fee Configuration
 * -----------------------------
 */
const HCMUTE_LAT = parseFloat(process.env.HCMUTE_LAT) || 10.850721;
const HCMUTE_LNG = parseFloat(process.env.HCMUTE_LNG) || 106.771395;

// Quy tắc cước
const SHIPPING_RULES = [
    { maxKm: 0.6, fee: 0, zone: "campus_free" },         // Trong khuôn viên: miễn phí
    { maxKm: 5, fee: 15000, zone: "near" },              // Gần
    { maxKm: 15, fee: 30000, zone: "city" },             // Nội thành mở rộng
];
// > 15km: 30k + 3k/km (ceil), tối đa 80k
const PER_KM_START_KM = 15;
const PER_KM_STEP = 3000;
const BASE_AFTER_15KM = 30000;
const SHIPPING_FEE_CAP = 80000;

// Fallback khi không có lat/lng
const DEFAULT_SHIPPING_FEE_NO_COORD = 20000;

/**
 * Haversine distance (km) giữa 2 điểm lat/lng
 */
function distanceKm(lat1, lng1, lat2, lng2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371; // bán kính Trái đất (km)
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // km
}

/**
 * Tính phí ship dựa vào tọa độ đích
 * - return { fee, zone, distanceKm }
 */
function calculateShippingFee(destLat, destLng) {
    // Không đủ dữ liệu tọa độ → dùng default fee
    if (
        destLat === undefined ||
        destLat === null ||
        destLng === undefined ||
        destLng === null ||
        Number.isNaN(Number(destLat)) ||
        Number.isNaN(Number(destLng))
    ) {
        return {
            fee: DEFAULT_SHIPPING_FEE_NO_COORD,
            zone: "no_coord",
            distanceKm: null,
        };
    }

    const d = distanceKm(HCMUTE_LAT, HCMUTE_LNG, Number(destLat), Number(destLng));

    // Tìm rule phù hợp
    for (const rule of SHIPPING_RULES) {
        if (d <= rule.maxKm) {
            return { fee: rule.fee, zone: rule.zone, distanceKm: d };
        }
    }

    // > 15km
    const over = Math.max(0, Math.ceil(d - PER_KM_START_KM));
    const raw = BASE_AFTER_15KM + over * PER_KM_STEP;
    const capped = Math.min(raw, SHIPPING_FEE_CAP);
    return {
        fee: capped,
        zone: "outer",
        distanceKm: d,
    };
}

/**
 * Áp voucher cho phí ship (hỗ trợ số tuyệt đối hoặc tỷ lệ < 1)
 */
function applyShippingDiscount(shippingFee, shippingCoupon) {
    let discount = shippingCoupon?.discount ?? 0;
    if (discount <= 1) {
        discount = Math.floor(shippingFee * discount);
    }
    if (discount > shippingFee) discount = shippingFee;
    return discount;
}

/**
 * Áp voucher sản phẩm
 */
function applyProductDiscount(subTotal, productCoupon) {
    let discount = productCoupon?.discount ?? 0;
    if (discount < 1) {
        discount = Math.floor(subTotal * discount);
    }
    if (discount > subTotal) discount = subTotal;
    return discount;
}

export const cartService = {
    async getCart(userId) {
        const cartItems = await cartRepository.getCartByUserId(userId);
        return cartItems.map(cartItemDto);
    },

    /**
     * getSelectedCart
     * - Tính subTotal
     * - Tính phí ship theo khoảng cách từ HCMUTE đến (lat,lng)
     * - Áp voucher ship & sản phẩm
     */
    async getSelectedCart(
        cartItemIds,
        shippingVoucher = null,
        productVoucher = null,
        lat = null,
        lng = null,
        userId
    ) {
        const cartItems = await cartRepository.getCartByIds(cartItemIds);

        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
        }

        const items = cartItems.map(cartItemDto);

        const subTotal = cartItems.reduce((sum, item) => {
            if (!item.variant) {
                throw new Error(`Sản phẩm ${item.id} không có variant`);
            }
            const price = item.variant.discountPrice ?? item.variant.price;
            return sum + price * item.quantity;
        }, 0);

        // 1) Tính phí ship theo (lat,lng)
        const { fee: computedShippingFee, zone: shippingZone, distanceKm: distance } =
            calculateShippingFee(lat, lng);

        let shippingCoupon = null;
        let productCoupon = null;

        // if (shippingVoucher == null) shippingVoucher = "FREESHIPDON500K";

        // 2) Lấy voucher hợp lệ (nếu có)
        if (shippingVoucher && typeof shippingVoucher === "string" && shippingVoucher.trim() !== "") {
            shippingCoupon = await findValidCouponByCode(shippingVoucher.trim(), userId, subTotal);
        }

        if (productVoucher && typeof productVoucher === "string" && productVoucher.trim() !== "") {
            productCoupon = await findValidCouponByCode(productVoucher.trim(), userId, subTotal);
        }

        // 3) Áp giảm giá
        let shippingDiscount = applyShippingDiscount(computedShippingFee, shippingCoupon);
        let productDiscount = applyProductDiscount(subTotal, productCoupon);

        // 4) Tổng
        const total = subTotal + computedShippingFee - shippingDiscount - productDiscount;

        return {
            items,
            summary: {
                subTotal,
                shippingFee: computedShippingFee,
                shippingDiscount,
                shippingVoucher,
                productDiscount,
                productVoucher,
                total,
                // thông tin thêm cho UI
                shippingMeta: {
                    zone: shippingZone,
                    distanceKm: distance,
                    rules: SHIPPING_RULES,
                    cap: SHIPPING_FEE_CAP,
                },
            },
        };
    },

    async getItemById(cartItemId) {
        return await cartRepository.findById(cartItemId);
    },

    async addItem(userId, variantId, quantity = 1) {
        return await cartRepository.addToCart(userId, variantId, quantity);
    },

    async updateItem(cartItemId, quantity) {
        const item = await this.getItemById(cartItemId);
        if (!item) {
            throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
        }

        const qty = Number(quantity);
        if (isNaN(qty)) {
            throw new Error("Số lượng không hợp lệ");
        }

        if (qty <= 0) {
            await cartRepository.removeCartItem(cartItemId);
            return { id: cartItemId };
        }

        return await cartRepository.updateQuantity(cartItemId, qty);
    },

    async removeItem(cartItemId) {
        return await cartRepository.removeCartItem(cartItemId);
    },

    async removeManyItems(cartItemIds) {
        return await cartRepository.removeCartItems(cartItemIds);
    },

    async clearCart(userId) {
        return await cartRepository.clearCart(userId);
    },
};

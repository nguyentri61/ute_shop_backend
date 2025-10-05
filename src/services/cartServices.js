import { cartRepository } from "../repositories/cartRepository.js";
import { cartItemDto } from "../dto/cartItem.dto.js";
import { findValidCouponByCode } from "../repositories/couponRepository.js";

export const cartService = {
    async getCart(userId) {
        const cartItems = await cartRepository.getCartByUserId(userId);

        return cartItems.map(cartItemDto);
    },

    async getSelectedCart(cartItemIds, shippingVoucher = null, productVoucher = null, userId) {
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

        let shippingFee = 30000;

        // Kiểm tra và lấy thông tin voucher
        let shippingCoupon = null;
        let productCoupon = null;

        console.log("🧮 subTotal trước khi gọi findValidCouponByCode:", subTotal, typeof subTotal);

        if (shippingVoucher && typeof shippingVoucher === "string" && shippingVoucher.trim() !== "") {
            shippingCoupon = await findValidCouponByCode(shippingVoucher.trim(), userId, subTotal);
        }

        if (productVoucher && typeof productVoucher === "string" && productVoucher.trim() !== "") {
            productCoupon = await findValidCouponByCode(productVoucher.trim(), userId, subTotal);
        }


        // Gán giá trị discount (nếu có, nếu không thì = 0)
        let shippingDiscount = shippingCoupon?.discount ?? 0;
        let productDiscount = productCoupon?.discount ?? 0;

        if (shippingDiscount < 1) {
            shippingDiscount = Math.floor(shippingFee * shippingDiscount);
        }

        if (productDiscount < 1) {
            productDiscount = Math.floor(subTotal * productDiscount);
        }

        // Giảm giá không được vượt quá tổng tiền
        if (shippingDiscount > shippingFee) {
            shippingDiscount = shippingFee;
        }

        if (productDiscount > subTotal) {
            productDiscount = subTotal;
        }

        const total = subTotal + shippingFee - shippingDiscount - productDiscount;

        return {
            items,
            summary: {
                subTotal,
                shippingFee,
                shippingDiscount,
                productDiscount,
                total,
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
    }


};

import { cartRepository } from "../repositories/cartRepository.js";
import { cartItemDto } from "../dto/cartItem.dto.js";

export const cartService = {
    async getCart(userId) {
        const cartItems = await cartRepository.getCartByUserId(userId);

        return cartItems.map(cartItemDto);
    },

    async getSelectedCart(cartItemIds, shippingVoucher = null, productVoucher = null) {
        const cartItems = await cartRepository.getCartByIds(cartItemIds);

        const items = cartItems.map(cartItemDto);

        // Tính subtotal từ sản phẩm
        const subTotal = cartItems.reduce((sum, item) => {
            const price = item.variant.discountPrice ?? item.variant.price;
            return sum + price * item.quantity;
        }, 0);

        // Tính phí vận chuyển mặc định
        let shippingFee = 30000;

        let shippingDiscount = 0;
        // Áp dụng voucher vận chuyển
        if (shippingVoucher === "FREESHIP") {
            shippingDiscount = shippingFee;
        } else if (shippingVoucher === "SHIP10K") {
            shippingDiscount = 10000;
        }

        // Áp dụng voucher sản phẩm
        let productDiscount = 0;
        if (productVoucher === "SALE10") {
            productDiscount = subTotal * 0.1;
        } else if (productVoucher === "SALE50K") {
            productDiscount = 50000;
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
    }
    ,

    async addItem(userId, variantId, quantity = 1) {
        return await cartRepository.addToCart(userId, variantId, quantity);
    },

    async updateItem(userId, variantId, quantity) {
        return await cartRepository.updateQuantity(userId, variantId, quantity);
    },

    async removeItem(userId, variantId) {
        return await cartRepository.removeFromCart(userId, variantId);
    },

    async clearCart(userId) {
        return await cartRepository.clearCart(userId);
    }
};

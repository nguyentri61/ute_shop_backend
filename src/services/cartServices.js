import { cartRepository } from "../repositories/cartRepository.js";
import { cartItemDto } from "../dto/cartItem.dto.js";

export const cartService = {
    async getCart(userId) {
        const cartItems = await cartRepository.getCartByUserId(userId);

        return cartItems.map(cartItemDto);
    },

    async getSelectedCart(cartItemIds, shippingVoucher = null, productVoucher = null) {
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
        let shippingDiscount = 0;
        if (shippingVoucher === "FREESHIP") {
            shippingDiscount = shippingFee;
        } else if (shippingVoucher === "SHIP10K") {
            shippingDiscount = 10000;
        }

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

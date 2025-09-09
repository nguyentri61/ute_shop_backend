import { cartService } from "../services/cartServices.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const cartController = {
    async getCart(req, res) {
        try {
            const userId = req.user.id; // user lấy từ middleware auth
            const cart = await cartService.getCart(userId);
            return successResponse(res, "Lấy giỏ hàng thành công", cart);
        } catch (err) {
            return errorResponse(res, err.message, 500);
        }
    },

    async getSelectedCart(req, res) {
        try {
            const { cartItemIds, shippingVoucher, productVoucher } = req.body;

            if (!cartItemIds || !cartItemIds.length) {
                return errorResponse(res, "Chưa có sản phẩm nào được chọn", 400);
            }

            const result = await cartService.getSelectedCart(
                cartItemIds,
                shippingVoucher,
                productVoucher
            );

            return successResponse(res, "Lấy giỏ hàng thành công", result);
        } catch (err) {
            return errorResponse(res, err.message, 500);
        }
    },

    async addItem(req, res) {
        try {
            const userId = req.user.id;
            const { variantId, quantity } = req.body;
            const item = await cartService.addItem(userId, variantId, quantity);
            return successResponse(res, "Thêm giỏ hàng thành công", item);
        } catch (err) {
            return errorResponse(res, err.message, 500);
        }
    },

    async updateItem(req, res) {
        try {
            const userId = req.user?.id;

            if (!userId)
                return errorResponse(res, err.message, 401);

            const { cartItemId, quantity } = req.body;
            const result = await cartService.updateItem(cartItemId, quantity);

            if (result.id) {
                // Trường hợp xoá item
                return successResponse(res, result.message, result);
            }

            return successResponse(res, "Cập nhật số lượng thành công", result);
        } catch (err) {
            return errorResponse(res, err.message, 500);
        }
    },

    async removeItem(req, res) {
        try {
            const userId = req.user.id;
            if (!userId)
                return res.status(401).json({ code: 401, message: "Unauthorized", data: null });

            const { variantId } = req.params;
            await cartService.removeItem(userId, variantId);
            res.json({ message: "Item removed from cart" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async clearCart(req, res) {
        try {
            const userId = req.user.id;
            await cartService.clearCart(userId);
            res.json({ message: "Cart cleared" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
};

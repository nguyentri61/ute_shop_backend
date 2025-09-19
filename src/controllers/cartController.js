import { cartService } from "../services/cartServices.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const cartController = {
    async getCart(req, res) {
        try {
            const userId = req.user.id;
            const cart = await cartService.getCart(userId);
            return successResponse(res, "Lấy giỏ hàng thành công", cart);
        } catch (err) {
            return errorResponse(res, err.message, 500);
        }
    },

    async getSelectedCart(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) return errorResponse(res, "Unauthorized", 401);

            const { cartItemIds, shippingVoucher, productVoucher } = req.body;

            if (!cartItemIds || !cartItemIds.length) {
                return errorResponse(res, "Chưa có sản phẩm nào được chọn", 400);
            }

            console.log("Selected IDs:", cartItemIds);

            const result = await cartService.getSelectedCart(
                cartItemIds,
                shippingVoucher,
                productVoucher, 
                userId
            );

            return successResponse(res, "Lấy giỏ hàng thành công", result);
        } catch (err) {
            console.error(err);
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
            if (!userId) return errorResponse(res, "Unauthorized", 401);

            const { cartItemId, quantity } = req.body;
            const result = await cartService.updateItem(cartItemId, quantity);

            if (result?.removed) {
                return successResponse(res, "Xóa sản phẩm khỏi giỏ hàng", result);
            }

            return successResponse(res, "Cập nhật số lượng thành công", result);
        } catch (err) {
            return errorResponse(res, err.message, 500);
        }
    },

    async removeItem(req, res) {
        try {
            const { cartItemId } = req.params; // trùng với route
            console.log(cartItemId);
            if (!cartItemId) return errorResponse(res, "Thiếu cartItemId", 400);

            await cartService.removeItem(cartItemId);
            return successResponse(res, "Xóa sản phẩm khỏi giỏ hàng thành công", null);
        } catch (err) {
            return errorResponse(res, err.message, 500);
        }
    }
    ,

    async clearCart(req, res) {
        try {
            const userId = req.user.id;
            await cartService.clearCart(userId);
            return successResponse(res, "Đã xóa toàn bộ giỏ hàng", null);
        } catch (err) {
            return errorResponse(res, err.message, 500);
        }
    },
};

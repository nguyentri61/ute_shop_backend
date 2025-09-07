import { getMyOrders, getOrderItemByOrderId } from "../services/orderServices.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const myOrders = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return errorResponse(res, "Người dùng chưa đăng nhập", 401);
        }

        const orders = await getMyOrders(userId);
        return successResponse(res, "Lấy danh sách đơn hàng thành công", orders);
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

export const orderItemByOrderId = async (req, res) => {
    try {
        const orderId = req.orderId;
        if (!orderId) {
            return errorResponse(res, "Chưa truyền OrderId");
        }

        const orderItems = await getOrderItemByOrderId(orderId);
        return successResponse(res, "Danh sách sản phẩm của order này");
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
}

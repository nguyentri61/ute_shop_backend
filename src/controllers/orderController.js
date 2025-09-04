import { getMyOrders } from "../services/orderServices.js";
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

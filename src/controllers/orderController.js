import {
  getMyOrders,
  getOrderItemByOrderId,
  checkOutCODService,
  cancelOrder,
} from "../services/orderServices.js";
import { cartService } from "../services/cartServices.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const myOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    console.log(userId);
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
};

export const checkOutCOD = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, "Người dùng chưa đăng nhập", 401);
    }

    const { address, phone, cartItemIds, shippingVoucher, productVoucher } =
      req.body;

    if (!cartItemIds || !cartItemIds.length) {
      return errorResponse(res, "Chưa có sản phẩm nào được chọn", 400);
    }

    const result = await cartService.getSelectedCart(
      cartItemIds,
      shippingVoucher,
      productVoucher
    );

    const { order, orderItems } = await checkOutCODService(
      userId,
      address,
      phone,
      cartItemIds,
      result.summary.total
    );

    return successResponse(res, "Check out thành công", { order, orderItems });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

export const cancel = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;
    const result = await cancelOrder(orderId, userId);
    res.json({ message: "Xử lý hủy đơn hàng thành công", order: result });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

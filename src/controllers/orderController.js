import {
  getMyOrders,
  getOrderItemByOrderId,
  checkOutCODService,
  cancelOrder,
  updateOrderStatusService,
  getAllOrders,
} from "../services/orderServices.js";
import { notifyAdmin, notifyUser } from "../services/notificationService.js";
import { cartService } from "../services/cartServices.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const myOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return errorResponse(res, "Người dùng chưa đăng nhập", 401);

    const status = req.query.status || "ALL";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const { orders, total } = await getMyOrders(userId, status, skip, limit);

    return successResponse(res, "Lấy danh sách đơn hàng thành công", {
      data: orders,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
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
    return successResponse(res, "Danh sách sản phẩm của order này", orderItems);
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

    console.log("shippingVoucher", shippingVoucher);
    console.log("productVoucher", productVoucher);
    console.log("Result", result);

    const { order, orderItems } = await checkOutCODService(
      userId,
      address,
      phone,
      cartItemIds,
      result.summary.total,
      shippingVoucher,
      productVoucher
    );

    // Gửi thông báo cho admin khi có đơn hàng mới
    notifyAdmin({
      message: `Đơn hàng mới từ người dùng ${userId}`,
      type: "success",
      link: `/admin`,
    });

    // Gửi thông báo cho user
    notifyUser({
      userId,
      message: `Bạn đã đặt hàng thành công! Mã đơn: #${order.id.substring(
        0,
        8
      )}`,
      type: "info",
      link: `/orders`,
    });

    return successResponse(res, "Check out thành công", { order, orderItems });
  } catch (err) {
    console.error(err);
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

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!orderId) {
      return errorResponse(res, "Chưa truyền OrderId", 400);
    }

    if (!status) {
      return errorResponse(res, "Chưa truyền trạng thái mới", 400);
    }

    // Kiểm tra xem status có hợp lệ không (thuộc enum OrderStatus)
    const validStatuses = [
      "NEW",
      "CONFIRMED",
      "PREPARING",
      "SHIPPING",
      "DELIVERED",
      "CANCELLED",
      "CANCEL_REQUEST",
    ];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, "Trạng thái không hợp lệ", 400);
    }

    const result = await updateOrderStatusService(orderId, status);
    return successResponse(
      res,
      "Cập nhật trạng thái đơn hàng thành công",
      result
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// Controller lấy tất cả đơn hàng (dành cho admin)
export const allOrders = async (req, res) => {
  try {
    const orders = await getAllOrders();
    return successResponse(
      res,
      "Lấy danh sách tất cả đơn hàng thành công",
      orders
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

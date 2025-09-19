import { PrismaClient } from "@prisma/client";
import { differenceInMinutes } from "date-fns";
const prisma = new PrismaClient();

import {
  findOrdersByUserId,
  findOrderItemByOrderId,
  createOrder,
  createOrderItems,
  findOrderById,
  updateOrderStatus,
  findAllOrders,
} from "../repositories/orderRepository.js";
import { cartRepository } from "../repositories/cartRepository.js";
import { updateCouponOrderId } from "../repositories/couponRepository.js";

export const getMyOrders = async (userId) => {
  console.log("Service: ", userId);
  const orders = await findOrdersByUserId(userId);

  return orders.map((order) => ({
    id: order.id,
    status: order.status,
    createdAt: order.createdAt,
    totalPrice: order.totalPrice,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      product: {
        id: item.variant?.product?.id,
        name: item.variant?.product?.name,
        price: item.variant?.product?.price,
        discountPrice: item.variant?.product?.discountPrice,
        image: item.variant?.product?.productImage?.[0]?.url || null,
      },
    })),
  }));
};

export const getOrderItemByOrderId = async (orderId) => {
  const orderItems = await findOrderItemByOrderId(orderId);
  return orderItems ?? [];
};

export const checkOutCODService = async (
  userId,
  adress,
  phone,
  cartItemIds,
  total,
  shippingVoucher,
  productVoucher
) => {
  return await prisma.$transaction(async (tx) => {
    const order = await createOrder(userId, adress, phone, total, tx);
    const cartItems = await cartRepository.getCartByIds(cartItemIds, tx);
    if (shippingVoucher)
      await updateCouponOrderId(shippingVoucher, order.id, tx);

    if (productVoucher)
      await updateCouponOrderId(productVoucher, order.id, tx);

    // Nếu giỏ hàng rỗng thì rollback
    if (!cartItems || cartItems.length === 0) {
      throw new Error("Giỏ hàng trống, không thể tạo đơn hàng");
    }

    const orderItems = await createOrderItems(order.id, cartItems, tx);

    await cartRepository.removeCartItems(cartItemIds, tx);

    return { order, orderItems };
  });
};

export const cancelOrder = async (orderId, userId) => {
  const order = await findOrderById(orderId, userId);
  if (!order) throw new Error("Không tìm thấy đơn hàng của bạn");

  // Nếu đơn đã bị hủy hoặc giao xong
  if (["CANCELLED", "DELIVERED"].includes(order.status)) {
    throw new Error("Đơn hàng không thể hủy");
  }

  const minutesSinceCreated = differenceInMinutes(new Date(), order.createdAt);

  // Nếu trong 30 phút đầu => cho phép hủy trực tiếp
  if (
    minutesSinceCreated <= 30 &&
    ["NEW", "CONFIRMED"].includes(order.status)
  ) {
    return await updateOrderStatus(order.id, "CANCELLED");
  }

  // Nếu đang chuẩn bị hàng => gửi yêu cầu hủy
  if (order.status === "PREPARING") {
    return await updateOrderStatus(order.id, "CANCEL_REQUEST");
  }

  // Nếu đang giao thì không cho phép
  if (order.status === "SHIPPING") {
    throw new Error("Đơn hàng đang giao, không thể hủy");
  }

  throw new Error("Không thể hủy đơn hàng ở trạng thái hiện tại");
};

// Cập nhật trạng thái đơn hàng (dành cho admin)
export const updateOrderStatusService = async (orderId, newStatus) => {
  // Kiểm tra đơn hàng tồn tại
  const order = await findOrderById(orderId);
  if (!order) {
    throw new Error("Không tìm thấy đơn hàng");
  }

  // Kiểm tra logic chuyển trạng thái
  const currentStatus = order.status;

  // Một số quy tắc chuyển trạng thái (có thể điều chỉnh theo yêu cầu)
  if (currentStatus === "DELIVERED" && newStatus !== "DELIVERED") {
    throw new Error(
      "Đơn hàng đã giao thành công không thể thay đổi trạng thái"
    );
  }

  if (currentStatus === "CANCELLED" && newStatus !== "CANCELLED") {
    throw new Error("Đơn hàng đã hủy không thể thay đổi trạng thái");
  }

  // Cập nhật trạng thái
  return await updateOrderStatus(orderId, newStatus);
};

// Lấy tất cả đơn hàng (dành cho admin)
export const getAllOrders = async () => {
  const orders = await findAllOrders();

  return orders.map((order) => ({
    id: order.id,
    status: order.status,
    createdAt: order.createdAt,
    total: order.total,
    address: order.address,
    phone: order.phone,
    user: {
      id: order.user?.id,
      email: order.user?.email,
      fullName: order.user?.fullName,
      phone: order.user?.phone,
    },
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      product: {
        id: item.variant?.product?.id,
        name: item.variant?.product?.name,
        price: item.variant?.product?.price,
        discountPrice: item.variant?.product?.discountPrice,
        image: item.variant?.product?.productImage?.[0]?.url || null,
      },
    })),
  }));
};

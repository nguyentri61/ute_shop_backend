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
} from "../repositories/orderRepository.js";
import { cartRepository } from "../repositories/cartRepository.js";

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
  total
) => {
  return await prisma.$transaction(async (tx) => {
    const order = await createOrder(userId, adress, phone, total, tx);
    const cartItems = await cartRepository.getCartByIds(cartItemIds, tx);

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

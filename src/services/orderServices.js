import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

import {
  findOrdersByUserId,
  findOrderItemByOrderId,
  createOrder,
  createOrderItems,
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

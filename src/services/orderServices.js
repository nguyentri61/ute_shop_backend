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
  countOrdersByUserId,
  getOrderDetail,
} from "../repositories/orderRepository.js";
import { cartRepository } from "../repositories/cartRepository.js";
import { updateCouponOrderId } from "../repositories/couponRepository.js";

/* ======================================================
   🔹 Helper: Tính giá & tồn kho từ variant
====================================================== */
function mapVariantPrice(variant) {
  if (!variant) return { price: 0, discountPrice: null, stock: 0 };
  return {
    price: variant.price,
    discountPrice: variant.discountPrice ?? null,
    stock: variant.stock ?? 0,
  };
}

/* ======================================================
   🔹 Lấy đơn hàng của user
====================================================== */
export const getMyOrders = async (userId, status = "ALL", skip = 0, limit = 5) => {
  const [orders, total] = await Promise.all([
    findOrdersByUserId(userId, status, skip, limit),
    countOrdersByUserId(userId, status),
  ]);

  const mappedOrders = orders.map((order) => ({
    id: order.id,
    status: order.status,
    createdAt: order.createdAt,
    total: order.total,
    items: order.items.map((item) => {
      const variant = item.variant;
      const product = variant?.product;
      const { price, discountPrice } = mapVariantPrice(variant);

      return {
        id: item.id,
        quantity: item.quantity,
        price: discountPrice ?? price,
        product: {
          id: product?.id,
          name: product?.name,
          price,
          discountPrice,
          image: product?.productImage?.[0]?.url || null,
        },
      };
    }),
  }));

  return { orders: mappedOrders, total };
};

/* ======================================================
   🔹 Chi tiết item trong đơn hàng
====================================================== */
export const getOrderItemByOrderId = async (orderId) => {
  const orderItems = await findOrderItemByOrderId(orderId);
  if (!orderItems) return [];

  return orderItems.map((item) => {
    const variant = item.variant;
    const product = variant?.product;
    const { price, discountPrice } = mapVariantPrice(variant);

    return {
      id: item.id,
      quantity: item.quantity,
      price: discountPrice ?? price,
      product: {
        id: product?.id,
        name: product?.name,
        price,
        discountPrice,
        image: product?.productImage?.[0]?.url || null,
      },
    };
  });
};

/* ======================================================
   🔹 Thanh toán COD
====================================================== */
export const checkOutCODService = async (
  userId,
  address,
  phone,
  cartItemIds,
  total,
  subTotal,
  shippingFee,
  shippingDiscount,
  productDiscount,
  shippingVoucher,
  productVoucher
) => {
  if (!address || !phone) throw new Error("Thiếu thông tin địa chỉ hoặc số điện thoại");
  if (total <= 0) throw new Error("Tổng tiền không hợp lệ");

  return await prisma.$transaction(async (tx) => {
    const cartItems = await cartRepository.getCartByIds(cartItemIds, tx);
    if (!cartItems || cartItems.length === 0)
      throw new Error("Giỏ hàng trống, không thể tạo đơn hàng");

    // ✅ Kiểm tra tồn kho
    for (const item of cartItems) {
      if (item.variant.stock < item.quantity) {
        throw new Error(`Sản phẩm ${item.variant.product.name} không đủ hàng`);
      }
    }

    // ✅ Tạo order chính
    const order = await createOrder(
      userId,
      address,
      phone,
      total,
      subTotal,
      shippingFee,
      shippingDiscount,
      productDiscount,
      tx
    );

    // ✅ Lưu lịch sử trạng thái
    await tx.orderStatusHistory.create({
      data: { orderId: order.id, status: "NEW" },
    });

    // ✅ Gán voucher (nếu có)
    if (shippingVoucher)
      await updateCouponOrderId(shippingVoucher, order.id, userId, tx);
    if (productVoucher)
      await updateCouponOrderId(productVoucher, order.id, userId, tx);

    // ✅ Tạo các orderItem
    await createOrderItems(order.id, cartItems, tx);

    // ✅ Trừ tồn kho
    for (const item of cartItems) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: {
          stock: { decrement: item.quantity },
        },
      });
    }

    // ✅ Xóa cart sau khi đặt hàng
    await cartRepository.removeCartItems(cartItemIds, tx);

    return { order };
  });
};

/* ======================================================
   🔹 Hủy đơn hàng (cho user)
====================================================== */
export const cancelOrder = async (orderId, userId) => {
  const order = await findOrderById(orderId, userId);
  if (!order) throw new Error("Không tìm thấy đơn hàng của bạn");

  if (["CANCELLED", "DELIVERED"].includes(order.status))
    throw new Error("Đơn hàng không thể hủy");

  const minutesSinceCreated = differenceInMinutes(new Date(), order.createdAt);

  if (minutesSinceCreated <= 30 && ["NEW", "CONFIRMED"].includes(order.status)) {
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: "CANCELLED" },
    });
    return await updateOrderStatus(order.id, "CANCELLED");
  }

  if (order.status === "PREPARING") {
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: "CANCEL_REQUEST" },
    });
    return await updateOrderStatus(order.id, "CANCEL_REQUEST");
  }

  if (order.status === "SHIPPING")
    throw new Error("Đơn hàng đang giao, không thể hủy");

  throw new Error("Không thể hủy đơn hàng ở trạng thái hiện tại");
};

/* ======================================================
   🔹 Cập nhật trạng thái đơn hàng (cho admin)
====================================================== */
export const updateOrderStatusService = async (orderId, newStatus) => {
  const order = await findOrderById(orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");

  const currentStatus = order.status;

  if (currentStatus === "DELIVERED" && newStatus !== "DELIVERED")
    throw new Error("Đơn hàng đã giao thành công không thể thay đổi trạng thái");

  if (currentStatus === "CANCELLED" && newStatus !== "CANCELLED")
    throw new Error("Đơn hàng đã hủy không thể thay đổi trạng thái");

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });
    await tx.orderStatusHistory.create({
      data: { orderId, status: newStatus },
    });
    return updated;
  });

  return updatedOrder;
};

/* ======================================================
   🔹 Lấy tất cả đơn hàng (cho admin)
====================================================== */
export const getAllOrders = async () => {
  const orders = await findAllOrders();

  return orders.map((order) => ({
    id: order.id,
    status: order.status,
    createdAt: order.createdAt,
    shippingFee: order.shippingFee,
    shippingDiscount: order.shippingDiscount,
    productDiscount: order.productDiscount,
    subTotal: order.subTotal,
    total: order.total,
    address: order.address,
    phone: order.phone,
    user: {
      id: order.user?.id,
      email: order.user?.email,
      fullName: order.user?.fullName,
      phone: order.user?.phone,
    },
    items: order.items.map((item) => {
      const variant = item.variant;
      const product = variant?.product;
      const { price, discountPrice } = mapVariantPrice(variant);

      return {
        id: item.id,
        quantity: item.quantity,
        price: discountPrice ?? price,
        product: {
          id: product?.id,
          name: product?.name,
          price,
          discountPrice,
          image: product?.productImage?.[0]?.url || null,
        },
      };
    }),
  }));
};

/* ======================================================
   🔹 Lấy chi tiết đơn hàng theo ID
====================================================== */
export const getOrderDetailById = async (orderId) => {
  const order = await getOrderDetail(orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
  return order;
};

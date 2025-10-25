import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/* ======================================================
   🔹 Lấy đơn hàng theo user
====================================================== */
export const findOrdersByUserId = async (
  userId,
  status = "ALL",
  skip = 0,
  limit = 5
) => {
  const whereCondition = { userId };
  if (status !== "ALL") whereCondition.status = status;

  return prisma.order.findMany({
    where: whereCondition,
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  productImage: { take: 1, select: { url: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });
};

/* ======================================================
   🔹 Đếm đơn hàng theo user
====================================================== */
export const countOrdersByUserId = async (userId, status = "ALL") => {
  const whereCondition = { userId };
  if (status !== "ALL") whereCondition.status = status;
  return prisma.order.count({ where: whereCondition });
};

/* ======================================================
   🔹 Lấy item theo orderId
====================================================== */
export const findOrderItemByOrderId = async (orderId) => {
  return prisma.orderItem.findMany({
    where: { orderId },
    include: {
      variant: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              productImage: { take: 1, select: { url: true } },
            },
          },
        },
      },
      order: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          total: true,
        },
      },
    },
  });
};

/* ======================================================
   🔹 Lấy order theo ID
====================================================== */
export const findByOrderId = async (orderId) => {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { include: { productImage: true } },
            },
          },
        },
      },
    },
  });
};

/* ======================================================
   🔹 Tạo đơn hàng
====================================================== */
export const createOrder = (
  userId,
  address,
  phone,
  total,
  subTotal,
  shippingFee,
  shippingDiscount,
  productDiscount,
  client = prisma
) => {
  return client.order.create({
    data: {
      userId,
      address,
      phone,
      total,
      subTotal,
      shippingFee,
      shippingDiscount,
      productDiscount,
    },
  });
};

/* ======================================================
   🔹 Tạo order item (từ giỏ hàng)
====================================================== */
export const createOrderItems = (orderId, cartItems, client = prisma) => {
  return client.orderItem.createMany({
    data: cartItems.map((c) => ({
      orderId,
      variantId: c.variantId,
      quantity: c.quantity,
      price: c.variant.discountPrice ?? c.variant.price, // ⚡ lấy giá variant (ưu tiên discount)
    })),
  });
};

/* ======================================================
   🔹 Cập nhật trạng thái đơn hàng
====================================================== */
export const updateOrderStatus = (orderId, newStatus, client = prisma) => {
  return client.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });
};

/* ======================================================
   🔹 Lấy tất cả đơn hàng (Admin)
====================================================== */
export const findAllOrders = async (client = prisma) => {
  return client.order.findMany({
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  productImage: { take: 1, select: { url: true } },
                },
              },
            },
          },
        },
      },
      user: {
        select: { id: true, fullName: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

/* ======================================================
   🔹 Lấy đơn hàng chi tiết theo ID
====================================================== */
export const findOrderById = async (orderId, userId, client = prisma) => {
  const order = await client.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  productImage: { take: 1, select: { url: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  // Nếu có userId => chỉ trả về nếu là đơn của user đó
  if (order && userId && order.userId !== userId) return null;
  return order;
};

/* ======================================================
   🔹 Lấy chi tiết đơn hàng (Admin / User)
====================================================== */
export const getOrderDetail = async (orderId) => {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  productImage: { take: 1, select: { url: true } },
                },
              },
            },
          },
        },
      },
      statusHistory: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
};

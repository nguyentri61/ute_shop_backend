import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// order.repo.js
export const findOrdersByUserId = async (
  userId,
  status = "ALL",
  skip = 0,
  limit = 5
) => {
  const whereCondition = { userId };
  if (status !== "ALL") whereCondition.status = status;

  return await prisma.order.findMany({
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
                  price: true,
                  discountPrice: true,
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

export const countOrdersByUserId = async (userId, status = "ALL") => {
  const whereCondition = { userId };
  if (status !== "ALL") whereCondition.status = status;
  return await prisma.order.count({ where: whereCondition });
};

export const findOrderItemByOrderId = async (orderId) => {
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          discountPrice: true,
          productImage: {
            take: 1,
            select: { url: true },
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

  return orderItems;
};

export const findByOrderId = async (orderId) => {
  const orderItems = await prisma.order.findFirst({
    where: { orderId },
    include: {},
  });

  return orderItems;
};

export const createOrder = (userId, address, phone, total, subTotal, shippingFee, shippingDiscount, productDiscount, client = prisma) => {
  return client.order.create({
    data: { userId, address, phone, total, subTotal, shippingFee, shippingDiscount, productDiscount },
  });
};

export const createOrderItems = (orderId, cartItems, client = prisma) => {
  return client.orderItem.createMany({
    data: cartItems.map((c) => ({
      orderId,
      variantId: c.variantId,
      quantity: c.quantity,
      price: c.variant.price,
    })),
  });
};

// Cập nhật trạng thái đơn hàng
export const updateOrderStatus = (orderId, newStatus, client = prisma) => {
  return client.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });
};

// Tìm đơn hàng theo ID (kèm items và product)
// Lấy tất cả đơn hàng (cho admin)
export const findAllOrders = async (client = prisma) => {
  const orders = await client.order.findMany({
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  discountPrice: true,
                  productImage: {
                    take: 1,
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders;
};

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
                  price: true,
                  discountPrice: true,
                  productImage: {
                    take: 1,
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Nếu có userId thì check xem có đúng là chủ đơn không
  if (order && userId && order.userId !== userId) {
    return null; // không phải của user này
  }

  return order;
};
export const getOrderDetail = async (orderId) => {
  const order = await prisma.order.findUnique({
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
                  price: true,
                  discountPrice: true,
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
  return order;
};

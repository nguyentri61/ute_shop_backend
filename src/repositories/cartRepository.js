import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const cartRepository = {
  /* ======================================================
     🔹 Lấy toàn bộ cartItem của user (bao gồm variant + product)
  ====================================================== */
  async getCartByUserId(userId) {
    return prisma.cartItem.findMany({
      where: { userId },
      include: {
        variant: {
          select: {
            id: true,
            color: true,
            size: true,
            stock: true,
            price: true,
            discountPrice: true,
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                productImage: {
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /* ======================================================
     🔹 Lấy các cartItem theo ID
  ====================================================== */
  async getCartByIds(cartItemIds, client = prisma) {
    return client.cartItem.findMany({
      where: {
        id: { in: cartItemIds },
      },
      include: {
        variant: {
          select: {
            id: true,
            color: true,
            size: true,
            stock: true,
            price: true,
            discountPrice: true,
            product: {
              select: {
                id: true,
                name: true,
                productImage: {
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
      },
    });
  },

  /* ======================================================
     🔹 Lấy cartItem theo ID
  ====================================================== */
  async findById(cartItemId) {
    return prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        variant: {
          select: {
            id: true,
            color: true,
            size: true,
            stock: true,
            price: true,
            discountPrice: true,
            product: {
              select: {
                id: true,
                name: true,
                productImage: {
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
      },
    });
  },

  /* ======================================================
     🔹 Thêm hoặc cập nhật số lượng cartItem
  ====================================================== */
  async addToCart(userId, variantId, quantity = 1) {
    return prisma.cartItem.upsert({
      where: {
        userId_variantId: { userId, variantId },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        userId,
        variantId,
        quantity,
      },
    });
  },

  /* ======================================================
     🔹 Cập nhật số lượng sản phẩm trong giỏ hàng
  ====================================================== */
  async updateQuantity(cartItemId, quantity) {
    return prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  },

  /* ======================================================
     🔹 Xóa một sản phẩm trong giỏ hàng
  ====================================================== */
  async removeCartItem(cartItemId) {
    return prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  },

  /* ======================================================
     🔹 Xóa nhiều sản phẩm trong giỏ hàng (sau khi thanh toán)
  ====================================================== */
  async removeCartItems(cartItemIds, client = prisma) {
    return client.cartItem.deleteMany({
      where: { id: { in: cartItemIds } },
    });
  },

  /* ======================================================
     🔹 Xóa toàn bộ giỏ hàng của user
  ====================================================== */
  async clearCart(userId) {
    return prisma.cartItem.deleteMany({
      where: { userId },
    });
  },
};

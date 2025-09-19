import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const cartRepository = {
  // Lấy toàn bộ cartItem của user
  async getCartByUserId(userId) {
    return prisma.cartItem.findMany({
      where: { userId },
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                productImage: {
                  take: 1,
                  select: { url: true }
                },
                price: true,
                discountPrice: true,
              }
            }
          }
        }
      }
    });
  },

  // Lấy các cartItem đã được chọn
  async getCartByIds(cartItemIds, client = prisma) {
    return client.cartItem.findMany({
      where: {
        id: { in: cartItemIds },
      },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    });
  },

  async findById(cartItemId) {
    return prisma.cartItem.findUnique({
      where: {
        id: cartItemId,
      },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    });
  },

  // Thêm hoặc cập nhật số lượng cartItem
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

  // Cập nhật số lượng
  async updateQuantity(cartItemId, quantity) {
    return prisma.cartItem.update({
      where: {
        id: cartItemId,
      },
      data: { quantity },
    });
  },

  async removeCartItem(cartItemId) {
    return prisma.cartItem.delete({
      where: {
        id: cartItemId,
      },
    });
  },

  async removeCartItems(cartItemIds, client = prisma) {
    return client.cartItem.deleteMany({
      where: { id: { in: cartItemIds } },
    });
  },

  // Xóa hết giỏ hàng
  async clearCart(userId) {
    return prisma.cartItem.deleteMany({
      where: { userId },
    });
  },
};

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
                                productimage: {
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

    // Lấy các cartItem đã được chọn 
    async getCartByIds(cartItemIds) {
        return prisma.cartItem.findMany({
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

    // Thêm hoặc cập nhật số lượng cartItem
    async addToCart(userId, variantId, quantity = 1) {
        return prisma.cartItem.upsert({
            where: {
                userId_variantId: { userId, variantId }, // vì @@unique([userId, variantId])
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
    async updateQuantity(userId, variantId, quantity) {
        if (quantity <= 0) {
            return this.removeFromCart(userId, variantId);
        }
        return prisma.cartItem.update({
            where: {
                userId_variantId: { userId, variantId },
            },
            data: { quantity },
        });
    },

    // Xóa 1 sản phẩm trong giỏ
    async removeFromCart(userId, variantId) {
        return prisma.cartItem.delete({
            where: {
                userId_variantId: { userId, variantId },
            },
        });
    },

    // Xóa hết giỏ hàng
    async clearCart(userId) {
        return prisma.cartItem.deleteMany({
            where: { userId },
        });
    },
};

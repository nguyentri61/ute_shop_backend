import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const findOrdersByUserId = async (userId) => {
    const orders = await prisma.order.findMany({
        where: { userId },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            discountPrice: true,
                            productimage: {
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

    return orders;
};

export const findOrderItemByOrderId = async (orderId) => {
    const orderItems = await prisma.orderitem.findMany({
        where: { orderId },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    price: true,
                    discountPrice: true,
                    productimage: {
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

export async function createOrder(userId, total) {
    return prisma.order.create({
        data: { userId, total },
    });
}

export async function createOrderItems(orderId, items) {
    return prisma.orderitem.createMany({
        data: items.map(item => ({
            orderId,
            productId: item.variant.productId,
            quantity: item.quantity,
        })),
    });
}

export async function deleteCartItems(cartItemIds) {
    return prisma.cartItem.deleteMany({
        where: { id: { in: cartItemIds } },
    });
}
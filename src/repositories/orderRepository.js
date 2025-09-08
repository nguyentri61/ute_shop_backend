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

export const createOrder = (userId, address, phone, total, client = prisma,) => {
    return client.order.create({
        data: { userId, address, phone, total }
    });
};

export const createOrderItems = (orderId, cartItems, client = prisma) => {
    return client.orderitem.createMany({
        data: cartItems.map(c => ({
            orderId,
            variantId: c.variantId,
            quantity: c.quantity,
            price: c.variant.price
        }))
    });
};


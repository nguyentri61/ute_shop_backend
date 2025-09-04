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

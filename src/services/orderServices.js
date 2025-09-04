import { findOrdersByUserId } from "../repositories/orderRepository.js";

export const getMyOrders = async (userId) => {
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
                id: item.product.id,
                name: item.product.name,
                price: item.product.price,
                discountPrice: item.product.discountPrice,
                image: item.product.productimage?.[0]?.url || null,
            },
        })),
    }));
};

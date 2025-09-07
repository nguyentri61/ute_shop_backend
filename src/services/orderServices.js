import { findOrdersByUserId, findOrderItemByOrderId, createOrder, createOrderItems, deleteCartItems } from "../repositories/orderRepository.js";
import { cartRepository } from "../repositories/cartRepository.js";

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

export const getOrderItemByOrderId = async (orderId) => {
    const orderItems = await findOrderItemByOrderId(orderId);
    return orderItems ?? [];
}

export const checkoutCart = async (userId) => {
    // Lấy toàn bộ cartItem của user
    const cartItems = await cartRepository.getCartByUserId(userId);

    if (!cartItems || cartItems.length === 0) {
        throw new Error("Giỏ hàng trống");
    }

    // Tính tổng tiền
    const total = cartItems.reduce((sum, item) => {
        const price = item.variant.discountPrice ?? item.variant.price;
        return sum + price * item.quantity;
    }, 0);

    // Tạo order
    const order = await createOrder(userId, total);

    // Tạo orderItems từ cartItems
    await createOrderItems(order.id, cartItems);

    // Xóa cartItems đã thanh toán
    const cartItemIds = cartItems.map(item => item.id);
    await deleteCartItems(cartItemIds);

    return order;
}
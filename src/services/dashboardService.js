import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function calcPercent(current, last) {
    if (last === 0) return current === 0 ? 0 : 100;
    return Math.round(((current - last) / last) * 100);
}

export const getDashboardStatsService = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Tổng số đơn hàng
    const totalOrders = await prisma.order.count();
    const lastMonthOrders = await prisma.order.count({
        where: {
            createdAt: {
                gte: startOfLastMonth,
                lte: endOfLastMonth,
            },
        },
    });
    const thisMonthOrders = await prisma.order.count({
        where: {
            createdAt: {
                gte: startOfMonth,
            },
        },
    });

    // Tổng số sản phẩm
    const totalProducts = await prisma.product.count();
    const lastMonthProducts = await prisma.product.count({
        where: {
            createdAt: {
                gte: startOfLastMonth,
                lte: endOfLastMonth,
            },
        },
    });
    const thisMonthProducts = await prisma.product.count({
        where: {
            createdAt: {
                gte: startOfMonth,
            },
        },
    });

    // Tổng số người dùng
    const totalUsers = await prisma.user.count();
    const lastMonthUsers = await prisma.user.count({
        where: {
            createdAt: {
                gte: startOfLastMonth,
                lte: endOfLastMonth,
            },
        },
    });
    const thisMonthUsers = await prisma.user.count({
        where: {
            createdAt: {
                gte: startOfMonth,
            },
        },
    });

    // Tổng doanh thu
    const totalRevenueObj = await prisma.order.aggregate({
        _sum: { total: true },
    });
    const lastMonthRevenueObj = await prisma.order.aggregate({
        _sum: { total: true },
        where: {
            createdAt: {
                gte: startOfLastMonth,
                lte: endOfLastMonth,
            },
        },
    });
    const thisMonthRevenueObj = await prisma.order.aggregate({
        _sum: { total: true },
        where: {
            createdAt: {
                gte: startOfMonth,
            },
        },
    });

    return {
        orders: {
            total: totalOrders,
            thisMonth: thisMonthOrders,
            lastMonth: lastMonthOrders,
            percent: calcPercent(thisMonthOrders, lastMonthOrders),
        },
        products: {
            total: totalProducts,
            thisMonth: thisMonthProducts,
            lastMonth: lastMonthProducts,
            percent: calcPercent(thisMonthProducts, lastMonthProducts),
        },
        users: {
            total: totalUsers,
            thisMonth: thisMonthUsers,
            lastMonth: lastMonthUsers,
            percent: calcPercent(thisMonthUsers, lastMonthUsers),
        },
        revenue: {
            total: totalRevenueObj._sum.total || 0,
            thisMonth: thisMonthRevenueObj._sum.total || 0,
            lastMonth: lastMonthRevenueObj._sum.total || 0,
            percent: calcPercent(thisMonthRevenueObj._sum.total || 0, lastMonthRevenueObj._sum.total || 0),
        },
    };
};
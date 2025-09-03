import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Lấy tất cả sản phẩm
export const findAllProducts = async () => {
    return prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        include: { productimage: true },
    });
};

// 1. Sản phẩm mới nhất
export const findNewestProducts = async (limit) => {
    return prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { productimage: true },
    });
};

// 2. Sản phẩm bán chạy nhất
export const findBestSellingProducts = async (limit) => {
    const productsSold = await prisma.orderitem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: limit,
    });

    const productIds = productsSold.map((p) => p.productId);
    const productDetails = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { productimage: true },
    });

    return productDetails.map((prod) => {
        const soldInfo = productsSold.find((p) => p.productId === prod.id);
        return { ...prod, totalSold: soldInfo?._sum.quantity || 0 };
    });
};

// 3. Sản phẩm được xem nhiều nhất
export const findMostViewedProducts = async (limit) => {
    return prisma.product.findMany({
        orderBy: { viewCount: "desc" },
        take: limit,
        include: { productimage: true },
    });
};

// 4. Sản phẩm có khuyến mãi cao nhất
export const findTopDiscountProducts = async (limit) => {
    const products = await prisma.product.findMany({
        where: { discountPrice: { not: null } },
        include: { productimage: true },
    });

    const sorted = products
        .map((p) => ({ ...p, discountAmount: p.price - (p.discountPrice || 0) }))
        .sort((a, b) => b.discountAmount - a.discountAmount);

    return sorted.slice(0, limit);
};

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Lấy tất cả sản phẩm
export const findAllProducts = async (page, limit, skip) => {
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { productImage: true },
  });
};

export const findTotalProductsNumber = async () => {
  return await prisma.product.count();
};

export const findProducts = async (skip, take) => {
  return await prisma.product.findMany({
    skip,
    take,
    orderBy: { createdAt: "desc" },
    include: { productImage: true },
  });
};

// 1. Sản phẩm mới nhất
export const findNewestProducts = async (limit) => {
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { productImage: true },
  });
};

// 2. Sản phẩm bán chạy nhất
export const findBestSellingProducts = async (limit) => {
  const productsSold = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  const productIds = productsSold.map((p) => p.productId);
  const productDetails = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { productImage: true },
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
    include: { productImage: true },
  });
};

// 4. Sản phẩm có khuyến mãi cao nhất
export const findTopDiscountProducts = async (limit) => {
  const products = await prisma.product.findMany({
    where: { discountPrice: { not: null } },
    include: { productImage: true },
  });

  const sorted = products
    .map((p) => ({ ...p, discountAmount: p.price - (p.discountPrice || 0) }))
    .sort((a, b) => b.discountAmount - a.discountAmount);

  return sorted.slice(0, limit);
};

export const findProductById = async (id) => {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      productImage: true,
      variants: {   // dùng đúng tên field trong schema
        select: {
          id: true,
          size: true,
          color: true,
          stock: true,
          price: true,
          discountPrice: true,
        },
      },
    },
  });
};


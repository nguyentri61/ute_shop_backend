import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
import Fuse from "fuse.js";

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
  // B1: group theo variantId
  const variantsSold = await prisma.orderItem.groupBy({
    by: ["variantId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  // Lấy danh sách variantId
  const variantIds = variantsSold.map((v) => v.variantId);

  // B2: lấy chi tiết variant và product
  const variantDetails = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      product: {
        include: { productImage: true }, // lấy ảnh của product
      },
    },
  });

  // B3: gắn thông tin số lượng đã bán vào product
  return variantDetails.map((variant) => {
    const soldInfo = variantsSold.find((v) => v.variantId === variant.id);
    return {
      ...variant.product, // dữ liệu product
      variantId: variant.id,
      variantStock: variant.stock,
      variantPrice: variant.price,
      variantDiscountPrice: variant.discountPrice,
      totalSold: soldInfo?._sum.quantity || 0,
    };
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
      variants: {
        select: {
          id: true,
          size: true,
          color: true,
          stock: true,
          price: true,
          discountPrice: true,
          orderItems: {
            select: { quantity: true }, // lấy số lượng bán theo variant
          },
        },
      },
      reviews: { select: { id: true } }, // chỉ cần đếm review
    },
  });
};
// Kiểm tra order đã mua thành công
export const findDeliveredOrderItem = async (userId, productId) => {
  return prisma.orderItem.findFirst({
    where: {
      variant: { productId },
      order: { userId, status: "DELIVERED" },
    },
  });
};

// Tạo review
export const createReview = async (data) => {
  return prisma.review.create({ data });
};

// Lấy review của user cho sản phẩm
export const getReviewByUserIdAndProductId = async (userId, productId) => {
  return await prisma.review.findFirst({
    where: { userId, productId },
  });
};

// Tạo coupon
export const createCoupon = async (data) => {
  return prisma.coupon.create({ data });
};

// Lấy sản phẩm tương tự
export const findSimilarProducts = async (
  categoryId,
  excludeProductId,
  limit
) => {
  return prisma.product.findMany({
    where: {
      categoryId: categoryId,
      id: {
        not: excludeProductId,
      },
    },
    take: limit,
    include: {
      productImage: true,
      category: true,
      variants: {
        select: {
          id: true,
          size: true,
          color: true,
          stock: true,
          price: true,
          discountPrice: true,
        },
      },
      reviews: {
        select: {
          rating: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findProductsByCategory = async (categoryId, skip, take) => {
  return prisma.product.findMany({
    where: { categoryId },
    skip,
    take,
    orderBy: { createdAt: "desc" },
    include: { productImage: true },
  });
};

export const countProductsByCategory = async (categoryId) => {
  return await prisma.product.count({
    where: { categoryId },
  });
};

export const findProductsByFilters = async (
  search,
  category,
  minPrice,
  maxPrice,
  sortDate,
  sortPrice,
  skip,
  take
) => {
  const min = minPrice !== undefined ? Number(minPrice) : undefined;
  const max = maxPrice !== undefined ? Number(maxPrice) : undefined;

  // 1. Điều kiện lọc sơ bộ trong Prisma (tránh lấy quá nhiều data)
  const where = {};
  if (category) where.categoryId = category;
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.OR = [
      {
        price: {
          gte: min ?? 0,
          lte: max ?? Number.MAX_SAFE_INTEGER,
        },
      },
      {
        discountPrice: {
          gte: min ?? 0,
          lte: max ?? Number.MAX_SAFE_INTEGER,
        },
      },
    ];
  }

  // 2. Lấy sản phẩm từ DB
  let products = await prisma.product.findMany({
    where,
    include: { productImage: true },
    orderBy: sortDate ? { createdAt: sortDate } : undefined, // sort sơ bộ theo ngày nếu có
  });

  // 3. Áp dụng Fuse.js nếu có search text
  if (search) {
    const fuse = new Fuse(products, {
      keys: ["name", "description"], // có thể mở rộng tìm kiếm theo description, tags
      threshold: 0.3, // 0.0 = khớp chính xác, 1.0 = khớp hết; 0.3 là hợp lý
    });

    const fuseResults = fuse.search(search);
    products = fuseResults.map((result) => result.item);
  }

  // 4. Sắp xếp
  if (sortPrice) {
    products.sort((a, b) =>
      sortPrice === "asc"
        ? (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price)
        : (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price)
    );
  }

  if (sortDate) {
    products.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortDate === "asc" ? dateA - dateB : dateB - dateA;
    });
  }

  // 5. Phân trang (skip, take)
  const total = products.length;
  const paginated = products.slice(skip, skip + take);

  return {
    total,
    products: paginated,
  };
};

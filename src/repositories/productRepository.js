import { PrismaClient } from "@prisma/client";
import Fuse from "fuse.js";

const prisma = new PrismaClient();

/* ======================================================
   🔹 Helper: Gắn giá, giảm giá, tồn kho vào product
====================================================== */
function mapProductWithVariantData(product) {
  if (!product?.variants || product.variants.length === 0) {
    return { ...product, price: 0, discountPrice: null, stock: 0 };
  }

  const prices = product.variants.map((v) => v.price);
  const discountPrices = product.variants
    .filter((v) => v.discountPrice != null)
    .map((v) => v.discountPrice);
  const stocks = product.variants.map((v) => v.stock);

  const minPrice = Math.min(...prices);
  const minDiscount = discountPrices.length > 0 ? Math.min(...discountPrices) : null;
  const totalStock = stocks.reduce((a, b) => a + b, 0);

  return {
    ...product,
    price: minPrice,
    discountPrice: minDiscount,
    stock: totalStock,
  };
}

/* ======================================================
   🔹 Lấy danh sách sản phẩm
====================================================== */
export const findAllProducts = async () => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { productImage: true, variants: true },
  });
  return products.map(mapProductWithVariantData);
};

export const findTotalProductsNumber = async () => {
  return prisma.product.count();
};

export const findProducts = async (skip, take) => {
  const products = await prisma.product.findMany({
    skip,
    take,
    orderBy: { createdAt: "desc" },
    include: { productImage: true, variants: true },
  });
  return products.map(mapProductWithVariantData);
};

/* ======================================================
   🔹 Sản phẩm mới nhất
====================================================== */
export const findNewestProducts = async (limit) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { productImage: true, variants: true },
  });
  return products.map(mapProductWithVariantData);
};

/* ======================================================
   🔹 Sản phẩm bán chạy nhất
====================================================== */
export const findBestSellingProducts = async (limit) => {
  const variantsSold = await prisma.orderItem.groupBy({
    by: ["variantId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  const variantIds = variantsSold.map((v) => v.variantId);

  const variantDetails = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: { include: { productImage: true, variants: true } } },
  });

  const products = variantDetails.map((variant) => {
    const soldInfo = variantsSold.find((v) => v.variantId === variant.id);
    const product = mapProductWithVariantData(variant.product);
    return {
      ...product,
      variantId: variant.id,
      variantStock: variant.stock,
      variantPrice: variant.price,
      variantDiscountPrice: variant.discountPrice,
      totalSold: soldInfo?._sum.quantity || 0,
    };
  });

  return products;
};

/* ======================================================
   🔹 Sản phẩm được xem nhiều nhất
====================================================== */
export const findMostViewedProducts = async (limit) => {
  const products = await prisma.product.findMany({
    orderBy: { viewCount: "desc" },
    take: limit,
    include: { productImage: true, variants: true },
  });
  return products.map(mapProductWithVariantData);
};

/* ======================================================
   🔹 Sản phẩm có khuyến mãi cao nhất
====================================================== */
export const findTopDiscountProducts = async (limit) => {
  const variants = await prisma.productVariant.findMany({
    where: { discountPrice: { not: null } },
    include: { product: { include: { productImage: true, variants: true } } },
  });

  const sorted = variants
    .map((v) => ({
      ...v.product,
      variantId: v.id,
      discountAmount: (v.price || 0) - (v.discountPrice || 0),
    }))
    .sort((a, b) => b.discountAmount - a.discountAmount);

  const uniqueProducts = [];
  const seen = new Set();
  for (const item of sorted) {
    if (!seen.has(item.id)) {
      uniqueProducts.push(mapProductWithVariantData(item));
      seen.add(item.id);
    }
  }

  return uniqueProducts.slice(0, limit);
};

/* ======================================================
   🔹 Chi tiết sản phẩm theo ID
====================================================== */
export const findProductById = async (id) => {
  const product = await prisma.product.findUnique({
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
          orderItems: { select: { quantity: true } },
        },
      },
      reviews: { select: { id: true } },
    },
  });
  if (!product) return null;
  return mapProductWithVariantData(product);
};

/* ======================================================
   🔹 Kiểm tra order đã mua thành công
====================================================== */
export const findDeliveredOrderItem = async (userId, productId) => {
  return prisma.orderItem.findFirst({
    where: {
      variant: { productId },
      order: { userId, status: "DELIVERED" },
    },
  });
};

/* ======================================================
   🔹 Review
====================================================== */
export const createReview = async (data) => prisma.review.create({ data });

export const getReviewByUserIdAndProductId = async (userId, productId) => {
  return prisma.review.findFirst({ where: { userId, productId } });
};

/* ======================================================
   🔹 Coupon
====================================================== */
export const createCoupon = async (data) => prisma.coupon.create({ data });

/* ======================================================
   🔹 Sản phẩm tương tự
====================================================== */
export const findSimilarProducts = async (categoryId, excludeProductId, limit) => {
  const products = await prisma.product.findMany({
    where: { categoryId, id: { not: excludeProductId } },
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
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return products.map(mapProductWithVariantData);
};

/* ======================================================
   🔹 Lọc theo danh mục
====================================================== */
export const findProductsByCategory = async (categoryId, skip, take) => {
  const products = await prisma.product.findMany({
    where: { categoryId },
    skip,
    take,
    orderBy: { createdAt: "desc" },
    include: { productImage: true, variants: true },
  });
  return products.map(mapProductWithVariantData);
};

export const countProductsByCategory = async (categoryId) => {
  return prisma.product.count({ where: { categoryId } });
};

/* ======================================================
   🔹 Lọc sản phẩm theo điều kiện (Fuse.js + Prisma)
====================================================== */
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

  const where = {};
  if (category) where.categoryId = category;

  let products = await prisma.product.findMany({
    where,
    include: { productImage: true, variants: true },
    orderBy: sortDate ? { createdAt: sortDate } : undefined,
  });

  if (min !== undefined || max !== undefined) {
    products = products.filter((p) =>
      p.variants.some((v) => {
        const price = v.discountPrice ?? v.price;
        return price >= (min ?? 0) && price <= (max ?? Number.MAX_SAFE_INTEGER);
      })
    );
  }

  if (search) {
    const fuse = new Fuse(products, { keys: ["name", "description"], threshold: 0.3 });
    const fuseResults = fuse.search(search);
    products = fuseResults.map((r) => r.item);
  }

  if (sortPrice) {
    products.sort((a, b) => {
      const aMin = Math.min(...a.variants.map((v) => v.discountPrice ?? v.price));
      const bMin = Math.min(...b.variants.map((v) => v.discountPrice ?? v.price));
      return sortPrice === "asc" ? aMin - bMin : bMin - aMin;
    });
  }

  if (sortDate) {
    products.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortDate === "asc" ? dateA - dateB : dateB - dateA;
    });
  }

  const total = products.length;
  const paginated = products.slice(skip, skip + take);

  return {
    total,
    products: paginated.map(mapProductWithVariantData),
  };
};

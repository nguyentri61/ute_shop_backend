import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ======================================================
   🔹 Helper: Tính giá, giảm giá, tồn kho từ variants
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
   🔹 Lấy danh sách sản phẩm đã xem gần đây
====================================================== */
export const getRecentlyViewedByUserId = async (userId, limit = 8) => {
  try {
    const recentlyViewed = await prisma.recentlyViewed.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            productImage: true,
            category: true,
            variants: true,
            reviews: { select: { rating: true } },
          },
        },
      },
      orderBy: { viewedAt: "desc" },
      take: limit,
    });

    const productsWithRating = recentlyViewed.map((item) => {
      const product = mapProductWithVariantData(item.product);
      const ratings = item.product.reviews.map((r) => r.rating);
      const avg =
        ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : 0;

      return {
        ...product,
        averageRating: avg,
        reviewCount: ratings.length,
        viewedAt: item.viewedAt,
      };
    });

    return productsWithRating;
  } catch (error) {
    throw new Error(`Lỗi khi lấy danh sách đã xem: ${error.message}`);
  }
};

/* ======================================================
   🔹 Thêm sản phẩm vào danh sách đã xem
====================================================== */
export const addToRecentlyViewed = async (userId, productId) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Sản phẩm không tồn tại");

    const existingView = await prisma.recentlyViewed.findFirst({
      where: { userId, productId },
    });

    if (existingView) {
      // ✅ Cập nhật thời gian xem mới nhất
      await prisma.recentlyViewed.update({
        where: { id: existingView.id },
        data: { viewedAt: new Date() },
      });
    } else {
      // ✅ Tạo bản ghi mới
      await prisma.recentlyViewed.create({
        data: { userId, productId },
      });
    }

    // ✅ Giới hạn tối đa 50 sản phẩm
    const userViews = await prisma.recentlyViewed.findMany({
      where: { userId },
      orderBy: { viewedAt: "desc" },
      select: { id: true },
    });

    if (userViews.length > 50) {
      const viewsToDelete = userViews.slice(50);
      await prisma.recentlyViewed.deleteMany({
        where: { id: { in: viewsToDelete.map((v) => v.id) } },
      });
    }

    return { message: "Đã cập nhật danh sách đã xem" };
  } catch (error) {
    throw new Error(`Lỗi khi cập nhật đã xem: ${error.message}`);
  }
};

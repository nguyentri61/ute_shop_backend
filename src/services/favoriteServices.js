import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/* ======================================================
   🔹 Helper: Gắn giá, giảm giá, tồn kho từ variants
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
   🔹 Lấy danh sách sản phẩm yêu thích của user
====================================================== */
export const getFavoritesByUserId = async (userId) => {
  try {
    const favorites = await prisma.favorite.findMany({
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
      orderBy: { createdAt: "desc" },
    });

    const products = favorites.map((fav) => {
      const product = fav.product;
      const mapped = mapProductWithVariantData(product);
      const ratings = product.reviews.map((r) => r.rating);
      const avg =
        ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : 0;
      return { ...mapped, averageRating: avg, reviewCount: ratings.length };
    });

    return products;
  } catch (error) {
    throw new Error(`Lỗi khi lấy danh sách yêu thích: ${error.message}`);
  }
};

/* ======================================================
   🔹 Thêm sản phẩm vào danh sách yêu thích
====================================================== */
export const addToFavorites = async (userId, productId) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Sản phẩm không tồn tại");

    const existingFavorite = await prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existingFavorite) throw new Error("Sản phẩm đã có trong danh sách yêu thích");

    const favorite = await prisma.favorite.create({
      data: { userId, productId },
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
    });

    const productData = favorite.product;
    const mapped = mapProductWithVariantData(productData);
    const ratings = productData.reviews.map((r) => r.rating);
    const avg =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;

    return { ...mapped, averageRating: avg, reviewCount: ratings.length };
  } catch (error) {
    throw new Error(`Lỗi khi thêm vào yêu thích: ${error.message}`);
  }
};

/* ======================================================
   🔹 Xóa sản phẩm khỏi danh sách yêu thích
====================================================== */
export const removeFromFavorites = async (userId, productId) => {
  try {
    const favorite = await prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (!favorite) throw new Error("Sản phẩm không có trong danh sách yêu thích");

    await prisma.favorite.delete({
      where: { userId_productId: { userId, productId } },
    });

    return { message: "Đã xóa khỏi danh sách yêu thích" };
  } catch (error) {
    throw new Error(`Lỗi khi xóa khỏi yêu thích: ${error.message}`);
  }
};

/* ======================================================
   🔹 Kiểm tra sản phẩm có trong danh sách yêu thích không
====================================================== */
export const checkIsFavorite = async (userId, productId) => {
  try {
    const favorite = await prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    return { isFavorite: !!favorite };
  } catch (error) {
    throw new Error(`Lỗi khi kiểm tra yêu thích: ${error.message}`);
  }
};

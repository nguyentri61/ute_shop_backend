import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Lấy danh sách sản phẩm yêu thích của user
export const getFavoritesByUserId = async (userId) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: userId,
      },
      include: {
        product: {
          include: {
            productImage: true,
            category: true,
            variants: true,
            reviews: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Tính rating trung bình cho mỗi sản phẩm
    const productsWithRating = favorites.map((favorite) => {
      const product = favorite.product;
      const ratings = product.reviews.map((review) => review.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;

      return {
        ...product,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: ratings.length,
      };
    });

    return productsWithRating;
  } catch (error) {
    throw new Error(`Lỗi khi lấy danh sách yêu thích: ${error.message}`);
  }
};

// Thêm sản phẩm vào danh sách yêu thích
export const addToFavorites = async (userId, productId) => {
  try {
    // Kiểm tra sản phẩm có tồn tại không
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Sản phẩm không tồn tại");
    }

    // Kiểm tra đã có trong favorites chưa
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: userId,
          productId: productId,
        },
      },
    });

    if (existingFavorite) {
      throw new Error("Sản phẩm đã có trong danh sách yêu thích");
    }

    // Thêm vào favorites
    const favorite = await prisma.favorite.create({
      data: {
        userId: userId,
        productId: productId,
      },
      include: {
        product: {
          include: {
            productImage: true,
            category: true,
            variants: true,
            reviews: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
    });

    // Tính rating trung bình
    const ratings = favorite.product.reviews.map((review) => review.rating);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0;

    return {
      ...favorite.product,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: ratings.length,
    };
  } catch (error) {
    throw new Error(`Lỗi khi thêm vào yêu thích: ${error.message}`);
  }
};

// Xóa sản phẩm khỏi danh sách yêu thích
export const removeFromFavorites = async (userId, productId) => {
  try {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: userId,
          productId: productId,
        },
      },
    });

    if (!favorite) {
      throw new Error("Sản phẩm không có trong danh sách yêu thích");
    }

    await prisma.favorite.delete({
      where: {
        userId_productId: {
          userId: userId,
          productId: productId,
        },
      },
    });

    return { message: "Đã xóa khỏi danh sách yêu thích" };
  } catch (error) {
    throw new Error(`Lỗi khi xóa khỏi yêu thích: ${error.message}`);
  }
};

// Kiểm tra sản phẩm có trong danh sách yêu thích không
export const checkIsFavorite = async (userId, productId) => {
  try {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: userId,
          productId: productId,
        },
      },
    });

    return { isFavorite: !!favorite };
  } catch (error) {
    throw new Error(`Lỗi khi kiểm tra yêu thích: ${error.message}`);
  }
};

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Lấy danh sách sản phẩm đã xem gần đây
export const getRecentlyViewedByUserId = async (userId, limit = 8) => {
  try {
    const recentlyViewed = await prisma.recentlyViewed.findMany({
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
        viewedAt: "desc",
      },
      take: limit,
    });

    // Tính rating trung bình cho mỗi sản phẩm
    const productsWithRating = recentlyViewed.map((item) => {
      const product = item.product;
      const ratings = product.reviews.map((review) => review.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;

      return {
        ...product,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: ratings.length,
        viewedAt: item.viewedAt,
      };
    });

    return productsWithRating;
  } catch (error) {
    throw new Error(`Lỗi khi lấy danh sách đã xem: ${error.message}`);
  }
};

// Thêm sản phẩm vào danh sách đã xem
export const addToRecentlyViewed = async (userId, productId) => {
  try {
    // Kiểm tra sản phẩm có tồn tại không
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Sản phẩm không tồn tại");
    }

    // Kiểm tra đã có trong recently viewed chưa
    const existingView = await prisma.recentlyViewed.findFirst({
      where: {
        userId: userId,
        productId: productId,
      },
    });

    if (existingView) {
      // Nếu đã có, cập nhật thời gian xem
      await prisma.recentlyViewed.update({
        where: {
          id: existingView.id,
        },
        data: {
          viewedAt: new Date(),
        },
      });
    } else {
      // Nếu chưa có, tạo mới
      await prisma.recentlyViewed.create({
        data: {
          userId: userId,
          productId: productId,
        },
      });
    }

    // Giới hạn số lượng recently viewed (giữ lại 50 sản phẩm gần nhất)
    const userViews = await prisma.recentlyViewed.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        viewedAt: "desc",
      },
    });

    if (userViews.length > 50) {
      const viewsToDelete = userViews.slice(50);
      await prisma.recentlyViewed.deleteMany({
        where: {
          id: {
            in: viewsToDelete.map(view => view.id),
          },
        },
      });
    }

    return { message: "Đã cập nhật danh sách đã xem" };
  } catch (error) {
    throw new Error(`Lỗi khi cập nhật đã xem: ${error.message}`);
  }
};

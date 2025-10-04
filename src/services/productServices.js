const { ProductDetailDTO } = require("../dto/product.dto");
const productRepository = require("../repositories/productRepository");
const { v4: uuidv4 } = require("uuid");
const { notifyAdmin } = require("./notificationService");

async function getAllProducts() {
  return productRepository.findAllProducts();
}

const getPaginatedProducts = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const total = await productRepository.findTotalProductsNumber();
  const products = await productRepository.findProducts(skip, limit);

  return {
    data: products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

async function getNewestProducts() {
  return productRepository.findNewestProducts(8);
}

async function getBestSellingProducts() {
  return productRepository.findBestSellingProducts(6);
}

async function getMostViewedProducts() {
  return productRepository.findMostViewedProducts(8);
}

async function getTopDiscountProducts() {
  return productRepository.findTopDiscountProducts(4);
}

async function getProductByIdService(id) {
  const product = await productRepository.findProductById(id);

  if (!product) return null;

  return ProductDetailDTO(product);
}

//Đánh giá sản phẩm
async function createReviewService({ userId, productId, rating, comment }) {
  const orderItem = await productRepository.findDeliveredOrderItem(
    userId,
    productId
  );
  if (!orderItem) {
    throw new Error("Bạn chưa mua sản phẩm này hoặc đơn chưa giao thành công");
  }

  const review = await productRepository.createReview({
    userId,
    productId,
    rating,
    comment,
  });

  const coupon = await productRepository.createCoupon({
    code: "REVIEW-" + uuidv4().slice(0, 8).toUpperCase(),
    type: "PRODUCT",
    description: "Mã giảm giá 15% cho lần mua tiếp theo",
    minOrderValue: 0,
    discount: 15000,
    expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userId,
  });
  notifyAdmin({
    message: `Đã có người dùng đánh giá sản phẩm`,
    type: "admin",
    link: `/products/${productId}`,
  });

  return { review, coupon };
}

async function getReviewByUserIdAndProductId(userId, productId) {
  return await productRepository.getReviewByUserIdAndProductId(
    userId,
    productId
  );
}

// Lấy sản phẩm tương tự
async function getSimilarProductsService(productId, limit = 8) {
  // Lấy thông tin sản phẩm hiện tại
  const currentProduct = await productRepository.findProductById(productId);
  if (!currentProduct) {
    throw new Error("Sản phẩm không tồn tại");
  }

  // Lấy sản phẩm cùng danh mục, loại trừ sản phẩm hiện tại
  const similarProducts = await productRepository.findSimilarProducts(
    currentProduct.categoryId,
    productId,
    limit
  );

  return similarProducts;
}

async function getProductsByCategoryService(categoryId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const products = await productRepository.findProductsByCategory(
    categoryId,
    skip,
    limit
  );
  const total = await productRepository.countProductsByCategory(categoryId);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

const getProductsService = async (
  search,
  category,
  minPrice,
  maxPrice,
  sortDate,
  sortPrice,
  page,
  limit
) => {
  const skip = (page - 1) * limit;
  const res = await productRepository.findProductsByFilters(
    search,
    category,
    minPrice,
    maxPrice,
    sortDate,
    sortPrice,
    skip,
    limit
  );
  return {
    products: res.products,
    pagination: {
      total: res.total,
      page,
      limit,
      totalPages: Math.ceil(res.total / limit),
    },
  };
};

module.exports = {
  getPaginatedProducts,
  getAllProducts,
  getNewestProducts,
  getBestSellingProducts,
  getMostViewedProducts,
  getTopDiscountProducts,
  getProductByIdService,
  createReviewService,
  getSimilarProductsService,
  getProductsByCategoryService,
  getProductsService,
  getReviewByUserIdAndProductId,
};

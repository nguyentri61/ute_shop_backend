const { ProductDetailDTO } = require("../dto/product.dto");
const productRepository = require("../repositories/productRepository");

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

module.exports = {
  getPaginatedProducts,
  getAllProducts,
  getNewestProducts,
  getBestSellingProducts,
  getMostViewedProducts,
  getTopDiscountProducts,
  getProductByIdService,
};

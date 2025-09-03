const productRepository = require('../repositories/productRepository');

async function getAllProducts() {
    return productRepository.findAllProducts();
}

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

module.exports = {
    getAllProducts,
    getNewestProducts,
    getBestSellingProducts,
    getMostViewedProducts,
    getTopDiscountProducts
};

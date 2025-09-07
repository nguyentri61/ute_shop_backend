const productVariantRepository = require('../repositories/productVariantRepository');

const productVariantService = {
    async getVariantsByProduct(productId) {
        return productVariantRepository.findAllByProductId(productId);
    },

    async getVariant(id) {
        return productVariantRepository.findById(id);
    },

    async createVariant(data) {
        // có thể validate dữ liệu ở đây
        return productVariantRepository.create(data);
    },

    async updateVariant(id, data) {
        return productVariantRepository.update(id, data);
    },

    async deleteVariant(id) {
        return productVariantRepository.delete(id);
    },
};

module.exports = productVariantService;

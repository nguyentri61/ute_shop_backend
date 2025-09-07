const productVariantService = require('../services/productVariantServices');

const productVariantController = {
    async getVariantsByProduct(req, res) {
        const { productId } = req.params;
        const variants = await productVariantService.getVariantsByProduct(productId);
        res.json(variants);
    },

    async getVariant(req, res) {
        const { id } = req.params;
        const variant = await productVariantService.getVariant(id);
        res.json(variant);
    },

    async createVariant(req, res) {
        const data = req.body;
        const variant = await productVariantService.createVariant(data);
        res.status(201).json(variant);
    },

    async updateVariant(req, res) {
        const { id } = req.params;
        const data = req.body;
        const variant = await productVariantService.updateVariant(id, data);
        res.json(variant);
    },

    async deleteVariant(req, res) {
        const { id } = req.params;
        await productVariantService.deleteVariant(id);
        res.status(204).send();
    },
};

module.exports = productVariantController;

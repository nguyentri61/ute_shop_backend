const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const productVariantRepository = {
    async findAllByProductId(productId) {
        return prisma.productVariant.findMany({
            where: { productId },
        });
    },

    async findById(id) {
        return prisma.productVariant.findUnique({
            where: { id },
        });
    },

    async create(data) {
        return prisma.productVariant.create({
            data,
        });
    },

    async update(id, data) {
        return prisma.productVariant.update({
            where: { id },
            data,
        });
    },

    async delete(id) {
        return prisma.productVariant.delete({
            where: { id },
        });
    },

    async increaseStock(id, quantity, tx = prisma) {
        return tx.productVariant.update({
            where: { id },
            data: {
                stock: {
                    increment: quantity,
                },
            },
        });
    },

    async decreaseStock(id, quantity, tx = prisma) {
        return tx.productVariant.update({
            where: { id },
            data: {
                stock: {
                    decrement: quantity,
                },
            },
        });
    },

};

module.exports = productVariantRepository;

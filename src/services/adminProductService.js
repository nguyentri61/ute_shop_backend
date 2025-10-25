// src/services/adminProductService.js
import * as productRepo from "../repositories/productRepository.js";

export const listProducts = async ({
    page = 1,
    size = 10,
    q = "",
    categoryId,
    minPrice,
    maxPrice,
    sortPrice,
    sortDate,
} = {}) => {
    const pageNum = Number(page) || 1;
    const sizeNum = Number(size) || 10;
    const skip = (pageNum - 1) * sizeNum;
    const take = sizeNum;

    // call the flexible finder
    return productRepo.findProductsFlexible({
        skip,
        take,
        q,
        categoryId,
        minPrice,
        maxPrice,
        sortPrice,
        sortDate,
    });
};
export const getProductById = async (id) => {
    return productRepo.findProductById(id);
};

export const createProduct = async ({ body = {}, files = [], user } = {}) => {
    const { name, description = null, categoryId, variants = [], images = [] } = body;

    if (!name || !categoryId) {
        const err = new Error("Name and categoryId are required");
        err.code = "INVALID_INPUT";
        throw err;
    }

    // prepare images array:
    // - images[] (string URLs) from body
    // - files[] -> convert to public URL path (depends on your upload middleware dest)
    // assuming uploadMedia saves files into: public/uploads/messages or public/uploads/products
    const fileUrls = (files || []).map((f) => {
        // choose a base path that matches your static serve. Example: /uploads/messages/<filename>
        // if uploadDir in uploadMedia is "public/uploads/messages" then URL path = `/uploads/messages/${f.filename}`
        return `/uploads/messages/${f.filename}`; // <-- Tùy theo uploadMedia.storage.destination
    });

    const allImageUrls = [
        ...((Array.isArray(images) ? images : []).map((u) => String(u).trim()).filter(Boolean)),
        ...fileUrls,
    ];

    // create product with variants and images in a transaction
    const created = await prisma.$transaction(async (tx) => {
        const p = await tx.product.create({
            data: {
                name,
                description,
                categoryId,
                // other product fields if any
            },
        });

        // create variants (if any)
        if (Array.isArray(variants)) {
            for (const v of variants) {
                await tx.productVariant.create({
                    data: {
                        productId: p.id,
                        color: v.color ?? null,
                        size: v.size ?? null,
                        price: v.price != null ? Number(v.price) : 0,
                        discountPrice: v.discountPrice != null ? (v.discountPrice === "" ? null : Number(v.discountPrice)) : null,
                        stock: v.stock != null ? Number(v.stock) : 0,
                    },
                });
            }
        }

        // create productImage rows
        if (allImageUrls.length) {
            for (const url of allImageUrls) {
                await tx.productImage.create({
                    data: { productId: p.id, url },
                });
            }
        }

        // return product with relations
        const productWithRelations = await tx.product.findUnique({
            where: { id: p.id },
            include: { variants: true, productImage: true, category: true },
        });

        return productWithRelations;
    });

    return created;
};

export const updateProduct = async (id, payload) => {
    return productRepo.updateProduct(id, payload);
};

export const removeProduct = async (id) => {
    return productRepo.deleteProduct(id);
};

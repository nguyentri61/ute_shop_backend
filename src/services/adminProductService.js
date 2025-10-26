// src/services/adminProductService.js
import * as productRepo from "../repositories/productRepository.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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

export const createProduct = async (payload = {}) => {
    // Support both calling styles:
    //  - createProduct({ body, files, user })
    //  - createProduct({ name, categoryId, ... })
    const body = payload.body ?? payload;
    const files = payload.files ?? [];
    const user = payload.user ?? null;

    // Debug: log what we received (temporarily)
    console.log("createProduct payload.body:", body);
    console.log("createProduct files.length:", (files && files.length) || 0);

    // If body is string (rare), try parse
    let parsedBody = body;
    if (typeof body === "string") {
        try {
            parsedBody = JSON.parse(body);
        } catch (e) {
            parsedBody = {};
        }
    }

    // Safely parse possible JSON-string fields
    const safeParse = (val) => {
        if (Array.isArray(val)) return val;
        if (!val && val !== "") return [];
        if (typeof val === "string") {
            try {
                const p = JSON.parse(val);
                return Array.isArray(p) ? p : [];
            } catch (e) {
                return [];
            }
        }
        return [];
    };

    const name = parsedBody.name != null ? String(parsedBody.name).trim() : "";
    const categoryId = parsedBody.categoryId != null ? String(parsedBody.categoryId).trim() : "";
    const description = parsedBody.description != null ? String(parsedBody.description) : null;

    if (!name || !categoryId) {
        const err = new Error("Name and categoryId are required");
        err.code = "INVALID_INPUT";
        throw err;
    }

    const variants = safeParse(parsedBody.variants); // array of objects
    const providedImages = safeParse(parsedBody.images); // array of URLs (strings)

    // Convert uploaded files to public URL paths (adjust if your upload destination differs)
    // If uploadMedia destination = "public/uploads/messages", then public url path is `/uploads/messages/<filename>`
    const fileUrls = (files || []).map((f) => {
        // prefer f.filename; but if not present try f.path -> extract basename
        const filename = f.filename || (f.path ? f.path.split("/").pop().split("\\").pop() : null);
        return filename ? `/uploads/messages/${filename}` : null;
    }).filter(Boolean);

    const allImageUrls = [
        ...providedImages.map((u) => String(u).trim()).filter(Boolean),
        ...fileUrls,
    ];

    // Transaction: create product, variants, images
    const created = await prisma.$transaction(async (tx) => {
        const p = await tx.product.create({
            data: {
                name,
                description,
                categoryId,
            },
        });

        if (Array.isArray(variants) && variants.length > 0) {
            for (const v of variants) {
                // guard for missing fields
                await tx.productVariant.create({
                    data: {
                        productId: p.id,
                        color: v.color ?? null,
                        size: v.size ?? null,
                        price: v.price != null ? Number(v.price) : 0,
                        discountPrice:
                            v.discountPrice != null ? (v.discountPrice === "" ? null : Number(v.discountPrice)) : null,
                        stock: v.stock != null ? Number(v.stock) : 0,
                    },
                });
            }
        }

        if (allImageUrls.length > 0) {
            for (const url of allImageUrls) {
                await tx.productImage.create({
                    data: { productId: p.id, url },
                });
            }
        }

        const productWithRelations = await tx.product.findUnique({
            where: { id: p.id },
            include: { variants: true, productImage: true, category: true },
        });

        return productWithRelations;
    });

    return created;
};
export const updateProduct = async (id, opts = {}) => {
    const { body = {}, files = [], user } = opts;

    // safe-parse variants/images if sent as JSON string (common when sending FormData)
    let variants = body.variants ?? [];
    if (typeof variants === "string") {
        try {
            variants = JSON.parse(variants);
        } catch (e) {
            variants = [];
        }
    }

    let imagesFromClient = body.images ?? [];
    if (typeof imagesFromClient === "string") {
        try {
            imagesFromClient = JSON.parse(imagesFromClient);
        } catch (e) {
            imagesFromClient = [];
        }
    }
    imagesFromClient = Array.isArray(imagesFromClient) ? imagesFromClient.map((u) => (u ? String(u).trim() : "")).filter(Boolean) : [];

    // validate product exists
    const existing = await prisma.product.findUnique({ where: { id }, include: { productImage: true } });
    if (!existing) {
        const err = new Error("Product not found");
        err.code = "NOT_FOUND";
        throw err;
    }

    // decide base path for uploaded files -> adjust to match your upload middleware destination
    const uploadsBasePath = "/uploads/messages"; // <--- change if you store to /uploads/products etc.

    // convert multer files to public URL paths
    const fileUrls = Array.isArray(files)
        ? files.map((f) => `${uploadsBasePath}/${f.filename}`)
        : [];

    // final images array: existing URLs from client + uploaded file urls
    const finalImageUrls = [...imagesFromClient, ...fileUrls];

    // start transaction
    const updated = await prisma.$transaction(async (tx) => {
        // 1) update product basic fields (only provided ones)
        const updateData = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;

        // apply update if there're fields to change
        if (Object.keys(updateData).length > 0) {
            await tx.product.update({ where: { id }, data: updateData });
        }

        // 2) handle variants: if client sent variants array -> replace existing variants with new ones
        if (Array.isArray(variants)) {
            // delete old variants
            await tx.productVariant.deleteMany({ where: { productId: id } });

            // create new variants if any
            if (variants.length > 0) {
                // prepare create data
                const createVariants = variants.map((v) => ({
                    productId: id,
                    color: v.color ?? null,
                    size: v.size ?? null,
                    price: v.price != null ? Number(v.price) : 0,
                    discountPrice: v.discountPrice != null ? (v.discountPrice === "" ? null : Number(v.discountPrice)) : null,
                    stock: v.stock != null ? Number(v.stock) : 0,
                }));
                // use createMany for performance (bulk)
                await tx.productVariant.createMany({ data: createVariants });
            }
        }

        // 3) handle images: keep images that are still in finalImageUrls, remove others, add new ones
        const currentImages = await tx.productImage.findMany({ where: { productId: id } });
        const currentUrls = currentImages.map((ci) => ci.url);

        // compute deletes (images currently in DB but NOT in finalImageUrls)
        const toDelete = currentImages.filter((ci) => !finalImageUrls.includes(ci.url));
        if (toDelete.length > 0) {
            const idsToDelete = toDelete.map((d) => d.id);
            await tx.productImage.deleteMany({ where: { id: { in: idsToDelete } } });
        }

        // compute adds (urls in finalImageUrls but not currently in DB)
        const toAdd = finalImageUrls.filter((u) => !currentUrls.includes(u));
        if (toAdd.length > 0) {
            const createImgs = toAdd.map((url) => ({ productId: id, url }));
            await tx.productImage.createMany({ data: createImgs });
        }

        // 4) return updated product with relations
        const product = await tx.product.findUnique({
            where: { id },
            include: { variants: true, productImage: true, category: true },
        });

        return product;
    });

    return updated;
};

export const removeProduct = async (id) => {
    return productRepo.deleteProduct(id);
};

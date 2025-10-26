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

    // parse body if string
    let parsedBody = body;
    if (typeof body === "string") {
        try {
            parsedBody = JSON.parse(body);
        } catch (e) {
            parsedBody = {};
        }
    }

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

    const variants = safeParse(parsedBody.variants); // array of objects
    const providedImages = safeParse(parsedBody.images); // array of URLs (strings)

    if (!name || !categoryId) {
        const err = new Error("Name and categoryId are required");
        err.code = "INVALID_INPUT";
        throw err;
    }

    // REQUIRE at least one variant on create
    if (!Array.isArray(variants) || variants.length === 0) {
        const err = new Error("Phải có ít nhất một variant khi tạo sản phẩm");
        err.code = "INVALID_INPUT";
        throw err;
    }

    // Convert uploaded files to public URL paths
    const fileUrls = (files || []).map((f) => {
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
            const createVariants = variants.map((v) => ({
                productId: p.id,
                color: v.color ?? null,
                size: v.size ?? null,
                price: v.price != null ? Number(v.price) : 0,
                discountPrice:
                    v.discountPrice != null ? (v.discountPrice === "" ? null : Number(v.discountPrice)) : null,
                stock: v.stock != null ? Number(v.stock) : 0,
            }));
            await tx.productVariant.createMany({ data: createVariants });
        }

        if (allImageUrls.length > 0) {
            const createImgs = allImageUrls.map((url) => ({ productId: p.id, url }));
            await tx.productImage.createMany({ data: createImgs });
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

    // parse variants
    let variants = body.variants ?? [];
    if (typeof variants === "string") {
        try { variants = JSON.parse(variants); } catch (e) { variants = []; }
    }
    // ensure array
    variants = Array.isArray(variants) ? variants : [];

    // parse images from client (string/json/array)
    let imagesFromClient = body.images ?? [];
    if (typeof imagesFromClient === "string") {
        try { imagesFromClient = JSON.parse(imagesFromClient); } catch (e) { imagesFromClient = []; }
    }
    imagesFromClient = Array.isArray(imagesFromClient) ? imagesFromClient.map((u) => (u ? String(u).trim() : "")).filter(Boolean) : [];

    // Normalize absolute URLs -> pathname so comparison with DB (which stores '/uploads/..') succeeds
    imagesFromClient = imagesFromClient.map(u => {
        if (/^https?:\/\//i.test(u)) {
            try {
                return new URL(u).pathname; // '/uploads/abc.png'
            } catch (e) {
                return u;
            }
        }
        return u;
    });

    // parse optional explicit deleteVariantIds (client must send explicit)
    let deleteVariantIds = body.deleteVariantIds ?? [];
    if (typeof deleteVariantIds === "string") {
        try { deleteVariantIds = JSON.parse(deleteVariantIds); } catch (e) { deleteVariantIds = []; }
    }
    deleteVariantIds = Array.isArray(deleteVariantIds) ? deleteVariantIds.map(String).filter(Boolean) : [];

    // validate product exists
    const existing = await prisma.product.findUnique({ where: { id }, include: { productImage: true, variants: true } });
    if (!existing) {
        const err = new Error("Product not found");
        err.code = "NOT_FOUND";
        throw err;
    }

    const uploadsBasePath = "/uploads/messages"; // or /uploads/products if you store there

    // convert multer files to public URL paths (match DB scheme)
    const fileUrls = Array.isArray(files)
        ? files.map((f) => `${uploadsBasePath}/${f.filename}`)
        : [];

    // final images = client existing + newly uploaded
    const finalImageUrls = [...imagesFromClient, ...fileUrls];

    // transaction...
    const updated = await prisma.$transaction(async (tx) => {
        const updateData = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;

        if (Object.keys(updateData).length > 0) {
            await tx.product.update({ where: { id }, data: updateData });
        }

        // VARIANTS:
        // - variants with id => update those (only if they belong to this product)
        // - variants without id => create new
        const variantsToUpdate = variants.filter(v => v.id);
        const variantsToCreate = variants.filter(v => !v.id);

        // update existing variants safely (use updateMany to avoid throwing when id invalid)
        for (const v of variantsToUpdate) {
            const data = {
                color: v.color ?? null,
                size: v.size ?? null,
                price: v.price != null ? Number(v.price) : 0,
                discountPrice: v.discountPrice != null ? (v.discountPrice === "" ? null : Number(v.discountPrice)) : null,
                stock: v.stock != null ? Number(v.stock) : 0,
            };
            // update only when id belongs to productId
            await tx.productVariant.updateMany({
                where: { id: v.id, productId: id },
                data,
            });
        }

        // create new variants
        if (variantsToCreate.length > 0) {
            const createVariants = variantsToCreate.map((v) => ({
                productId: id,
                color: v.color ?? null,
                size: v.size ?? null,
                price: v.price != null ? Number(v.price) : 0,
                discountPrice: v.discountPrice != null ? (v.discountPrice === "" ? null : Number(v.discountPrice)) : null,
                stock: v.stock != null ? Number(v.stock) : 0,
            }));
            await tx.productVariant.createMany({ data: createVariants });
        }

        // If client asked to delete specific variants, do it (explicit)
        if (deleteVariantIds.length > 0) {
            // delete only variants that belong to this product
            await tx.productVariant.deleteMany({
                where: { id: { in: deleteVariantIds }, productId: id },
            });
        }

        // Ensure after operations there is at least one variant remaining for the product
        const finalVariantCount = await tx.productVariant.count({ where: { productId: id } });
        if (finalVariantCount === 0) {
            const err = new Error("Sản phẩm phải có ít nhất một variant");
            err.code = "INVALID_INPUT";
            throw err;
        }

        // IMAGES: remove ones not present, add new ones
        const currentImages = await tx.productImage.findMany({ where: { productId: id } });
        const currentUrls = currentImages.map(ci => ci.url);

        // compute deletes (images currently in DB but NOT in finalImageUrls)
        const toDelete = currentImages.filter((ci) => !finalImageUrls.includes(ci.url));
        if (toDelete.length > 0) {
            const idsToDelete = toDelete.map(d => d.id);
            await tx.productImage.deleteMany({ where: { id: { in: idsToDelete } } });
        }

        // compute adds (urls in finalImageUrls but not currently in DB)
        const toAdd = finalImageUrls.filter((u) => !currentUrls.includes(u));
        if (toAdd.length > 0) {
            const createImgs = toAdd.map((url) => ({ productId: id, url }));
            await tx.productImage.createMany({ data: createImgs });
        }

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

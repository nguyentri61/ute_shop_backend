// src/controllers/adminProductController.js
import { parsePagination } from "../utils/pagination.js";
import { successResponse, errorResponse } from "../utils/response.js";
import * as adminProductService from "../services/adminProductService.js";

export const listAdminProducts = async (req, res) => {
    try {
        const { page, size } = parsePagination(req);
        const q = (req.query.q || "").trim();
        const categoryId = req.query.category || undefined;
        const minPrice = req.query.minPrice !== undefined ? req.query.minPrice : undefined;
        const maxPrice = req.query.maxPrice !== undefined ? req.query.maxPrice : undefined;
        const sortPrice = req.query.sortPrice || undefined; // asc|desc
        const sortDate = req.query.sortDate || undefined; // asc|desc

        const { items, total } = await adminProductService.listProducts({
            page,
            size,
            q,
            categoryId,
            minPrice,
            maxPrice,
            sortPrice,
            sortDate,
        });

        return successResponse(res, "Danh sách sản phẩm", {
            items,
            meta: { total, page, size, totalPages: Math.ceil(total / size) },
        });
    } catch (err) {
        console.error("listAdminProducts error:", err);
        return errorResponse(res, err.message || "Lỗi khi lấy danh sách sản phẩm", 500);
    }
};

export const getAdminProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await adminProductService.getProductById(id);
        if (!product) return errorResponse(res, "Không tìm thấy sản phẩm", 404);
        return successResponse(res, "Chi tiết sản phẩm", product);
    } catch (err) {
        console.error("getAdminProduct error:", err);
        return errorResponse(res, err.message || "Lỗi khi lấy chi tiết sản phẩm", 500);
    }
};

const safeParseJson = (val, fallback = []) => {
    if (!val) return fallback;
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
        try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : fallback;
        } catch (e) {
            return fallback;
        }
    }
    return fallback;
};

export const createAdminProduct = async (req, res) => {
    try {
        // copy body and parse potential JSON-strings
        const body = { ...(req.body || {}) };

        // parse arrays that may come as JSON strings
        body.variants = safeParseJson(body.variants, []);
        body.images = safeParseJson(body.images, []);

        // normalize simple fields
        body.name = body.name ? String(body.name).trim() : "";
        body.description = body.description ? String(body.description).trim() : null;
        body.categoryId = body.categoryId ? String(body.categoryId).trim() : "";

        // basic validation
        if (!body.name || !body.categoryId) {
            const err = new Error("Name and categoryId are required");
            err.code = "INVALID_INPUT";
            throw err;
        }

        // files from multer (may be empty array)
        const files = req.files || [];

        // attach user info if available
        const user = req.user || null;

        // build payload for service — service can decide how to store files/urls
        const payload = {
            name: body.name,
            description: body.description,
            categoryId: body.categoryId,
            variants: body.variants,
            images: body.images, // existing image URLs (strings)
            files, // array of uploaded files (multer File objects)
            createdBy: user?.id ?? null,
        };

        const created = await adminProductService.createProduct(payload);
        return successResponse(res, "Tạo sản phẩm thành công", created, 201);
    } catch (err) {
        console.error("createAdminProduct error:", err);
        if (err.code === "INVALID_INPUT") return errorResponse(res, err.message, 400);
        return errorResponse(res, err.message || "Lỗi khi tạo sản phẩm", 500);
    }
};

// controller: updateAdminProduct
export const updateAdminProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            const err = new Error("Product id is required");
            err.code = "INVALID_INPUT";
            throw err;
        }

        // copy body
        const rawBody = { ...(req.body || {}) };

        // support multiple possible field names sent by various frontends
        const rawImages =
            rawBody.images ??
            rawBody.existingImages ??
            rawBody["existingImages[]"] ??
            rawBody["existingImages"] ??
            rawBody.existing_images ??
            [];

        // ensure body.images ends up as JSON-string or array for safeParseJson usage
        rawBody.images = typeof rawImages === "string" ? rawImages : JSON.stringify(rawImages);

        // variants may be JSON string
        rawBody.variants = rawBody.variants ?? rawBody.variants_json ?? rawBody.variantsString ?? rawBody.variants;
        // now safe-parse
        rawBody.variants = safeParseJson(rawBody.variants, []);
        rawBody.images = safeParseJson(rawBody.images, []);

        // normalize simple fields
        if (rawBody.name) rawBody.name = String(rawBody.name).trim();
        if (rawBody.description) rawBody.description = String(rawBody.description).trim();
        if (rawBody.categoryId) rawBody.categoryId = String(rawBody.categoryId).trim();

        const files = req.files || [];
        const user = req.user || null;

        const payload = {
            body: rawBody,
            files,
            user,
            updatedBy: user?.id ?? null,
        };

        const updated = await adminProductService.updateProduct(id, payload);
        return successResponse(res, "Cập nhật sản phẩm thành công", updated);
    } catch (err) {
        console.error("updateAdminProduct error:", err);
        if (err.code === "INVALID_INPUT") return errorResponse(res, err.message, 400);
        if (err.code === "NOT_FOUND") return errorResponse(res, err.message, 404);
        return errorResponse(res, err.message || "Lỗi khi cập nhật sản phẩm", 500);
    }
};

export const deleteAdminProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await adminProductService.removeProduct(id);
        return successResponse(res, "Xóa sản phẩm thành công", deleted);
    } catch (err) {
        console.error("deleteAdminProduct error:", err);
        return errorResponse(res, err.message || "Lỗi khi xóa sản phẩm", 500);
    }
};

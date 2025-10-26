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

export const createAdminProduct = async (req, res) => {
    try {
        // req.body may contain JSON-strings for variants/images; parse safely
        const body = { ...req.body };

        // parse variants if sent as JSON string
        if (body.variants && typeof body.variants === "string") {
            try { body.variants = JSON.parse(body.variants); } catch (e) { body.variants = []; }
        }
        // parse images urls array if sent as JSON string
        if (body.images && typeof body.images === "string") {
            try { body.images = JSON.parse(body.images); } catch (e) { body.images = []; }
        }

        // files from multer
        const files = req.files || []; // array of File objects

        const created = await adminProductService.createProduct({ body, files, user: req.user });
        return successResponse(res, "Tạo sản phẩm thành công", created, 201);
    } catch (err) {
        console.error("createAdminProduct error:", err);
        if (err.code === "INVALID_INPUT") return errorResponse(res, err.message, 400);
        return errorResponse(res, err.message || "Lỗi khi tạo sản phẩm", 500);
    }
};

export const updateAdminProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const payload = req.body || {};
        const updated = await adminProductService.updateProduct(id, payload);
        return successResponse(res, "Cập nhật sản phẩm thành công", updated);
    } catch (err) {
        console.error("updateAdminProduct error:", err);
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

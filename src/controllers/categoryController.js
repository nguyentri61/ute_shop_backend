// src/controllers/categoryController.js
import { parsePagination } from "../utils/pagination.js";
import path from "path";
import fs from "fs";
import { successResponse, errorResponse } from "../utils/response.js";
import * as categoryService from "../services/categoryServices.js";

// NOTE: don't import uploadMedia here — middleware should be attached on routes
// import { uploadMedia } from "../middlewares/uploadMedia.js";

const UPLOADS_PUBLIC_PREFIX = "/uploads/categories";
const categoriesDirAbsolute = path.join(process.cwd(), "public", "uploads", "categories");

/**
 * Convert multer file object -> public url path used in DB, e.g. "/uploads/categories/xxxx.png"
 * folderName: "categories" (used to build path)
 */
const fileToPublicPath = (file, folderName = "categories") => {
    if (!file) return null;
    // file.filename is set by multer storage in your middleware
    const filename = file.filename || (file.path ? path.basename(file.path) : null);
    if (!filename) return null;
    return `/${path.posix.join("uploads", folderName, filename)}`;
};

/* ---------- controllers ---------- */

export const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !String(name).trim()) return errorResponse(res, "Tên danh mục là bắt buộc", 400);

        // if there's an uploaded file -> build public path
        let iconPath = null;
        if (req.file) {
            iconPath = fileToPublicPath(req.file, "categories");
        } else if (req.body.icon) {
            // client may send relative path or absolute URL string
            iconPath = String(req.body.icon).trim() || null;
        }

        // Optional: enforce icon required:
        // if (!iconPath) return errorResponse(res, "Danh mục phải có 1 ảnh", 400);

        const created = await categoryService.createCategory({ name: name.trim(), icon: iconPath });
        return successResponse(res, "Tạo danh mục thành công", created, 201);
    } catch (err) {
        console.error("createCategory error:", err);
        if (err.code === "DUPLICATE_NAME") return errorResponse(res, err.message, 409);
        return errorResponse(res, err.message || "Lỗi khi tạo danh mục", 500);
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (name !== undefined && (!name || !String(name).trim())) {
            return errorResponse(res, "Tên danh mục không hợp lệ", 400);
        }

        // fetch existing
        const existing = await categoryService.getCategoryById(id);
        if (!existing) return errorResponse(res, "Không tìm thấy danh mục", 404);

        // determine new icon:
        // - if req.file -> uploaded new icon
        // - else if body.icon provided -> can be string (path) or empty (to remove)
        let newIcon;
        if (req.file) {
            newIcon = fileToPublicPath(req.file, "categories");
        } else if ("icon" in req.body) {
            const v = req.body.icon;
            newIcon = v ? String(v).trim() : null; // null -> remove
        } else {
            newIcon = undefined; // undefined -> don't change
        }

        // if uploaded a new file and existing.icon was local, try delete old file
        if (req.file && existing?.icon) {
            try {
                // only delete local files stored under /uploads/categories
                if (existing.icon.startsWith("/uploads/categories")) {
                    const filename = existing.icon.split("/").pop();
                    const full = path.join(categoriesDirAbsolute, filename);
                    if (fs.existsSync(full)) fs.unlinkSync(full);
                }
            } catch (e) {
                console.warn("Failed to delete old icon file", e);
            }
        }

        const updated = await categoryService.updateCategory(id, {
            name: name !== undefined ? name.trim() : undefined,
            icon: newIcon,
        });

        return successResponse(res, "Cập nhật danh mục thành công", updated);
    } catch (err) {
        console.error("updateCategory error:", err);
        return errorResponse(res, err.message || "Lỗi khi cập nhật", 500);
    }
};

export const listCategories = async (req, res) => {
    try {
        const { page, size } = parsePagination(req);
        const q = (req.query.q || "").trim();
        const { items, total } = await categoryService.listCategories({ page, size, q });
        return successResponse(res, "Danh sách danh mục", {
            items,
            meta: {
                total,
                page,
                size,
                totalPages: Math.ceil(total / size),
            },
        });
    } catch (err) {
        console.error("listCategories error:", err);
        return errorResponse(res, err.message || "Lỗi khi lấy danh sách", 500);
    }
};

export const getCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await categoryService.getCategoryById(id);
        if (!category) return errorResponse(res, "Không tìm thấy danh mục", 404);
        return successResponse(res, "Chi tiết danh mục", category);
    } catch (err) {
        console.error("getCategory error:", err);
        return errorResponse(res, err.message || "Lỗi khi lấy chi tiết", 500);
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        // fetch existing to remove file if exists
        const existing = await categoryService.getCategoryById(id);
        if (!existing) return errorResponse(res, "Không tìm thấy danh mục", 404);

        // if existing.icon is local, delete file
        if (existing.icon && existing.icon.startsWith("/uploads/categories")) {
            try {
                const filename = existing.icon.split("/").pop();
                const full = path.join(categoriesDirAbsolute, filename);
                if (fs.existsSync(full)) fs.unlinkSync(full);
            } catch (e) {
                console.warn("Failed to delete category icon file on remove", e);
            }
        }

        const deleted = await categoryService.removeCategory(id);
        return successResponse(res, "Xóa danh mục thành công", deleted);
    } catch (err) {
        console.error("deleteCategory error:", err);
        return errorResponse(res, err.message || "Lỗi khi xóa", 500);
    }
};

export const allCategories = async (req, res) => {
    try {
        const categories = await categoryService.getAllCategories();
        return successResponse(res, "Lấy tất cả loại", categories);
    } catch (err) {
        console.error("allCategories error:", err);
        return errorResponse(res, err.message || "Lỗi khi lấy danh sách", 500);
    }
};

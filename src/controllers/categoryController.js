import { parsePagination } from "../utils/pagination.js";
import { successResponse, errorResponse } from "../utils/response.js";
import * as categoryService from "../services/categoryServices.js";

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
        return errorResponse(res, err.message || "Lỗi khi lấy chi tiết", 500);
    }
};

export const createCategory = async (req, res) => {
    try {
        const { name, icon } = req.body;
        if (!name || !name.trim()) return errorResponse(res, "Tên danh mục là bắt buộc", 400);
        const created = await categoryService.createCategory({ name: name.trim(), icon: icon || null });
        return successResponse(res, "Tạo danh mục thành công", created, 201);
    } catch (err) {
        if (err.code === "DUPLICATE_NAME") return errorResponse(res, err.message, 409);
        return errorResponse(res, err.message || "Lỗi khi tạo danh mục", 500);
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, icon } = req.body;
        if (name !== undefined && (!name || !String(name).trim())) {
            return errorResponse(res, "Tên danh mục không hợp lệ", 400);
        }
        const updated = await categoryService.updateCategory(id, { name: name !== undefined ? name.trim() : undefined, icon });
        return successResponse(res, "Cập nhật danh mục thành công", updated);
    } catch (err) {
        return errorResponse(res, err.message || "Lỗi khi cập nhật", 500);
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await categoryService.removeCategory(id);
        return successResponse(res, "Xóa danh mục thành công", deleted);
    } catch (err) {
        return errorResponse(res, err.message || "Lỗi khi xóa", 500);
    }
};
export const allCategories = async (req, res) => {
    try {
        const categories = await getAllCategories();
        return successResponse(res, "Lấy tất cả loại", categories);
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};
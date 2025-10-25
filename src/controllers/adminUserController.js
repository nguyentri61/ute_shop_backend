// src/controllers/adminUserController.js
import { parsePagination } from "../utils/pagination.js";
import { successResponse, errorResponse } from "../utils/response.js";
import * as adminUserService from "../services/adminUserService.js";

// List (admin) with filters: q, role, start, end, page, size
export const listAdminUsers = async (req, res) => {
    try {
        const { page, size } = parsePagination(req);
        const q = (req.query.q || "").trim();
        const role = req.query.role || undefined;
        const start = req.query.start || undefined;
        const end = req.query.end || undefined;

        const { items, total } = await adminUserService.listUsers({ page, size, q, role, start, end });
        return successResponse(res, "Danh sách người dùng", {
            items,
            meta: { total, page, size, totalPages: Math.max(1, Math.ceil(total / size)) },
        });
    } catch (err) {
        return errorResponse(res, err.message || "Lỗi", 500);
    }
};

export const getAdminUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await adminUserService.getUserById(id);
        if (!user) return errorResponse(res, "Không tìm thấy người dùng", 404);
        return successResponse(res, "Chi tiết người dùng", user);
    } catch (err) {
        return errorResponse(res, err.message || "Lỗi", 500);
    }
};

export const createAdminUser = async (req, res) => {
    try {
        const { email, fullName, phone, role, address } = req.body;
        const created = await adminUserService.createUser({ email, fullName, phone, role, address });
        return successResponse(res, "Tạo người dùng thành công", created, 201);
    } catch (err) {
        if (err.code === "DUPLICATE_EMAIL") return errorResponse(res, err.message, 409);
        return errorResponse(res, err.message || "Lỗi", 500);
    }
};

export const updateAdminUser = async (req, res) => {
    try {
        const { id } = req.params;
        const payload = req.body || {};
        const updated = await adminUserService.updateUser(id, payload);
        return successResponse(res, "Cập nhật người dùng thành công", updated);
    } catch (err) {
        return errorResponse(res, err.message || "Lỗi", 500);
    }
};

// "Delete" => soft block the account (blocked = true)
export const deleteAdminUser = async (req, res) => {
    try {
        const { id } = req.params;
        const blocked = await adminUserService.blockUser(id);
        return successResponse(res, "Tài khoản đã bị chặn (soft-block) thành công", blocked);
    } catch (err) {
        return errorResponse(res, err.message || "Lỗi", 500);
    }
};

// PATCH /users/:id/unblock -> unblock user (blocked = false)
export const unblockAdminUser = async (req, res) => {
    try {
        const { id } = req.params;
        const unblocked = await adminUserService.unblockUser(id);
        return successResponse(res, "Mở chặn tài khoản thành công", unblocked);
    } catch (err) {
        return errorResponse(res, err.message || "Lỗi", 500);
    }
};

// PATCH /users/:id/role -> change role
export const changeUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!role || !["USER", "ADMIN"].includes(role)) {
            return errorResponse(res, "Role không hợp lệ", 400);
        }
        const updated = await adminUserService.changeUserRole(id, role);
        return successResponse(res, "Cập nhật vai trò thành công", updated);
    } catch (err) {
        return errorResponse(res, err.message || "Lỗi", 500);
    }
};

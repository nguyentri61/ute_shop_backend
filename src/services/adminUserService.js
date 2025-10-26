// src/services/adminUserService.js
import * as userRepo from "../repositories/userRepository.js";

/**
 * Service layer for admin user management
 * - listUsers: forward to repo with pagination/filters
 * - getUserById
 * - createUser
 * - updateUser
 * - blockUser / unblockUser (soft)
 * - changeUserRole
 */

export const listUsers = async ({ page = 1, size = 10, q = "", role, start, end } = {}) => {
    const skip = (page - 1) * size;
    const take = size;
    return userRepo.findUsers({ skip, take, q, role, start, end });
};

export const getUserById = async (id) => {
    return userRepo.findUserById(id);
};

export const createUser = async ({ email, fullName, phone = null, role = "USER", address = null }) => {
    // check duplicate email
    const existing = await userRepo.findUsers({ skip: 0, take: 1, q: email });
    // findUsers searches name/email/phone; we can do a specific check:
    const byEmail = await userRepo.findUserByEmail(email);
    if (byEmail) {
        const err = new Error("Email đã tồn tại");
        err.code = "DUPLICATE_EMAIL";
        throw err;
    }
    return userRepo.createUser({ email, fullName, phone, role, address });
};

export const updateUser = async (id, payload) => {
    return userRepo.updateUser(id, payload);
};

// Soft-block user (set blocked = true)
export const blockUser = async (id) => {
    // you may check if user exists first
    const user = await userRepo.findUserById(id);
    if (!user) {
        throw new Error("User not found");
    }
    const blocked = await userRepo.setUserBlocked(id, true);
    return blocked;
};

// Unblock user (set blocked = false)
export const unblockUser = async (id) => {
    const user = await userRepo.findUserById(id);
    if (!user) {
        throw new Error("User not found");
    }
    const unblocked = await userRepo.setUserBlocked(id, false);
    return unblocked;
};

// Change user role
export const changeUserRole = async (id, role) => {
    const user = await userRepo.findUserById(id);
    if (!user) {
        throw new Error("User not found");
    }
    // optionally prevent demoting the last admin, etc.
    const updated = await userRepo.setUserRole(id, role);
    return updated;
};

// Backwards-compatible removeUser => block the user (soft)
export const removeUser = async (id) => {
    return blockUser(id);
};

// src/repositories/userRepository.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * findUsers - hỗ trợ tìm kiếm (q), lọc theo role, lọc theo createdAt (start/end), phân trang
 * @param {Object} opts
 * @param {number} opts.skip
 * @param {number} opts.take
 * @param {string} opts.q
 * @param {string} opts.role
 * @param {string} opts.start  // YYYY-MM-DD
 * @param {string} opts.end    // YYYY-MM-DD
 */
export const findUsers = async ({ skip = 0, take = 10, q = "", role, start, end } = {}) => {
    const where = {};

    if (q && q.trim()) {
        const text = q.trim();
        where.OR = [
            { fullName: { contains: text } },
            { email: { contains: text } },
            { phone: { contains: text } },
        ];
    }

    if (role) {
        where.role = role;
    }

    if (start || end) {
        where.createdAt = {};
        if (start) where.createdAt.gte = new Date(`${start}T00:00:00.000Z`);
        if (end) where.createdAt.lte = new Date(`${end}T23:59:59.999Z`);
    }

    const [items, total] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                verified: true,
                blocked: true,
                createdAt: true,
            },
        }),
        prisma.user.count({ where }),
    ]);

    return { items, total };
};

export const findUserById = async (id) => {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            address: true,
            role: true,
            verified: true,
            blocked: true,
            createdAt: true,
        },
    });
};

// helper: find by email (for create)
export const findUserByEmail = async (email) => {
    if (!email) return null;
    return prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, fullName: true },
    });
};

export const createUser = async ({ email, fullName, phone = null, role = "USER", address = null, verified = false }) => {
    return prisma.user.create({
        data: { email, fullName, phone, role, address, verified },
        select: { id: true, email: true, fullName: true, phone: true, role: true, verified: true, blocked: true, createdAt: true },
    });
};

export const updateUser = async (id, payload) => {
    return prisma.user.update({
        where: { id },
        data: {
            ...(payload.fullName !== undefined ? { fullName: payload.fullName } : {}),
            ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
            ...(payload.address !== undefined ? { address: payload.address } : {}),
            ...(payload.role !== undefined ? { role: payload.role } : {}),
            ...(payload.verified !== undefined ? { verified: payload.verified } : {}),
            ...(payload.blocked !== undefined ? { blocked: payload.blocked } : {}),
        },
        select: { id: true, email: true, fullName: true, phone: true, role: true, verified: true, blocked: true, createdAt: true, address: true },
    });
};

// If you still need hard delete somewhere keep this; admin flow should NOT call this.
export const deleteUser = async (id) => {
    return prisma.user.delete({
        where: { id },
        select: { id: true, email: true, fullName: true },
    });
};

// Soft-block helper
export const setUserBlocked = async (id, blocked = true) => {
    return prisma.user.update({
        where: { id },
        data: { blocked },
        select: { id: true, email: true, fullName: true, blocked: true },
    });
};

// Change role helper
export const setUserRole = async (id, role) => {
    return prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, email: true, fullName: true, role: true },
    });
};

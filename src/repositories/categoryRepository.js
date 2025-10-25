// src/repositories/categoryRepository.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * findCategories
 * - skip, take: số lượng / phân trang
 * - q: chuỗi tìm kiếm (hiện tại dùng contains mặc định)
 *
 * Note: removed `mode: "insensitive"` because older @prisma/client versions
 * may not support it. If you want case-insensitive matching regardless of DB
 * collation, see commented alternative below using prisma.$queryRaw (Postgres/SQLite).
 */
export const findCategories = async ({ skip = 0, take = 10, q = "" } = {}) => {
    const where = q
        ? {
            name: {
                contains: q, // no 'mode' here to stay compatible with older prisma clients
            },
        }
        : {};

    const [items, total] = await Promise.all([
        prisma.category.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            select: {
                id: true,
                name: true,
                icon: true,
                createdAt: true,
            },
        }),
        prisma.category.count({ where }),
    ]);

    return { items, total };
};

/**
 * Nếu bạn *muốn* case-insensitive search và DB là Postgres/SQLite, bạn có thể
 * dùng $queryRaw để làm LOWER(name) LIKE '%q%'. Ví dụ (commented):
 *
 * const qLower = `%${q.toLowerCase()}%`;
 * const items = await prisma.$queryRaw`
 *   SELECT id, name, icon, "createdAt"
 *   FROM "Category"
 *   WHERE LOWER(name) LIKE ${qLower}
 *   ORDER BY "createdAt" DESC
 *   LIMIT ${take} OFFSET ${skip}
 * `;
 *
 * const totalRes = await prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "Category" WHERE LOWER(name) LIKE ${qLower}`;
 * const total = totalRes?.[0]?.count ?? 0;
 *
 * (Uncomment & adapt table/column quoting for your provider if needed)
 */

export const findAllCategories = async () => {
    const categories = await prisma.category.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            icon: true,
            createdAt: true,
        },
    });

    return categories;
};

export const findCategoryById = async (id) => {
    return prisma.category.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            icon: true,
            createdAt: true,
        },
    });
};

export const createCategory = async ({ name, icon = null }) => {
    return prisma.category.create({
        data: { name, icon },
        select: { id: true, name: true, icon: true, createdAt: true },
    });
};

export const updateCategory = async (id, { name, icon }) => {
    return prisma.category.update({
        where: { id },
        data: { ...(name !== undefined ? { name } : {}), ...(icon !== undefined ? { icon } : {}) },
        select: { id: true, name: true, icon: true, createdAt: true },
    });
};

export const deleteCategory = async (id) => {
    return prisma.category.delete({
        where: { id },
        select: { id: true, name: true },
    });
};

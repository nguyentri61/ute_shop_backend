// src/utils/pagination.js
export function parsePagination(req) {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const size = Math.max(Math.min(parseInt(req.query.size || "10", 10), 100), 1);
    const skip = (page - 1) * size;
    return { page, size, skip, take: size };
}

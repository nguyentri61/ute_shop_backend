import { PrismaClient, CouponType } from "@prisma/client";

const prisma = new PrismaClient();

/* ========== USER REPOSITORY ========== */

export const findCouponsByUserId = async (userId) => {
  return await prisma.coupon.findMany({
    where: { userId, orderId: null, expiredAt: { gte: new Date() } },
    orderBy: { expiredAt: "asc" },
  });
};

export const findAllCoupons = async () => {
  return await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" }, // nếu không có createdAt thì bỏ dòng này
  });
};

export const findCouponsByTypeAndUserId = async (type, userId) => {
  // ép string sang enum
  let typeEnum;
  switch (String(type).toUpperCase()) {
    case "SHIPPING":
      typeEnum = CouponType.SHIPPING;
      break;
    case "PRODUCT":
      typeEnum = CouponType.PRODUCT;
      break;
    default:
      // fallback an toàn
      typeEnum = CouponType.PRODUCT;
  }

  return await prisma.coupon.findMany({
    where: {
      type: typeEnum,
      userId,
      orderId: null,
      expiredAt: { gte: new Date() },
    },
    orderBy: { expiredAt: "asc" },
  });
};

export const updateCouponOrderId = async (couponId, orderId, client = prisma) => {
  const coupon = await client.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) {
    throw new Error(`Coupon ${couponId} không tồn tại hoặc đã bị xóa.`);
  }
  return await client.coupon.update({
    where: { id: couponId },
    data: { orderId },
  });
};

/* ========== ADMIN REPOSITORY ========== */

// thống kê
export const countAllCoupons = async () => {
  return await prisma.coupon.count();
};

export const countActiveCoupons = async () => {
  return await prisma.coupon.count({
    where: { expiredAt: { gt: new Date() } },
  });
};

export const countExpiredCoupons = async () => {
  return await prisma.coupon.count({
    where: { expiredAt: { lte: new Date() } },
  });
};

export const avgDiscountActiveCoupons = async () => {
  const r = await prisma.coupon.aggregate({
    _avg: { discount: true },
    where: { expiredAt: { gt: new Date() } },
  });
  return r._avg.discount ?? 0;
};

export const groupByType = async () => {
  const rows = await prisma.coupon.groupBy({
    by: ["type"],
    _count: { type: true },
  });
  return rows.map((r) => ({ type: r.type, count: r._count.type }));
};

// expiring trong N ngày
export const findExpiringInDays = async (days = 30) => {
  const now = new Date();
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return await prisma.coupon.findMany({
    where: {
      expiredAt: {
        gte: now,
        lte: end,
      },
    },
    select: { expiredAt: true },
    orderBy: { expiredAt: "asc" },
  });
};

// list + filter + pagination
export const findCouponsWithFilterPaged = async ({
  q,
  type,
  status,
  userId,
  page = 1,
  size = 10,
}) => {
  const where = {};

  // --- 1. Bộ lọc text ---
  if (q) {
    where.OR = [
      { code: { contains: q } },
      { description: { contains: q } },
    ];
  }

  // --- 2. Lọc loại mã ---
  if (type) {
    const t = String(type).toUpperCase();
    if (["PRODUCT", "SHIPPING"].includes(t)) {
      where.type = t;
    }
  }

  // --- 3. Lọc theo userId ---
  if (userId) where.userId = userId;

  // --- 4. Lọc theo trạng thái ---
  if (status === "active") where.expiredAt = { gt: new Date() };
  if (status === "expired") where.expiredAt = { lte: new Date() };

  // --- 5. Lấy danh sách nhóm theo code ---
  const grouped = await prisma.coupon.groupBy({
    by: ["code"],
    where,
    _count: { code: true, userId: true },
    _min: {
      type: true,
      description: true,
      discount: true,
      minOrderValue: true,
      expiredAt: true,
    },
    orderBy: { _min: { expiredAt: "asc" } },
    skip: (page - 1) * size,
    take: size,
  });

  const total = await prisma.coupon.groupBy({
    by: ["code"],
    where,
    _count: { code: true },
  });

  // --- 6. Chuẩn hóa kết quả ---
  const items = grouped.map((g) => ({
    code: g.code,
    type: g._min.type,
    description: g._min.description,
    discount: g._min.discount,
    minOrderValue: g._min.minOrderValue,
    expiredAt: g._min.expiredAt,
    quantity: g._count.code,
    usedCount: g._count.userId,
  }));

  return {
    total: total.length,
    page,
    size,
    items,
  };
};



// CRUD
export const createCouponRepo = async (data) => {
  return await prisma.coupon.create({
    data: {
      code: String(data.code).trim(),
      type: String(data.type).toUpperCase(),
      description: String(data.description).trim(),
      discount: Number(data.discount),
      minOrderValue: Number(data.minOrderValue || 0),
      expiredAt: new Date(data.expiredAt),
      userId: data.userId || null,
    },
  });
};

export const createCouponsRepo = async (data) => {
  const tasks = Array.from({ length: data.quantity }, () => createCouponRepo(data));
  const coupons = await Promise.all(tasks);
  return coupons;
};

export const updateCouponRepo = async (id, data) => {
  const payload = { ...data };

  if (payload.code != null) payload.code = String(payload.code).trim();
  if (payload.type != null) payload.type = String(payload.type).toUpperCase();
  if (payload.description != null) payload.description = String(payload.description).trim();
  if (payload.discount != null) payload.discount = Number(payload.discount);
  if (payload.minOrderValue != null) payload.minOrderValue = Number(payload.minOrderValue);
  if (payload.expiredAt != null) payload.expiredAt = new Date(payload.expiredAt);
  if (payload.userId === "") payload.userId = null;

  return await prisma.coupon.update({
    where: { id },
    data: payload,
  });
};

export const deleteCouponRepo = async (id) => {
  return await prisma.coupon.delete({ where: { id } });
};

// helpers
export const findCouponByCode = async (code) => {
  return await prisma.coupon.findFirst({ where: { code } });
};
export const findCouponById = async (id) => {
  return await prisma.coupon.findUnique({ where: { id } });
};

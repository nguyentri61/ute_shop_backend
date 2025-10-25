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

export const findValidCouponByCode = async (couponCode, userId = null, subTotal = 0) => {
  const orConditions = [{ userId: null }];
  if (userId) orConditions.push({ userId });

  const coupon = await prisma.coupon.findFirst({
    where: {
      code: String(couponCode).trim(),
      orderId: null,
      expiredAt: { gte: new Date() },
      OR: orConditions,
    },
    select: {
      id: true,
      code: true,
      discount: true,
      minOrderValue: true,
      expiredAt: true,
    },
    orderBy: { expiredAt: "asc" },
  });

  if (!coupon) return null;
  console.log("🔍 findValidCouponByCode:", {
    couponCode,
    userId,
    subTotal,
    typeSubTotal: typeof subTotal
  });

  console.log(coupon.minOrderValue);
  if (subTotal < coupon.minOrderValue) return null;
  return coupon;
};

export const findCouponsForUser = async (type, userId) => {
  // ✅ Ép type sang enum hợp lệ
  const typeEnum =
    String(type).toUpperCase() === "SHIPPING"
      ? CouponType.SHIPPING
      : CouponType.PRODUCT;

  // ✅ 1️⃣ Đếm tổng số coupon còn hạn mỗi code
  const grouped = await prisma.coupon.groupBy({
    by: ["code"],
    where: {
      type: typeEnum,
      expiredAt: { gte: new Date() },
    },
    _count: { _all: true },
  });

  // ✅ 2️⃣ Đếm số coupon đã dùng (có orderId hoặc userId)
  const used = await prisma.coupon.groupBy({
    by: ["code"],
    where: {
      type: typeEnum,
      expiredAt: { gte: new Date() },
      orderId: { not: null },
    },
    _count: { _all: true },
  });

  // ✅ 3️⃣ Map số lượng đã dùng
  const usedMap = Object.fromEntries(
    used.map((u) => [u.code, u._count._all])
  );

  // ✅ 4️⃣ Lấy danh sách mã hợp lệ (1 bản ghi / code)
  const coupons = await prisma.coupon.groupBy({
    by: ["code"],
    where: {
      type: typeEnum,
      orderId: null,
      expiredAt: { gte: new Date() },
      OR: [{ userId: userId }, { userId: null }],
    },
    _min: {
      discount: true,
      expiredAt: true,
      minOrderValue: true,
    },
  });

  // ✅ 5️⃣ Tính remaining & lọc mã hết lượt
  return coupons
    .map((c) => {
      const total = grouped.find((g) => g.code === c.code)?._count._all || 0;
      const usedCount = usedMap[c.code] || 0;
      const remaining = Math.max(total - usedCount, 0);

      return {
        code: c.code,
        discount: c._min.discount,
        expiredAt: c._min.expiredAt,
        minOrderValue: c._min.minOrderValue ?? 0,
        remaining,
      };
    })
    .filter((c) => c.remaining > 0)
    .sort((a, b) => new Date(a.expiredAt) - new Date(b.expiredAt));
};




export const updateCouponOrderId = async (couponCode, orderId, userId = null, client = prisma) => {
  const orConditions = [{ userId: null }];
  if (userId) orConditions.push({ userId });

  const coupon = await client.coupon.findFirst({
    where: {
      code: couponCode,
      orderId: null,
      expiredAt: { gte: new Date() },
      OR: orConditions,
    },
    orderBy: { expiredAt: "asc" },
  });

  if (!coupon) {
    throw new Error(`Mã giảm giá "${couponCode}" không tồn tại hoặc không còn hợp lệ.`);
  }

  return await client.coupon.update({
    where: { id: coupon.id },
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
    where: { expiredAt: { gt: new Date() }, discount: { gt: 1 } },
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

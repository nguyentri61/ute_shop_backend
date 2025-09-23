import { PrismaClient, CouponType } from "@prisma/client";

const prisma = new PrismaClient();

export const findCouponsByUserId = async (userId) => {
  return await prisma.coupon.findMany({
    where: { userId, orderId: null, expiredAt: { gte: new Date() } },
  });
};

export const findAllCoupons = async () => {
  return await prisma.coupon.findMany();
};

export const findCouponsByTypeAndUserId = async (type, userId) => {
  // ép string từ query thành enum Prisma
  const typeEnum =
    type === "SHIPPING" ? CouponType.SHIPPING : CouponType.PRODUCT;

  const coupons = await prisma.coupon.findMany({
    where: {
      type: typeEnum, // ✅ lọc chính xác theo type
      userId,
      orderId: null,
      expiredAt: { gte: new Date() },
    },
    orderBy: {
      expiredAt: "asc",
    },
  });

  return coupons; // nếu không có, findMany sẽ trả []
};

export const updateCouponOrderId = async (
  couponId,
  orderId,
  client = prisma
) => {
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) {
    throw new Error(`Coupon ${couponId} không tồn tại hoặc đã bị xóa.`);
  }
  return await client.coupon.update({
    where: { id: couponId },
    data: { orderId },
  });
};

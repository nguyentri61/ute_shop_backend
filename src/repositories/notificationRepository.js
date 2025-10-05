import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const notificationRepository = {
  async createNotification(data, client = prisma) {
    return await client.notification.create({ data });
  },
  async findNotificationsByUserId(userId) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10, // 👈 chỉ lấy 10 thông báo mới nhất
    });
  },
  async markAsRead(userId) {
    return await prisma.notification.updateMany({
      where: { userId },
      data: { isRead: true },
    });
  },
};

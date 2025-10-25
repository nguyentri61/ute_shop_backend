import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/* ========== CONVERSATION REPOSITORY ========== */

// 🔹 Tạo hội thoại mới cho user (nếu chưa có)
export const createConversationForUser = async (userId) => {
  return await prisma.conversation.create({
    data: { userId },
  });
};

// 🔹 Lấy tất cả hội thoại (dành cho ADMIN): include user và messages
export const findAll = async (userId) => {
  const conversations = await prisma.conversation.findMany({
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      messages: {
        select: {
          id: true,
          content: true,
          isRead: true,
          senderId: true,
          createdAt: true,
          type: true,
        },
        orderBy: { createdAt: "desc" }, // tin nhắn cũ nhất trước
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return conversations.map((c) => {
    const firstMessage = c.messages[0] || null;
    const unreadMessages = c.messages.filter(
      (m) => !m.isRead && m.senderId !== userId
    );

    return {
      id: c.id,
      user: c.user,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      firstMessage,
      unreadCount: unreadMessages.length,
    };
  });
};

// 🔹 Lấy hội thoại theo userId (nếu chưa có thì trả null)
export const findByUserId = async (userId) => {
  return await prisma.conversation.findFirst({
    where: { userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
};

// 🔹 Lấy hội thoại theo id
export const findById = async (id) => {
  return await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
};

export const markAllAsRead = async (conversationId, userId) => {
  const result = await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      isRead: false,
    },
    data: { isRead: true },
  });

  return result; // { count: <số tin nhắn được cập nhật> }
};

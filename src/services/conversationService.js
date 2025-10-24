import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import * as conversationRepo from "../repositories/conversationRepository.js";

// Giữ instance socket.io (namespace /chat)
let ioChat;

/**
 * Khởi tạo namespace /chat và xử lý các event socket
 */
export const initChatSocket = (io) => {
  ioChat = io.of("/chat");

  ioChat.on("connection", (socket) => {
    console.log("[Chat] Client connected:", socket.id);

    // 1️⃣ Đăng ký user/admin
    socket.on("register_chat", ({ userId, role }) => {
      if (!userId || !role) return;
      socket.data.userId = userId;
      socket.data.role = role;

      if (role === "ADMIN") {
        socket.join("admin");
      } else {
        socket.join(`user:${userId}`);
      }

      console.log(`[Chat] ${role} ${userId} registered.`);
    });

    // 2️⃣ Tham gia phòng conversation cụ thể
    socket.on("join_conversation", (conversationId) => {
      if (!conversationId) return;
      socket.join(`conversation:${conversationId}`);
      console.log(
        `[Chat] Socket ${socket.id} joined conversation:${conversationId}`
      );
    });

    socket.on("disconnect", () => {
      console.log("[Chat] Disconnected:", socket.id);
    });
  });
};

// 🧩 Lấy danh sách hội thoại
export const getConversations = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) throw new Error("User not found");

  if (user.role === "ADMIN") {
    return await conversationRepo.findAll(userId);
  } else {
    let conversation = await conversationRepo.findByUserId(userId);
    if (!conversation) {
      conversation = await conversationRepo.createConversationForUser(userId);
    }
    return conversation;
  }
};

// 🧩 Lấy chi tiết hội thoại theo ID
export const getConversationByIdService = async (userId, conversationId) => {
  const conversation = await conversationRepo.findById(conversationId);
  if (!conversation) throw new Error("Conversation not found");

  await conversationRepo.markAllAsRead(conversationId, userId);
  return conversation;
};

// 💬 Gửi tin nhắn
export const sendMessageService = async ({
  senderId,
  conversationId,
  type = "TEXT",
  content,
  file,
}) => {
  // 1️⃣ Kiểm tra hoặc tạo conversation
  let conv = conversationId
    ? await conversationRepo.findById(conversationId)
    : await conversationRepo.findByUserId(senderId);

  if (!conv) {
    conv = await conversationRepo.createConversationForUser(senderId);
  }

  // 2️⃣ Xử lý file đính kèm
  const mediaUrl = file ? `/public/uploads/messages/${file.filename}` : null;

  // 3️⃣ Lưu message
  const savedMessage = await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId,
      type,
      content: content || null,
      mediaUrl,
    },
  });

  // 4️⃣ Cập nhật thời gian conversation
  await prisma.conversation.update({
    where: { id: conv.id },
    data: { updatedAt: new Date() },
  });

  // 5️⃣ Gửi realtime
  try {
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { role: true },
    });

    if (ioChat) {
      // Gửi đến tất cả trong phòng conversation
      ioChat.to(`conversation:${conv.id}`).emit("new_message", savedMessage);

      // Gửi riêng cho đối tượng còn lại
      if (sender.role === "ADMIN") {
        ioChat.to(`user:${conv.userId}`).emit("new_message", savedMessage);
      } else {
        console.log();
        ioChat.to("admin").emit("new_message", savedMessage);
      }
    }
  } catch (err) {
    console.warn("[Chat] Emit error:", err.message);
  }

  return savedMessage;
};

// src/repositories/messageRepository.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createMessage = async (data) => {
  return prisma.message.create({ data });
};

export const findMessagesByConversation = async (
  conversationId,
  limit = 100
) => {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
};

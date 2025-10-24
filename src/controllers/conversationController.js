import { markAllAsRead } from "../repositories/conversationRepository.js";
import {
  getConversationByIdService,
  getConversations,
  sendMessageService,
} from "../services/conversationService.js";
import { errorResponse, successResponse } from "../utils/response.js";

export const getConversation = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, "Người dùng chưa đăng nhập", 401);
    }
    const conversation = await getConversations(userId);
    return successResponse(res, "Lấy hội thoại thành công", conversation);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const getConversationById = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, "Người dùng chưa đăng nhập", 401);
    }
    const conversationId = req.params.id;
    const conversation = await getConversationByIdService(
      userId,
      conversationId
    );

    return successResponse(res, "Lấy hội thoại thành công", conversation);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const markConversationAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, "Người dùng chưa đăng nhập", 401);
    }

    const conversationId = req.params.id;
    const result = await markAllAsRead(conversationId, userId);
    return successResponse(res, "Đánh dấu đã đọc thành công", result);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user?.id;
    if (!senderId) return errorResponse(res, "Người dùng chưa đăng nhập", 401);

    const { conversationId, type, content } = req.body;
    const file = req.file; // multer

    const msg = await sendMessageService({
      senderId,
      conversationId,
      type, // 'TEXT'|'IMAGE'|'VIDEO'
      content,
      file, // may be undefined
    });

    return successResponse(res, "Gửi tin nhắn thành công", msg);
  } catch (err) {
    return errorResponse(res, err.message || "Lỗi server", 500);
  }
};

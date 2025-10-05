import {
  getNotificationsByUserId,
  markNotificationAsRead,
} from "../services/notificationService.js";
import { errorResponse, successResponse } from "../utils/response.js";

export const getNotification = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return errorResponse(res, "Người dùng chưa đăng nhập", 401);

    const notifications = await getNotificationsByUserId(userId);

    return successResponse(res, "Lấy thông báo thành công", {
      notifications,
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return errorResponse(res, "Người dùng chưa đăng nhập", 401);
    await markNotificationAsRead(userId);
    return successResponse(res, "Đánh dấu đã đọc thành công");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

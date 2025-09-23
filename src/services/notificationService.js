// src/services/notificationService.js
let ioInstance;

export const initNotification = (io) => {
  ioInstance = io;
};

// Gửi notification cho admin
export const notifyAdmin = ({ message, type = "info", link = "" }) => {
  console.log("Thông báo đánh giá trước");
  if (!ioInstance) return;
  console.log("Thông báo đánh giá");
  ioInstance.of("/notification").to("admin").emit("notification", {
    message,
    type,
    link,
    userId: null, // admin không cần userId
  });
};

// Gửi notification cho 1 user
export const notifyUser = ({ userId, message, type = "info", link = "" }) => {
  if (!ioInstance || !userId) return;
  ioInstance.of("/notification").to(`user:${userId}`).emit("notification", {
    userId,
    message,
    type,
    link,
  });
};

// Gửi notification cho tất cả (user + admin)
export const notifyAll = ({ message, type = "info", link = "" }) => {
  if (!ioInstance) return;
  ioInstance.of("/notification").emit("notification", { message, type, link });
};

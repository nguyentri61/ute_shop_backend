// src/routes/coupon.routes.js
import express from "express";

import { authMiddleware } from "../middlewares/authMiddlewares.js";
import {
  getConversation,
  getConversationById,
  markConversationAsRead,
  sendMessage,
} from "../controllers/conversationController.js";
import { uploadMedia } from "../middlewares/uploadMedia.js";

const router = express.Router();

// Tất cả route bên dưới yêu cầu đăng nhập
router.use(authMiddleware);

/* =========================
 *          Conversation Routes
 * ========================= */

router.get("/all", authMiddleware, getConversation);
router.get("/:id", authMiddleware, getConversationById);
router.post(
  "/messages",
  authMiddleware,
  uploadMedia.single("media"),
  sendMessage
);
router.put("/mark-as-read/:id", authMiddleware, markConversationAsRead);

export default router;

import express from "express";
import { authMiddleware } from "../middlewares/authMiddlewares.js";
import {
  getNotification,
  markAsRead,
} from "../controllers/notificationController.js";
const router = express.Router();

router.use(authMiddleware);

router.get("/all", getNotification);
router.put("/mark-as-read", markAsRead);
export default router;

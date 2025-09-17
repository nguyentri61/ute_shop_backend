import express from "express";
import { updateUser, getCurrentUser } from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// Tất cả routes user đều cần xác thực
router.use(authMiddleware);

// Get current user info
router.get("/me", getCurrentUser);

// Update user profile
router.put("/update", updateUser);

export default router;

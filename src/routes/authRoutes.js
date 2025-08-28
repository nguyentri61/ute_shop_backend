import express from "express";
import {
  forgetPassword,
  login,
  register,
  verifyOtp,
  getMyProfile,
} from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddlewares.js";
const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/forgot-password", forgetPassword);

// nếu mà API nào cần xác thực thì thêm middleware authMiddleware nhé ae
// app.get("/api/profile", authMiddleware, (req, res) => {
//   res.json({ message: "Welcome!", user: req.user });
// });
router.get("/my-profile", authMiddleware, getMyProfile);
export default router;

import express from "express";
import {
  forgetPassword,
  login,
  register,
  verifyOtp,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/forgot-password", forgetPassword);

// nếu mà API nào cần xác thực thì thêm middleware authMiddleware nhé ae
// app.get("/api/profile", authMiddleware, (req, res) => {
//   res.json({ message: "Welcome!", user: req.user });
// });
export default router;

import {
  forgetPasswordService,
  loginService,
  registerService,
  verifyOtpService,
  getProfileById,
} from "../services/authServices.js";
import { errorResponse, successResponse } from "../utils/response.js";

export const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await registerService(email, password);
    return successResponse(res, result.message);
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyOtpService(email, otp);
    return successResponse(res, result.message);
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginService(email, password);
    return successResponse(res, result.message, {
      accessToken: result.accessToken,
    });
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
};

export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await forgetPasswordService(email);
    return successResponse(res, result.message);
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ code: 401, message: "Unauthorized", data: null });

    const user = await getProfileById(userId);
    if (!user) return res.status(404).json({ code: 404, message: "User not found", data: null });

    return res.status(200).json({ code: 200, message: "OK", data: user });
  } catch (err) {
    console.error("getMyProfile error:", err);
    return res.status(500).json({ code: 500, message: "Server error", data: null });
  }
};
